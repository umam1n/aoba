from django.contrib import admin
from .models import RawProjectSnapshot, TaskFrictionAnalysis

@admin.register(RawProjectSnapshot)
class RawProjectSnapshotAdmin(admin.ModelAdmin):
    list_display = ('id', 'company', 'provider', 'received_at', 'processed')
    list_filter = ('processed', 'provider', 'company')
    search_fields = ('company__name', 'payload')
    readonly_fields = ('id', 'received_at')

@admin.register(TaskFrictionAnalysis)
class TaskFrictionAnalysisAdmin(admin.ModelAdmin):
    list_display = ('id', 'company', 'employee', 'task_external_id', 'detected_friction_type', 'calculated_at', 'manager_alert_triggered')
    list_filter = ('detected_friction_type', 'manager_alert_triggered', 'company')
    search_fields = ('company__name', 'employee__employee_code', 'employee__full_name', 'task_external_id')
    readonly_fields = ('id', 'calculated_at')
