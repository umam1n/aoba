"""
AOBA Companies Admin
"""
from django.contrib import admin

from .models import Company, CompanyMembership


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'industry', 'subscription_status', 'subscription_tier',
        'employee_count_tier', 'country', 'is_delinquent', 'created_at',
    ]
    list_filter = ['subscription_status', 'subscription_tier', 'is_delinquent', 'country']
    search_fields = ['name', 'stripe_customer_id']
    readonly_fields = ['id', 'created_at']


@admin.register(CompanyMembership)
class CompanyMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'role', 'joined_at']
    list_filter = ['role']
    search_fields = ['user__email', 'company__name']
    readonly_fields = ['id', 'joined_at']
    raw_id_fields = ['user', 'company', 'employee', 'invited_by']
