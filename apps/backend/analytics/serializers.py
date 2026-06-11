"""
AOBA Analytics Serializers

Serializers for risk scores, cost bands, anomaly flags, and ingestion logs.
"""
from rest_framework import serializers

from .models import RiskScore, RoleCostBand, AnomalyFlag, IngestionLog


class RiskScoreSerializer(serializers.ModelSerializer):
    """
    Lightweight risk score serializer for list views.
    Includes employee code and name for display.
    """

    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = RiskScore
        fields = [
            'id', 'employee', 'employee_code', 'employee_name',
            'calculated_at', 'overall_score', 'risk_tier',
            'scoring_method', 'model_version',
        ]
        read_only_fields = fields


class RiskScoreDetailSerializer(serializers.ModelSerializer):
    """
    Detailed risk score serializer with component breakdowns
    and top contributing factors.
    """

    employee_code = serializers.CharField(source='employee.employee_code', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    department = serializers.CharField(source='employee.department', read_only=True)
    role_title = serializers.CharField(source='employee.role_title', read_only=True)

    class Meta:
        model = RiskScore
        fields = [
            'id', 'employee', 'employee_code', 'employee_name',
            'department', 'role_title',
            'calculated_at', 'overall_score', 'risk_tier',
            'component_scores', 'top_factors',
            'model_version', 'model_confidence', 'scoring_method',
        ]
        read_only_fields = fields


class RoleCostBandSerializer(serializers.ModelSerializer):
    """Serializer for role cost band / market compensation benchmarks."""

    class Meta:
        model = RoleCostBand
        fields = [
            'id', 'company', 'role_title', 'role_level', 'department',
            'country', 'median_salary', 'p25_salary', 'p75_salary',
            'source', 'effective_year',
        ]
        read_only_fields = ['id', 'company']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)


class AnomalyFlagSerializer(serializers.ModelSerializer):
    """Serializer for anomaly flags / system-detected alerts."""

    class Meta:
        model = AnomalyFlag
        fields = [
            'id', 'company', 'anomaly_type', 'severity',
            'entity_type', 'entity_id', 'entity_name',
            'description', 'metric_value', 'threshold_value',
            'detected_at', 'resolved_at', 'is_active',
        ]
        read_only_fields = [
            'id', 'company', 'anomaly_type', 'severity',
            'entity_type', 'entity_id', 'entity_name',
            'description', 'metric_value', 'threshold_value',
            'detected_at',
        ]


class IngestionLogSerializer(serializers.ModelSerializer):
    """Serializer for CSV import ingestion logs."""

    uploaded_by_email = serializers.EmailField(
        source='uploaded_by.email', read_only=True, default=None,
    )

    class Meta:
        model = IngestionLog
        fields = [
            'id', 'company', 'file_name', 'file_hash', 'file_type',
            'rows_total', 'rows_imported', 'rows_skipped', 'errors',
            'uploaded_by', 'uploaded_by_email',
            'uploaded_at', 'completed_at', 'status',
        ]
        read_only_fields = fields
