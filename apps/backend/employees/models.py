"""
AOBA Employee Models

Core workforce data models with PII encryption for fields subject to
Indonesia's UU PDP (Law No. 27/2022). Includes role history, compensation
history, leave records, and manager change tracking.
"""
import uuid

from django.db import models

from companies.models import Company
from core.encryption import EncryptedCharField, EncryptedEmailField, EncryptedDecimalField


class Employee(models.Model):
    """
    Central employee record. PII fields (full_name, email, current_salary)
    are encrypted at rest using Fernet symmetric encryption.

    Each employee belongs to exactly one Company (tenant isolation).
    The employee_code is unique per company and serves as the external
    identifier used during CSV imports.
    """

    EMPLOYMENT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('exited', 'Exited'),
        ('on_leave', 'On Leave'),
    ]

    EXIT_TYPE_CHOICES = [
        ('voluntary', 'Voluntary'),
        ('involuntary', 'Involuntary'),
        ('retirement', 'Retirement'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='employees',
    )
    employee_code = models.CharField(max_length=50)
    full_name = EncryptedCharField(max_length=255)
    email = EncryptedEmailField(max_length=255, blank=True, default='')
    department = models.CharField(max_length=100)
    division = models.CharField(max_length=100, blank=True, default='')
    role_title = models.CharField(max_length=150)
    role_level = models.CharField(max_length=50)
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports',
    )
    hire_date = models.DateField()
    exit_date = models.DateField(null=True, blank=True)
    exit_type = models.CharField(
        max_length=20,
        choices=EXIT_TYPE_CHOICES,
        blank=True,
        default='',
    )
    current_salary = EncryptedDecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )
    employment_status = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_STATUS_CHOICES,
        default='active',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['company', 'employee_code']
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.employee_code})"


class RoleHistory(models.Model):
    """
    Tracks role title and level changes over time for promotion / lateral /
    demotion analytics. Created automatically on CSV import or manual update.
    """

    CHANGE_TYPE_CHOICES = [
        ('promotion', 'Promotion'),
        ('lateral', 'Lateral Move'),
        ('demotion', 'Demotion'),
        ('hire', 'Hire'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='role_history',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    role_title = models.CharField(max_length=150)
    role_level = models.CharField(max_length=50)
    effective_date = models.DateField()
    change_type = models.CharField(max_length=30, choices=CHANGE_TYPE_CHOICES)

    class Meta:
        ordering = ['-effective_date']
        verbose_name_plural = 'role histories'

    def __str__(self):
        return f"{self.employee.employee_code}: {self.change_type} → {self.role_title}"


class CompensationHistory(models.Model):
    """
    Salary change log with encrypted salary values.
    Used for compensation-band analytics and pay equity detection.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='compensation_history',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    salary = EncryptedDecimalField(max_digits=15, decimal_places=2)
    effective_date = models.DateField()
    change_reason = models.CharField(max_length=50, blank=True, default='')

    class Meta:
        ordering = ['-effective_date']
        verbose_name_plural = 'compensation histories'

    def __str__(self):
        return f"{self.employee.employee_code}: salary change on {self.effective_date}"


class LeaveRecord(models.Model):
    """
    Leave / absence records for absenteeism analytics.
    """

    LEAVE_TYPE_CHOICES = [
        ('sick', 'Sick Leave'),
        ('personal', 'Personal Leave'),
        ('annual', 'Annual Leave'),
        ('unpaid', 'Unpaid Leave'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='leave_records',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=30, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    days_count = models.IntegerField()

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.employee.employee_code}: {self.leave_type} ({self.days_count}d)"


class ManagerChangeLog(models.Model):
    """
    Tracks manager reassignments for span-of-control and
    manager-churn analytics.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='manager_changes',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    previous_manager = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    new_manager = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    changed_at = models.DateField()

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.employee.employee_code}: manager change on {self.changed_at}"
