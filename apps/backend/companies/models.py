"""
AOBA Companies Models

Multi-tenant company model and membership association.
Every resource in the platform belongs to exactly one Company.
"""
import uuid

from django.conf import settings
from django.db import models


class Company(models.Model):
    """
    Root tenant model. All platform data is scoped to a single Company.

    Stores Stripe billing identifiers, subscription state, and basic
    firmographic information used for analytics segmentation.
    """

    EMPLOYEE_COUNT_TIERS = [
        ('50-100', '50–100'),
        ('100-250', '100–250'),
        ('250-500', '250–500'),
    ]

    SUBSCRIPTION_STATUS_CHOICES = [
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
    ]

    SUBSCRIPTION_TIER_CHOICES = [
        ('starter', 'Starter'),
        ('growth', 'Growth'),
        ('enterprise', 'Enterprise'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100, blank=True, default='')
    employee_count_tier = models.CharField(
        max_length=20,
        choices=EMPLOYEE_COUNT_TIERS,
        default='50-100',
    )
    country = models.CharField(
        max_length=3,
        default='IDN',
        help_text='ISO 3166-1 alpha-3 country code',
    )
    subscription_status = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_STATUS_CHOICES,
        default='trial',
    )
    subscription_tier = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_TIER_CHOICES,
        default='starter',
    )
    stripe_customer_id = models.CharField(max_length=255, blank=True, default='')
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    is_delinquent = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = 'companies'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.subscription_tier})"

    @property
    def tier_config(self):
        """Return billing tier configuration from settings."""
        return settings.BILLING_TIERS.get(self.subscription_tier, {})


class CompanyMembership(models.Model):
    """
    Associates a Django User with a Company and assigns a platform role.

    Roles:
        - hr_admin: Full access to all company data and configuration.
        - manager:  Team-scoped access (direct reports, aggregated metrics).
        - employee: Self-view only (own data, survey responses, consent).

    Optionally links the membership to an Employee record so that managers
    and employees can see their own workforce data.
    """

    ROLE_CHOICES = [
        ('hr_admin', 'HR Admin'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='company_memberships',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='memberships',
        help_text='Link to the Employee record, if applicable',
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invitations_sent',
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['company', 'user']
        ordering = ['-joined_at']

    def __str__(self):
        return f"{self.user} → {self.company.name} ({self.role})"
