"""
AOBA Employees Admin
"""
from django.contrib import admin

from .models import (
    Employee,
    RoleHistory,
    CompensationHistory,
    LeaveRecord,
    ManagerChangeLog,
)


class RoleHistoryInline(admin.TabularInline):
    model = RoleHistory
    extra = 0
    readonly_fields = ['id']


class CompensationHistoryInline(admin.TabularInline):
    model = CompensationHistory
    extra = 0
    readonly_fields = ['id']


class LeaveRecordInline(admin.TabularInline):
    model = LeaveRecord
    extra = 0
    readonly_fields = ['id']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        'employee_code', 'full_name', 'department', 'role_title',
        'role_level', 'employment_status', 'hire_date', 'company',
    ]
    list_filter = ['employment_status', 'department', 'role_level', 'company']
    search_fields = ['employee_code', 'full_name', 'email', 'role_title']
    readonly_fields = ['id', 'created_at', 'updated_at']
    raw_id_fields = ['company', 'manager']
    inlines = [RoleHistoryInline, CompensationHistoryInline, LeaveRecordInline]


@admin.register(RoleHistory)
class RoleHistoryAdmin(admin.ModelAdmin):
    list_display = ['employee', 'role_title', 'role_level', 'change_type', 'effective_date']
    list_filter = ['change_type']
    readonly_fields = ['id']
    raw_id_fields = ['employee', 'company']


@admin.register(CompensationHistory)
class CompensationHistoryAdmin(admin.ModelAdmin):
    list_display = ['employee', 'effective_date', 'change_reason']
    readonly_fields = ['id']
    raw_id_fields = ['employee', 'company']


@admin.register(LeaveRecord)
class LeaveRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'days_count']
    list_filter = ['leave_type']
    readonly_fields = ['id']
    raw_id_fields = ['employee', 'company']


@admin.register(ManagerChangeLog)
class ManagerChangeLogAdmin(admin.ModelAdmin):
    list_display = ['employee', 'previous_manager', 'new_manager', 'changed_at']
    readonly_fields = ['id']
    raw_id_fields = ['employee', 'company', 'previous_manager', 'new_manager']
