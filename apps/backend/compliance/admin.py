from django.contrib import admin
from .models import ConsentLog, AuditLog

@admin.register(ConsentLog)
class ConsentLogAdmin(admin.ModelAdmin):
    list_display = ['employee', 'company', 'consent_type', 'granted', 'granted_at']
    list_filter = ['consent_type', 'granted']
    search_fields = ['employee__full_name', 'company__name']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['company', 'user', 'action', 'resource_type', 'created_at']
    list_filter = ['action', 'resource_type']
    search_fields = ['company__name', 'user__username', 'resource_id']
