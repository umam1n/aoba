"""
AOBA Analytics Models

Risk scoring, role cost bands, anomaly detection, and data ingestion logging.
All models are tenant-isolated via company ForeignKey.
"""
import uuid

from django.conf import settings
from django.db import models

from companies.models import Company
from employees.models import Employee


class RiskScore(models.Model):
    """
    Per-employee attrition risk score. Computed nightly by the risk engine
    (rule-based in MVP, DNN in Phase 2). Contains the overall score,
    tier classification, component breakdowns, and top contributing factors.
    """

    RISK_TIER_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    SCORING_METHOD_CHOICES = [
        ('rule_based', 'Rule-Based'),
        ('dnn', 'Deep Neural Network'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='risk_scores',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    calculated_at = models.DateTimeField(auto_now_add=True)
    overall_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text='Risk score 0–100',
    )
    risk_tier = models.CharField(max_length=20, choices=RISK_TIER_CHOICES)
    component_scores = models.JSONField(
        default=dict,
        help_text='Per-signal breakdown: {"tenure": 25, "compensation_gap": 40, ...}',
    )
    top_factors = models.JSONField(
        default=list,
        help_text='Top 3 contributing signals with human-readable names',
    )
    model_version = models.CharField(max_length=50, default='v1.0-rule')
    model_confidence = models.DecimalField(
        max_digits=4, decimal_places=3, null=True, blank=True,
    )
    scoring_method = models.CharField(
        max_length=20,
        choices=SCORING_METHOD_CHOICES,
        default='rule_based',
    )

    class Meta:
        ordering = ['-calculated_at']
        indexes = [
            models.Index(fields=['company', 'risk_tier']),
            models.Index(fields=['company', '-overall_score']),
        ]

    def __str__(self):
        return f"{self.employee.employee_code}: {self.overall_score} ({self.risk_tier})"


class RoleCostBand(models.Model):
    """
    Market compensation benchmark per role/level/department/country.
    Used for pay equity analysis and compensation gap detection.
    Can be populated from external market data or internal aggregation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='role_cost_bands',
    )
    role_title = models.CharField(max_length=150)
    role_level = models.CharField(max_length=50)
    department = models.CharField(max_length=100)
    country = models.CharField(
        max_length=3,
        help_text='ISO 3166-1 alpha-3',
    )
    median_salary = models.DecimalField(max_digits=15, decimal_places=2)
    p25_salary = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    p75_salary = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    source = models.CharField(
        max_length=100,
        help_text='Data source (e.g., internal_aggregation, kelly_services)',
    )
    effective_year = models.IntegerField()

    class Meta:
        ordering = ['-effective_year', 'role_title']
        unique_together = ['company', 'role_title', 'role_level', 'department', 'country', 'effective_year']

    def __str__(self):
        return f"{self.role_title} ({self.role_level}) — {self.country} {self.effective_year}"


class AnomalyFlag(models.Model):
    """
    System-detected anomalies such as team attrition spikes,
    survey response rate drops, or span-of-control outliers.
    Anomalies surface in the HR admin dashboard as actionable alerts.
    """

    SEVERITY_CHOICES = [
        ('warning', 'Warning'),
        ('alert', 'Alert'),
        ('critical', 'Critical'),
    ]

    ENTITY_TYPE_CHOICES = [
        ('department', 'Department'),
        ('team', 'Team'),
        ('manager', 'Manager'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='anomaly_flags',
    )
    anomaly_type = models.CharField(
        max_length=50,
        help_text='e.g., response_rate_drop, team_attrition, span_of_control',
    )
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPE_CHOICES)
    entity_id = models.CharField(max_length=255)
    entity_name = models.CharField(max_length=255)
    description = models.TextField()
    metric_value = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    threshold_value = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    detected_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-detected_at']
        indexes = [
            models.Index(fields=['company', 'is_active', '-detected_at']),
        ]

    def __str__(self):
        return f"[{self.severity}] {self.anomaly_type}: {self.entity_name}"


class IngestionLog(models.Model):
    """
    Tracks CSV import operations: file metadata, progress, row-level errors,
    and final status. Referenced by both the sync and async import paths.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='ingestion_logs',
    )
    file_name = models.CharField(max_length=255)
    file_hash = models.CharField(
        max_length=64,
        help_text='SHA-256 hash for duplicate detection',
    )
    file_type = models.CharField(
        max_length=30,
        help_text='employees, compensation_history, role_history, leave_records',
    )
    rows_total = models.IntegerField(default=0)
    rows_imported = models.IntegerField(default=0)
    rows_skipped = models.IntegerField(default=0)
    errors = models.JSONField(default=list)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} ({self.status}) — {self.rows_imported}/{self.rows_total} rows"
