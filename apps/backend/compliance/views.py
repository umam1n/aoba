import json
from django.utils import timezone
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from .models import ConsentLog, AuditLog
from .serializers import ConsentLogSerializer, AuditLogSerializer, DataExportSerializer
from core.audit import AuditLogMixin
from core.permissions import IsHRAdmin, IsEmployee
from employees.models import Employee, RoleHistory, CompensationHistory, LeaveRecord
from employees.serializers import EmployeeSerializer, RoleHistorySerializer, CompensationHistorySerializer, LeaveRecordSerializer

class ConsentLogViewSet(AuditLogMixin, viewsets.ModelViewSet):
    serializer_class = ConsentLogSerializer
    permission_classes = [IsEmployee]
    audit_resource_type = 'consent_log'

    def get_queryset(self):
        user = self.request.user
        company = self.request.company
        
        if getattr(self.request, 'app_role', None) == 'hr_admin':
            return ConsentLog.objects.filter(company=company)
        else:
             # Employee sees their own
             try:
                 employee = Employee.objects.get(employee_code=user.username, company=company)
                 return ConsentLog.objects.filter(company=company, employee=employee)
             except Employee.DoesNotExist:
                 return ConsentLog.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        company = self.request.company
        try:
             employee = Employee.objects.get(employee_code=user.username, company=company)
        except Employee.DoesNotExist:
             raise ValueError("Employee not found for current user")
             
        serializer.save(
            company=company, 
            employee=employee,
            ip_address=self._get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [IsHRAdmin]

    def get_queryset(self):
        company = self.request.company
        return AuditLog.objects.filter(company=company).order_by('-created_at')


class DataExportView(views.APIView):
    """
    Handles employee data portability requests (UU PDP).
    """
    permission_classes = [IsEmployee]

    def post(self, request):
        serializer = DataExportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        employee_id = serializer.validated_data['employee_id']
        company = request.company
        
        if getattr(request, 'app_role', None) != 'hr_admin':
             # Validate employee is requesting their own data
             user = request.user
             try:
                 employee = Employee.objects.get(id=employee_id, company=company)
                 if employee.employee_code != user.username:
                     return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
             except Employee.DoesNotExist:
                 return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                 employee = Employee.objects.get(id=employee_id, company=company)
            except Employee.DoesNotExist:
                 return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        
        # Build export data
        data = {
            'employee': EmployeeSerializer(employee).data,
            'role_history': RoleHistorySerializer(RoleHistory.objects.filter(employee=employee), many=True).data,
            'compensation_history': CompensationHistorySerializer(CompensationHistory.objects.filter(employee=employee), many=True).data,
            'leave_records': LeaveRecordSerializer(LeaveRecord.objects.filter(employee=employee), many=True).data,
        }
        
        # Audit log the export
        AuditLog.objects.create(
            company=company,
            user=request.user,
            action='export',
            resource_type='employee_data',
            resource_id=str(employee.id),
            metadata={'reason': 'UU PDP Data Portability Request'}
        )

        return Response(data, status=status.HTTP_200_OK)


class DataCorrectionView(views.APIView):
    """
    Handles employee data correction requests (UU PDP).
    """
    permission_classes = [IsEmployee]

    def post(self, request):
        company = request.company
        user = request.user
        
        try:
             employee = Employee.objects.get(employee_code=user.username, company=company)
        except Employee.DoesNotExist:
             return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)

        corrections = request.data.get('corrections', {})
        if not corrections:
            return Response({'error': 'No corrections provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        # In MVP, we just log the request for HR admin to review
        # Auto-applying could be dangerous without workflow
        
        AuditLog.objects.create(
            company=company,
            user=request.user,
            action='correction_request',
            resource_type='employee',
            resource_id=str(employee.id),
            metadata={'requested_corrections': corrections}
        )
        
        return Response({'message': 'Correction request submitted to HR'}, status=status.HTTP_200_OK)


class CharterView(views.APIView):
    """
    Returns the UU PDP transparency notice content.
    """
    permission_classes = [IsEmployee]

    def get(self, request):
        charter_content = {
            "title": "Employee Data Charter",
            "version": "1.0",
            "last_updated": "2026-06-01",
            "sections": [
                {
                    "heading": "Data Processing & Analytics",
                    "text": "We process your HR data to provide workforce analytics and ensure optimal team health."
                },
                 {
                    "heading": "Your Rights under UU PDP",
                    "text": "You have the right to access your data, request corrections, and revoke consent where applicable."
                }
            ]
        }
        return Response(charter_content, status=status.HTTP_200_OK)
