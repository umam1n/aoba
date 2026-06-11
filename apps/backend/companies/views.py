"""
AOBA Companies Views

Company CRUD, onboarding flow, and membership management.
All querysets are tenant-isolated via request.company.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.audit import AuditLogMixin
from core.permissions import IsHRAdmin, IsHRAdminOrReadOnly, CompanyScopedPermission
from .models import Company, CompanyMembership
from .serializers import (
    CompanySerializer,
    CompanyOnboardingSerializer,
    CompanyMembershipSerializer,
)


class CompanyViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Company management endpoints.

    list:   GET /api/v1/companies/          — returns the caller's company
    create: POST /api/v1/companies/         — onboarding (creates company + first membership)
    retrieve/update/partial_update/destroy: standard CRUD

    Custom actions:
        POST /api/v1/companies/{id}/onboard/ — lightweight onboarding endpoint
    """

    serializer_class = CompanySerializer
    permission_classes = [CompanyScopedPermission, IsHRAdminOrReadOnly]
    audit_resource_type = 'company'

    def get_queryset(self):
        """Tenant-isolated: return only the caller's company."""
        company = getattr(self.request, 'company', None)
        if company:
            return Company.objects.filter(id=company.id)
        return Company.objects.none()

    def get_serializer_class(self):
        if self.action == 'onboard':
            return CompanyOnboardingSerializer
        return CompanySerializer

    def perform_create(self, serializer):
        """Create company and associate the requesting user as HR admin."""
        instance = serializer.save()
        # Create the founding membership
        CompanyMembership.objects.create(
            company=instance,
            user=self.request.user,
            role='hr_admin',
        )
        # Attach to request so audit logging works
        self.request.company = instance
        self._log_action(
            self.request, 'create', instance.pk,
            metadata={'fields': list(serializer.validated_data.keys())},
        )
        return instance

    @action(detail=True, methods=['post'], permission_classes=[IsHRAdmin])
    def onboard(self, request, pk=None):
        """
        Complete onboarding for an existing company.

        Accepts additional firmographic data and transitions
        subscription_status from 'trial' to 'active' once
        Stripe checkout is confirmed (handled by billing webhook).
        """
        company = self.get_object()
        serializer = CompanyOnboardingSerializer(
            company, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(CompanySerializer(company).data)


class CompanyMembershipViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Manage company memberships (invite users, change roles, remove).

    list:   GET /api/v1/companies/memberships/
    create: POST /api/v1/companies/memberships/  — invite a user
    update: PUT/PATCH                            — change role
    delete: DELETE                               — remove member
    """

    serializer_class = CompanyMembershipSerializer
    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'company_membership'

    def get_queryset(self):
        """Return memberships for the caller's company only."""
        company = getattr(self.request, 'company', None)
        if company:
            return CompanyMembership.objects.filter(
                company=company,
            ).select_related('user', 'company', 'employee')
        return CompanyMembership.objects.none()
