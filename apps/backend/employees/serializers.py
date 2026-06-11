"""
AOBA Employee Serializers

Full and lightweight serializers for employee CRUD, nested history
serialization, and CSV import support.
"""
from rest_framework import serializers

from .models import (
    Employee,
    RoleHistory,
    CompensationHistory,
    LeaveRecord,
    ManagerChangeLog,
)


class RoleHistorySerializer(serializers.ModelSerializer):
    """Serializer for role change records."""

    class Meta:
        model = RoleHistory
        fields = [
            'id', 'employee', 'company', 'role_title', 'role_level',
            'effective_date', 'change_type',
        ]
        read_only_fields = ['id', 'company']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)


class CompensationHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for compensation change records.
    Salary is encrypted at the model layer — the serializer returns
    the decrypted value to authorized callers.
    """

    class Meta:
        model = CompensationHistory
        fields = [
            'id', 'employee', 'company', 'salary', 'effective_date',
            'change_reason',
        ]
        read_only_fields = ['id', 'company']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)


class LeaveRecordSerializer(serializers.ModelSerializer):
    """Serializer for leave / absence records."""

    class Meta:
        model = LeaveRecord
        fields = [
            'id', 'employee', 'company', 'leave_type', 'start_date',
            'end_date', 'days_count',
        ]
        read_only_fields = ['id', 'company']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)


class ManagerChangeLogSerializer(serializers.ModelSerializer):
    """Serializer for manager reassignment events."""

    class Meta:
        model = ManagerChangeLog
        fields = [
            'id', 'employee', 'company', 'previous_manager',
            'new_manager', 'changed_at',
        ]
        read_only_fields = ['id', 'company']


class EmployeeListSerializer(serializers.ModelSerializer):
    """
    Lightweight employee serializer for list views.
    Excludes nested history and sensitive compensation data
    to keep list responses fast and lean.
    """

    manager_name = serializers.CharField(source='manager.full_name', read_only=True, default=None)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_code', 'full_name', 'email', 'department',
            'division', 'role_title', 'role_level', 'manager',
            'manager_name', 'hire_date', 'exit_date', 'employment_status',
            'updated_at',
        ]


class EmployeeSerializer(serializers.ModelSerializer):
    """
    Full employee serializer with nested history records.
    Used for detail views and single-employee CRUD.
    """

    role_history = RoleHistorySerializer(many=True, read_only=True)
    compensation_history = CompensationHistorySerializer(many=True, read_only=True)
    leave_records = LeaveRecordSerializer(many=True, read_only=True)
    manager_changes = ManagerChangeLogSerializer(many=True, read_only=True)
    manager_name = serializers.CharField(source='manager.full_name', read_only=True, default=None)
    direct_report_count = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'company', 'employee_code', 'full_name', 'email',
            'department', 'division', 'role_title', 'role_level',
            'manager', 'manager_name', 'hire_date', 'exit_date',
            'exit_type', 'current_salary', 'employment_status',
            'created_at', 'updated_at',
            'direct_report_count',
            'role_history', 'compensation_history', 'leave_records',
            'manager_changes',
        ]
        read_only_fields = ['id', 'company', 'created_at', 'updated_at']

    def get_direct_report_count(self, obj):
        """Number of employees reporting directly to this employee."""
        return obj.direct_reports.filter(employment_status='active').count()

    def create(self, validated_data):
        """Inject company from request context."""
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)
