"""
AOBA Role-Based Permissions

Three permission tiers:
- HR Admin: full access to all company data, risk scores, surveys, billing
- Manager: team-scoped view (own direct reports, aggregated team metrics)
- Employee: self-view only (own charter, consent management, survey responses)
"""
from rest_framework import permissions


class IsHRAdmin(permissions.BasePermission):
    """
    Full access to all company data.
    Only HR admins can view risk scores, manage surveys, configure billing.
    """
    message = 'HR Admin access required.'

    def has_permission(self, request, view):
        return getattr(request, 'app_role', None) == 'hr_admin'


class IsManager(permissions.BasePermission):
    """
    Team-scoped access. Managers can view their direct reports' non-sensitive data.
    """
    message = 'Manager access required.'

    def has_permission(self, request, view):
        return getattr(request, 'app_role', None) in ('hr_admin', 'manager')


class IsEmployee(permissions.BasePermission):
    """
    Self-view access. Any authenticated employee can access their own data.
    """
    message = 'Employee access required.'

    def has_permission(self, request, view):
        return getattr(request, 'app_role', None) in ('hr_admin', 'manager', 'employee')


class IsHRAdminOrReadOnly(permissions.BasePermission):
    """
    HR Admins get full access; managers and employees get read-only.
    """
    message = 'Write access requires HR Admin role.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return getattr(request, 'app_role', None) in ('hr_admin', 'manager', 'employee')
        return getattr(request, 'app_role', None) == 'hr_admin'


class CompanyScopedPermission(permissions.BasePermission):
    """
    Ensures users can only access data within their own company tenant.
    Works with CompanyMiddleware to validate X-Company-ID.
    """
    message = 'Cross-tenant access denied.'

    def has_permission(self, request, view):
        company = getattr(request, 'company', None)
        if not company:
            return False

        # If supabase_claims is available, use it (production/JWT flow)
        if hasattr(request, 'supabase_claims'):
            user_company_id = request.supabase_claims.get('app_metadata', {}).get('company_id')
            return str(company.id) == str(user_company_id)
        
        # Fallback for LocalAuthMiddleware in DEBUG mode
        from django.conf import settings
        if settings.DEBUG and request.user.is_authenticated:
            return request.user.company_memberships.filter(company=company).exists()

        return False
