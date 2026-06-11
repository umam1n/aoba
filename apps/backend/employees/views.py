"""
AOBA Employee Views

Employee CRUD, CSV import endpoint, and history sub-resources.
All querysets are tenant-isolated via request.company.
"""
import base64
import logging

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from core.audit import AuditLogMixin
from core.permissions import (
    IsHRAdmin,
    IsHRAdminOrReadOnly,
    IsManager,
    CompanyScopedPermission,
)
from .models import (
    Employee,
    RoleHistory,
    CompensationHistory,
    LeaveRecord,
)
from .serializers import (
    EmployeeSerializer,
    EmployeeListSerializer,
    RoleHistorySerializer,
    CompensationHistorySerializer,
    LeaveRecordSerializer,
)
from .importers import compute_file_hash, run_import

logger = logging.getLogger(__name__)

# Threshold for async import (rows estimated from file size)
ASYNC_IMPORT_SIZE_THRESHOLD = 500 * 1024  # 500 KB


class EmployeeViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Employee CRUD with tenant isolation.

    list:     GET /api/v1/employees/          — lightweight list
    retrieve: GET /api/v1/employees/{id}/     — full detail with histories
    create:   POST /api/v1/employees/         — add employee
    update:   PUT/PATCH /api/v1/employees/{id}/
    delete:   DELETE /api/v1/employees/{id}/

    Custom actions:
        GET /api/v1/employees/{id}/history/  — combined history timeline

    Supports filtering by department, role_level, employment_status,
    and searching by full_name, employee_code.
    """

    permission_classes = [CompanyScopedPermission, IsHRAdminOrReadOnly]
    audit_resource_type = 'employee'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'division', 'role_level', 'employment_status', 'exit_type']
    search_fields = ['employee_code', 'full_name', 'role_title']
    ordering_fields = ['hire_date', 'updated_at', 'employee_code', 'department']
    ordering = ['-updated_at']

    def get_queryset(self):
        """Tenant-isolated employee queryset with optimised joins."""
        company = getattr(self.request, 'company', None)
        if not company:
            return Employee.objects.none()

        qs = Employee.objects.filter(company=company)

        # Manager-scoped: only show direct reports
        if getattr(self.request, 'app_role', None) == 'manager':
            membership = self.request.user.company_memberships.filter(
                company=company,
            ).select_related('employee').first()
            if membership and membership.employee:
                qs = qs.filter(manager=membership.employee)

        if self.action == 'list':
            return qs.select_related('manager')
        return qs.select_related('manager').prefetch_related(
            'role_history', 'compensation_history', 'leave_records', 'manager_changes',
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeSerializer

    @action(detail=True, methods=['get'], permission_classes=[CompanyScopedPermission, IsManager])
    def history(self, request, pk=None):
        """
        Combined timeline of all changes for a single employee:
        role changes, compensation changes, leave records, manager changes.
        """
        employee = self.get_object()
        return Response({
            'employee_code': employee.employee_code,
            'full_name': employee.full_name,
            'role_history': RoleHistorySerializer(
                employee.role_history.all(), many=True,
            ).data,
            'compensation_history': CompensationHistorySerializer(
                employee.compensation_history.all(), many=True,
            ).data,
            'leave_records': LeaveRecordSerializer(
                employee.leave_records.all(), many=True,
            ).data,
        })


class CSVImportView(AuditLogMixin, APIView):
    """
    CSV file upload endpoint for bulk employee data ingestion.

    POST /api/v1/employees/import/

    Form fields:
        file:      CSV file (multipart/form-data)
        file_type: One of 'employees', 'compensation_history',
                   'role_history', 'leave_records'

    Files smaller than 500KB are imported synchronously.
    Larger files are dispatched to Celery for async processing.
    The IngestionLog ID is returned in both cases for status polling.
    """

    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'csv_import'

    def post(self, request):
        company = request.company
        uploaded_file = request.FILES.get('file')
        file_type = request.data.get('file_type', '').strip()

        if not uploaded_file:
            return Response(
                {'error': 'No file provided. Upload a CSV file as "file".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_types = ['employees', 'compensation_history', 'role_history', 'leave_records']
        if file_type not in valid_types:
            return Response(
                {'error': f"Invalid file_type. Must be one of: {valid_types}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Read file content
        file_content = uploaded_file.read()
        file_hash = compute_file_hash(file_content)

        # Import IngestionLog here to avoid circular import at module level
        from analytics.models import IngestionLog

        # Check for duplicate file
        if IngestionLog.objects.filter(
            company=company, file_hash=file_hash, status='completed',
        ).exists():
            return Response(
                {'error': 'This file has already been imported (duplicate hash).'},
                status=status.HTTP_409_CONFLICT,
            )

        # Create ingestion log
        ingestion_log = IngestionLog.objects.create(
            company=company,
            file_name=uploaded_file.name,
            file_hash=file_hash,
            file_type=file_type,
            rows_total=0,
            uploaded_by=request.user,
            status='pending',
        )

        # Log the import action
        self._log_action(
            request, 'create', ingestion_log.pk,
            metadata={
                'file_name': uploaded_file.name,
                'file_type': file_type,
                'file_size': len(file_content),
            },
        )

        # Decide sync vs async
        if len(file_content) > ASYNC_IMPORT_SIZE_THRESHOLD:
            # Async: send to Celery
            from employees.tasks import async_csv_import

            file_content_b64 = base64.b64encode(file_content).decode('ascii')
            async_csv_import.delay(
                str(company.id),
                file_type,
                file_content_b64,
                str(ingestion_log.id),
            )

            return Response(
                {
                    'message': 'File queued for async processing.',
                    'ingestion_log_id': str(ingestion_log.id),
                    'status': 'pending',
                },
                status=status.HTTP_202_ACCEPTED,
            )

        # Sync: process immediately
        result = run_import(company, file_type, file_content, ingestion_log)

        return Response(
            {
                'message': 'Import completed.',
                'ingestion_log_id': str(ingestion_log.id),
                'imported': result['imported'],
                'skipped': result['skipped'],
                'error_count': len(result['errors']),
                'errors': result['errors'][:20],  # Cap error details
            },
            status=status.HTTP_200_OK,
        )
