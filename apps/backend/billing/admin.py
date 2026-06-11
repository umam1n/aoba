from django.contrib import admin
from .models import BillingEvent

@admin.register(BillingEvent)
class BillingEventAdmin(admin.ModelAdmin):
    list_display = ['company', 'event_type', 'amount', 'currency', 'created_at']
    list_filter = ['event_type', 'created_at']
    search_fields = ['company__name', 'stripe_event_id']
