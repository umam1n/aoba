"""
AOBA Audit Log Mixin

Automatically logs create, update, and delete operations to the AuditLog table.
Captures user, company, resource type, resource ID, IP address, and metadata.
"""
import logging

from rest_framework import mixins

logger = logging.getLogger(__name__)


class AuditLogMixin:
    """
    DRF ViewSet mixin that auto-logs data mutations to AuditLog.

    Usage:
        class EmployeeViewSet(AuditLogMixin, viewsets.ModelViewSet):
            audit_resource_type = 'employee'
    """
    audit_resource_type = 'unknown'

    def _get_client_ip(self, request):
        """Extract client IP from request, handling proxies."""
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def _log_action(self, request, action, resource_id, metadata=None):
        """Write an audit log entry."""
        # Import here to avoid circular imports
        from compliance.models import AuditLog

        company = getattr(request, 'company', None)
        if not company:
            return

        try:
            AuditLog.objects.create(
                company=company,
                user=request.user if request.user.is_authenticated else None,
                action=action,
                resource_type=self.audit_resource_type,
                resource_id=str(resource_id),
                metadata=metadata or {},
                ip_address=self._get_client_ip(request),
            )
        except Exception as e:
            # Never let audit logging break the actual operation
            logger.error(f"Audit log failed: {e}")

    def perform_create(self, serializer):
        """Log create operations."""
        instance = serializer.save()
        self._log_action(
            self.request, 'create', instance.pk,
            metadata={'fields': list(serializer.validated_data.keys())}
        )
        return instance

    def perform_update(self, serializer):
        """Log update operations with changed fields."""
        old_data = {
            field: str(getattr(serializer.instance, field, ''))
            for field in serializer.validated_data.keys()
        }
        instance = serializer.save()
        changed_fields = {
            field: {'old': old_data.get(field), 'new': str(value)}
            for field, value in serializer.validated_data.items()
            if old_data.get(field) != str(value)
        }
        self._log_action(
            self.request, 'update', instance.pk,
            metadata={'changed_fields': changed_fields}
        )
        return instance

    def perform_destroy(self, instance):
        """Log delete operations."""
        resource_id = instance.pk
        self._log_action(
            self.request, 'delete', resource_id,
            metadata={'resource_type': self.audit_resource_type}
        )
        instance.delete()
