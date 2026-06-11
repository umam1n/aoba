"""
AOBA Companies Serializers

Serializers for Company onboarding/management and membership CRUD.
"""
from rest_framework import serializers

from .models import Company, CompanyMembership


class CompanySerializer(serializers.ModelSerializer):
    """
    Full Company serializer used for CRUD and onboarding.

    Read-only fields protect system-managed billing state from
    direct manipulation — those are only set by Stripe webhooks.
    """

    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'industry',
            'employee_count_tier',
            'country',
            'subscription_status',
            'subscription_tier',
            'stripe_customer_id',
            'stripe_subscription_id',
            'created_at',
            'is_delinquent',
            'member_count',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'subscription_status',
            'stripe_customer_id',
            'stripe_subscription_id',
            'is_delinquent',
        ]

    def get_member_count(self, obj):
        """Total platform users associated with this company."""
        return obj.memberships.count()


class CompanyOnboardingSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for the company onboarding flow.
    Only accepts the fields collected during initial signup.
    """

    class Meta:
        model = Company
        fields = [
            'id',
            'name',
            'industry',
            'employee_count_tier',
            'country',
        ]
        read_only_fields = ['id']


class CompanyMembershipSerializer(serializers.ModelSerializer):
    """
    Serializer for company membership management.

    The company is automatically set from request context,
    never from client payload.
    """

    user_email = serializers.EmailField(source='user.email', read_only=True)
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = CompanyMembership
        fields = [
            'id',
            'company',
            'user',
            'user_email',
            'company_name',
            'role',
            'employee',
            'invited_by',
            'joined_at',
        ]
        read_only_fields = ['id', 'company', 'invited_by', 'joined_at']

    def create(self, validated_data):
        """Inject company from request and set invited_by."""
        request = self.context['request']
        validated_data['company'] = request.company
        validated_data['invited_by'] = request.user
        return super().create(validated_data)
