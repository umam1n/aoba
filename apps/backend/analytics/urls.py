"""
AOBA Analytics URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RiskScoreViewSet,
    RoleCostBandViewSet,
    AnomalyFlagViewSet,
    IngestionLogViewSet,
    RecalculateView,
)

router = DefaultRouter()
router.register(r'risk-scores', RiskScoreViewSet, basename='risk-score')
router.register(r'cost-bands', RoleCostBandViewSet, basename='role-cost-band')
router.register(r'anomalies', AnomalyFlagViewSet, basename='anomaly-flag')
router.register(r'ingestion-logs', IngestionLogViewSet, basename='ingestion-log')

app_name = 'analytics'

urlpatterns = [
    path('recalculate/', RecalculateView.as_view(), name='recalculate'),
    path('', include(router.urls)),
]
