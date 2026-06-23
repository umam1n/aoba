import logging
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from core.permissions import IsHRAdmin, CompanyScopedPermission
from .models import RawProjectSnapshot, TaskFrictionAnalysis
from .serializers import RawProjectSnapshotSerializer, TaskFrictionAnalysisSerializer

logger = logging.getLogger(__name__)

class WebhookIngestView(APIView):
    """
    Bronze Layer Webhook Endpoint.
    Receives payloads from Jira/Linear, strips PII, and stores in RawProjectSnapshot.
    """
    permission_classes = [AllowAny]  # In production, use signature validation

    def post(self, request, *args, **kwargs):
        provider = request.data.get('provider', 'unknown')
        company_id = request.headers.get('X-Company-ID')
        
        if not company_id:
            return Response({'error': 'X-Company-ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # PII Stripping logic would go here before saving
        payload = request.data.get('payload', {})
        
        # Strip PII (mock)
        if 'user' in payload:
            payload['user'] = {'id': payload['user'].get('id')}
        if 'comments' in payload:
            del payload['comments']
            
        RawProjectSnapshot.objects.create(
            company_id=company_id,
            provider=provider,
            payload=payload
        )
        
        return Response({'status': 'Ingested'}, status=status.HTTP_200_OK)

class TaskFrictionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Gold Layer: Read-only endpoint for Task Friction Analysis results.
    """
    serializer_class = TaskFrictionAnalysisSerializer
    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    
    def get_queryset(self):
        return TaskFrictionAnalysis.objects.filter(company=self.request.company)
