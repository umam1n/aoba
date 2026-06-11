from rest_framework import serializers
from .models import BillingEvent

class BillingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingEvent
        fields = '__all__'

class SubscriptionSerializer(serializers.Serializer):
    subscription_status = serializers.CharField()
    subscription_tier = serializers.CharField()
    is_delinquent = serializers.BooleanField()
    stripe_customer_id = serializers.CharField(required=False, allow_blank=True)
    stripe_subscription_id = serializers.CharField(required=False, allow_blank=True)
