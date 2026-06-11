import uuid
from django.db import models
from companies.models import Company

class BillingEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='billing_events')
    stripe_event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=50)  # 'invoice.paid', 'invoice.payment_failed', etc.
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='usd')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company.name} - {self.event_type} - {self.created_at}"
