import uuid
from django.db import models
from companies.models import Company
from employees.models import Employee

class RawProjectSnapshot(models.Model):
    """Bronze Layer: Webhook Ingestion Dump (PII-stripped)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    provider = models.CharField(max_length=50, help_text="'jira' | 'linear'")
    received_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(help_text="Confirmed clean metadata only")
    processed = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['company', 'processed'], condition=models.Q(processed=False), name='raw_snap_unproc_idx'),
        ]

class TaskFrictionAnalysis(models.Model):
    """Gold Layer: Prescriptive Machine Learning Insights"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    task_external_id = models.CharField(max_length=255)
    calculated_at = models.DateTimeField(auto_now_add=True)
    
    # NLP Processing Results
    initial_scope_summary = models.TextField(blank=True, null=True)
    detected_friction_type = models.CharField(
        max_length=50,
        help_text="'scope_creep' | 'dependency_block' | 'technical_debt' | 'ambiguity'"
    )
    friction_confidence = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    classification_rationale = models.TextField(blank=True, null=True)
    
    # Actionable Operational Strategy
    avoidance_strategy = models.TextField(blank=True, null=True)
    manager_alert_triggered = models.BooleanField(default=False)

    class Meta:
        unique_together = ['company', 'task_external_id']
        indexes = [
            models.Index(fields=['company', 'detected_friction_type']),
            models.Index(fields=['employee', 'calculated_at']),
        ]
