from rest_framework import serializers
from .models import ConsentLog, AuditLog

class ConsentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentLog
        fields = '__all__'
        read_only_fields = ('id', 'company', 'granted_at', 'ip_address', 'user_agent')

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ('id', 'company', 'user', 'action', 'resource_type', 'resource_id', 'metadata', 'ip_address', 'created_at')

class DataExportSerializer(serializers.Serializer):
    employee_id = serializers.UUIDField()
