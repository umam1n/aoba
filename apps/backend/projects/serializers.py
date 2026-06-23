from rest_framework import serializers
from .models import RawProjectSnapshot, TaskFrictionAnalysis

class RawProjectSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawProjectSnapshot
        fields = '__all__'

class TaskFrictionAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskFrictionAnalysis
        fields = '__all__'
