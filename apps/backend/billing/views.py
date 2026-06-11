import stripe
from django.conf import settings
from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import BillingEvent
from .serializers import BillingEventSerializer, SubscriptionSerializer
from core.audit import AuditLogMixin
from core.permissions import IsHRAdmin
import logging

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(views.APIView):
    permission_classes = [IsHRAdmin]

    def post(self, request):
        company = request.company
        tier_key = request.data.get('tier', 'starter')
        
        tier_info = settings.BILLING_TIERS.get(tier_key)
        if not tier_info or not tier_info.get('active'):
            return Response({'error': 'Invalid or inactive billing tier'}, status=status.HTTP_400_BAD_REQUEST)
            
        price_id = tier_info.get('stripe_price_id')
        if not price_id:
             return Response({'error': 'Price ID not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # If company already has a stripe customer id, use it
            customer_kwargs = {}
            if company.stripe_customer_id:
                customer_kwargs['customer'] = company.stripe_customer_id
            else:
                customer_kwargs['customer_email'] = request.user.email

            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[
                    {
                        'price': price_id,
                        'quantity': 1,
                    },
                ],
                mode='subscription',
                success_url=request.build_absolute_uri('/dashboard/settings?session_id={CHECKOUT_SESSION_ID}'),
                cancel_url=request.build_absolute_uri('/dashboard/settings'),
                client_reference_id=str(company.id),
                **customer_kwargs
            )
            return Response({'id': checkout_session.id, 'url': checkout_session.url})
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BillingPortalView(views.APIView):
    permission_classes = [IsHRAdmin]

    def post(self, request):
        company = request.company
        if not company.stripe_customer_id:
            return Response({'error': 'No billing history found'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            portalSession = stripe.billing_portal.Session.create(
                customer=company.stripe_customer_id,
                return_url=request.build_absolute_uri('/dashboard/settings'),
            )
            return Response({'url': portalSession.url})
        except Exception as e:
            logger.error(f"Error creating billing portal session: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubscriptionStatusView(views.APIView):
    permission_classes = [IsHRAdmin]

    def get(self, request):
        company = request.company
        serializer = SubscriptionSerializer({
            'subscription_status': company.subscription_status,
            'subscription_tier': company.subscription_tier,
            'is_delinquent': company.is_delinquent,
            'stripe_customer_id': company.stripe_customer_id,
            'stripe_subscription_id': company.stripe_subscription_id,
        })
        return Response(serializer.data)


class StripeWebhookView(views.APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        event = None

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # Handle the event
        from companies.models import Company
        event_type = event.type
        data_object = event.data.object
        
        try:
            if event_type == 'checkout.session.completed':
                company_id = data_object.client_reference_id
                company = Company.objects.get(id=company_id)
                company.stripe_customer_id = data_object.customer
                company.stripe_subscription_id = data_object.subscription
                company.subscription_status = 'active'
                company.is_delinquent = False
                company.save()
                
            elif event_type == 'invoice.paid':
                customer_id = data_object.customer
                company = Company.objects.get(stripe_customer_id=customer_id)
                company.subscription_status = 'active'
                company.is_delinquent = False
                company.save()
                
                BillingEvent.objects.create(
                    company=company,
                    stripe_event_id=event.id,
                    event_type=event_type,
                    amount=data_object.amount_paid / 100.0 if data_object.amount_paid else 0,
                    currency=data_object.currency
                )

            elif event_type == 'invoice.payment_failed':
                customer_id = data_object.customer
                company = Company.objects.get(stripe_customer_id=customer_id)
                company.is_delinquent = True
                company.subscription_status = 'past_due'
                company.save()
                
                BillingEvent.objects.create(
                    company=company,
                    stripe_event_id=event.id,
                    event_type=event_type,
                    amount=data_object.amount_due / 100.0 if data_object.amount_due else 0,
                    currency=data_object.currency
                )
                
            elif event_type == 'customer.subscription.deleted':
                customer_id = data_object.customer
                company = Company.objects.get(stripe_customer_id=customer_id)
                company.subscription_status = 'canceled'
                company.save()

            elif event_type == 'customer.subscription.updated':
                customer_id = data_object.customer
                company = Company.objects.get(stripe_customer_id=customer_id)
                status_mapped = data_object.status
                if status_mapped in ['active', 'trialing']:
                    company.is_delinquent = False
                else:
                    company.is_delinquent = True
                company.subscription_status = status_mapped
                company.save()

        except Company.DoesNotExist:
            logger.warning(f"Webhook received for unknown customer: {data_object.get('customer')}")
        except Exception as e:
            logger.error(f"Error processing webhook {event_type}: {e}")

        return Response(status=status.HTTP_200_OK)
