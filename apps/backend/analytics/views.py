"""
AOBA Analytics Views

Risk score browsing, anomaly flag management, role cost bands,
ingestion log viewing, and risk recalculation trigger.
"""
import logging

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from core.audit import AuditLogMixin
from core.permissions import (
    IsHRAdmin,
    IsHRAdminOrReadOnly,
    IsManager,
    CompanyScopedPermission,
)
from .models import RiskScore, RoleCostBand, AnomalyFlag, IngestionLog
from .serializers import (
    RiskScoreSerializer,
    RiskScoreDetailSerializer,
    RoleCostBandSerializer,
    AnomalyFlagSerializer,
    IngestionLogSerializer,
)

logger = logging.getLogger(__name__)


class RiskScoreViewSet(AuditLogMixin, viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to employee risk scores.

    list:     GET /api/v1/analytics/risk-scores/        — paginated list
    retrieve: GET /api/v1/analytics/risk-scores/{id}/   — full detail

    Supports filtering by risk_tier, scoring_method, and ordering by
    overall_score and calculated_at.
    """

    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'risk_score'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['risk_tier', 'scoring_method']
    ordering_fields = ['overall_score', 'calculated_at']
    ordering = ['-overall_score']

    def get_queryset(self):
        company = getattr(self.request, 'company', None)
        if not company:
            return RiskScore.objects.none()
        return RiskScore.objects.filter(
            company=company,
        ).select_related('employee')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RiskScoreDetailSerializer
        return RiskScoreSerializer


class RoleCostBandViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    CRUD for role cost band / market compensation benchmarks.

    HR Admins can create and update bands; managers get read-only access.
    """

    serializer_class = RoleCostBandSerializer
    permission_classes = [CompanyScopedPermission, IsHRAdminOrReadOnly]
    audit_resource_type = 'role_cost_band'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['department', 'role_level', 'country', 'effective_year']
    search_fields = ['role_title']

    def get_queryset(self):
        company = getattr(self.request, 'company', None)
        if not company:
            return RoleCostBand.objects.none()
        return RoleCostBand.objects.filter(company=company)


class AnomalyFlagViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Anomaly flag management. HR Admins can view and resolve anomalies.

    Custom actions:
        POST /api/v1/analytics/anomalies/{id}/resolve/ — mark as resolved
    """

    serializer_class = AnomalyFlagSerializer
    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'anomaly_flag'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['anomaly_type', 'severity', 'entity_type', 'is_active']
    ordering_fields = ['detected_at', 'severity']
    ordering = ['-detected_at']

    def get_queryset(self):
        company = getattr(self.request, 'company', None)
        if not company:
            return AnomalyFlag.objects.none()
        return AnomalyFlag.objects.filter(company=company)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark an anomaly as resolved."""
        anomaly = self.get_object()
        if not anomaly.is_active:
            return Response(
                {'detail': 'Anomaly is already resolved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from django.utils import timezone
        anomaly.is_active = False
        anomaly.resolved_at = timezone.now()
        anomaly.save(update_fields=['is_active', 'resolved_at'])

        self._log_action(
            request, 'update', anomaly.pk,
            metadata={'action': 'resolve'},
        )

        return Response(AnomalyFlagSerializer(anomaly).data)


class IngestionLogViewSet(AuditLogMixin, viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to CSV import ingestion logs.
    HR Admins can view import history and error details.
    """

    serializer_class = IngestionLogSerializer
    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'ingestion_log'
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'file_type']
    ordering = ['-uploaded_at']

    def get_queryset(self):
        company = getattr(self.request, 'company', None)
        if not company:
            return IngestionLog.objects.none()
        return IngestionLog.objects.filter(
            company=company,
        ).select_related('uploaded_by')


class RecalculateView(AuditLogMixin, APIView):
    """
    Trigger risk score recalculation for the company.

    POST /api/v1/analytics/recalculate/

    Dispatches the Celery task for nightly risk recalculation
    on demand. Returns 202 Accepted with a task confirmation.
    """

    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'risk_recalculation'

    def post(self, request):
        company = request.company

        # Import the Celery task
        try:
            from analytics.tasks import calculate_all_risk_scores
            calculate_all_risk_scores.delay(str(company.id))
        except ImportError:
            logger.warning("analytics.tasks not available — recalculation skipped")
            return Response(
                {'detail': 'Risk recalculation task not available.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        self._log_action(
            request, 'create', str(company.id),
            metadata={'action': 'trigger_risk_recalculation'},
        )

        return Response(
            {
                'message': 'Risk score recalculation triggered.',
                'company_id': str(company.id),
            },
            status=status.HTTP_202_ACCEPTED,
        )
