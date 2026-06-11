from django.urls import path
from .views import CreateCheckoutSessionView, BillingPortalView, SubscriptionStatusView, StripeWebhookView

urlpatterns = [
    path('create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
    path('portal/', BillingPortalView.as_view(), name='billing-portal'),
    path('status/', SubscriptionStatusView.as_view(), name='subscription-status'),
    path('webhooks/', StripeWebhookView.as_view(), name='stripe-webhook'),
]
