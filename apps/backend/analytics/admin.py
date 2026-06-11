"""
AOBA Analytics Admin
"""
from django.contrib import admin

from .models import RiskScore, RoleCostBand, AnomalyFlag, IngestionLog


@admin.register(RiskScore)
class RiskScoreAdmin(admin.ModelAdmin):
    list_display = [
        'employee', 'overall_score', 'risk_tier', 'scoring_method',
        'model_version', 'calculated_at',
    ]
    list_filter = ['risk_tier', 'scoring_method', 'model_version']
    readonly_fields = ['id', 'calculated_at']
    raw_id_fields = ['employee', 'company']


@admin.register(RoleCostBand)
class RoleCostBandAdmin(admin.ModelAdmin):
    list_display = [
        'role_title', 'role_level', 'department', 'country',
        'median_salary', 'effective_year', 'source',
    ]
    list_filter = ['department', 'country', 'effective_year']
    search_fields = ['role_title']
    readonly_fields = ['id']
    raw_id_fields = ['company']


@admin.register(AnomalyFlag)
class AnomalyFlagAdmin(admin.ModelAdmin):
    list_display = [
        'anomaly_type', 'severity', 'entity_type', 'entity_name',
        'is_active', 'detected_at',
    ]
    list_filter = ['anomaly_type', 'severity', 'is_active', 'entity_type']
    search_fields = ['entity_name', 'description']
    readonly_fields = ['id', 'detected_at']
    raw_id_fields = ['company']


@admin.register(IngestionLog)
class IngestionLogAdmin(admin.ModelAdmin):
    list_display = [
        'file_name', 'file_type', 'status', 'rows_total',
        'rows_imported', 'rows_skipped', 'uploaded_at',
    ]
    list_filter = ['status', 'file_type']
    search_fields = ['file_name']
    readonly_fields = ['id', 'uploaded_at', 'completed_at']
    raw_id_fields = ['company', 'uploaded_by']
