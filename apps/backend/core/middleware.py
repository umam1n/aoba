"""
AOBA Multi-Tenant Middleware

Two middlewares:
1. CompanyMiddleware — extracts X-Company-ID header, validates tenant, attaches to request
2. DelinquencyGuardMiddleware — blocks non-billing API access for delinquent accounts
"""
import logging

from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from companies.models import Company

logger = logging.getLogger(__name__)
User = get_user_model()

# Paths exempt from company ID requirement (auth, billing, health)
COMPANY_EXEMPT_PATHS = [
    '/admin',
    '/api/v1/billing/webhooks',
    '/health',
]

# Paths accessible even when delinquent
DELINQUENCY_EXEMPT_PATHS = [
    '/admin',
    '/api/v1/billing',
    '/api/v1/compliance/charter',
    '/health',
]


class CompanyMiddleware:
    """
    Extracts X-Company-ID from request headers and attaches
    the validated Company instance to request.company.

    All API endpoints (except exempt paths) require this header.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip exempt paths
        if any(request.path.startswith(p) for p in COMPANY_EXEMPT_PATHS):
            request.company = None
            return self.get_response(request)

        # Skip if already set by an upstream middleware (e.g. LocalAuthMiddleware)
        if getattr(request, 'company', None):
            return self.get_response(request)

        company_id = request.META.get('HTTP_X_COMPANY_ID')

        if not company_id:
            return JsonResponse(
                {'error': 'X-Company-ID header is required'},
                status=400
            )

        try:
            company = Company.objects.get(id=company_id)
        except (Company.DoesNotExist, ValueError):
            return JsonResponse(
                {'error': 'Invalid company ID'},
                status=404
            )

        request.company = company
        return self.get_response(request)


class DelinquencyGuardMiddleware:
    """
    Blocks API access for companies with delinquent payment status.
    Allows access to billing endpoints so they can fix payment.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        company = getattr(request, 'company', None)

        if company and company.is_delinquent:
            if not any(request.path.startswith(p) for p in DELINQUENCY_EXEMPT_PATHS):
                logger.warning(
                    f"Delinquent company {company.id} blocked from {request.path}"
                )
                return JsonResponse(
                    {
                        'error': 'Account suspended due to payment issue',
                        'code': 'DELINQUENT_ACCOUNT',
                        'message': 'Please update your payment method to restore access.',
                    },
                    status=402
                )

        return self.get_response(request)

class LocalAuthMiddleware:
    """
    Local development middleware to bypass Supabase JWT auth.
    Reads X-Mock-Email header and authenticates that user.
    ONLY active when settings.DEBUG is True.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.DEBUG:
            return self.get_response(request)

        mock_email = request.headers.get('X-Mock-Email')
        if mock_email:
            try:
                user = User.objects.get(email=mock_email)
                request.user = user
                
                # Fetch their default company or first membership
                membership = user.company_memberships.first()
                if membership:
                    request.company = membership.company
                    request.app_role = membership.role
                    logger.debug(f"MockAuth: Authenticated as {user.email} (Role: {request.app_role})")
                else:
                    logger.warning(f"MockAuth: User {user.email} has no company memberships.")
            except User.DoesNotExist:
                logger.warning(f"MockAuth: User with email {mock_email} not found.")

        return self.get_response(request)
