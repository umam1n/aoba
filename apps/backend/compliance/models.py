import uuid
from django.db import models
from django.contrib.auth.models import User
from companies.models import Company
from employees.models import Employee

class ConsentLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='consent_logs')
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='consent_logs')
    consent_type = models.CharField(max_length=50)  # 'data_processing', 'survey_participation', 'analytics'
    granted = models.BooleanField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    granted_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.employee} - {self.consent_type}: {self.granted}"


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)  # 'create', 'read', 'update', 'delete', 'export'
    resource_type = models.CharField(max_length=50)
    resource_id = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company.name} - {self.action} {self.resource_type} ({self.created_at})"
