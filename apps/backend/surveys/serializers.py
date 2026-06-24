"""
AOBA Surveys Serializers

Survey CRUD, response submission, and aggregated results.
"""
from django.db.models import Avg, Count, Q
from rest_framework import serializers

from .models import PulseSurvey, SurveyQuestion, SurveyResponse


class SurveyQuestionSerializer(serializers.ModelSerializer):
    """Serializer for individual survey questions."""

    class Meta:
        model = SurveyQuestion
        fields = ['id', 'survey', 'company', 'question_text', 'question_type', 'order']
        read_only_fields = ['id', 'company']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)


class PulseSurveySerializer(serializers.ModelSerializer):
    """
    Full survey serializer with nested questions.
    Used for creating and managing surveys.
    """

    questions = SurveyQuestionSerializer(many=True, read_only=True)
    response_count = serializers.IntegerField(read_only=True)
    unique_respondents = serializers.IntegerField(read_only=True)

    class Meta:
        model = PulseSurvey
        fields = [
            'id', 'company', 'title', 'description', 'status', 'target_audience',
            'starts_at', 'ends_at', 'created_by', 'created_at',
            'questions', 'response_count', 'unique_respondents',
        ]
        read_only_fields = ['id', 'company', 'created_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            if hasattr(request, 'company'):
                validated_data['company'] = request.company
            validated_data['created_by'] = request.user
        return super().create(validated_data)


class SurveyResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for submitting survey responses.
    The employee and company are auto-detected from the request context.
    """

    class Meta:
        model = SurveyResponse
        fields = [
            'id', 'question', 'employee', 'company',
            'response_value', 'response_text', 'submitted_at',
        ]
        read_only_fields = ['id', 'company', 'submitted_at']

    def validate(self, data):
        """
        Validate that:
        1. The survey is active
        2. Response type matches question type
        """
        question = data.get('question')

        if question.survey.status != 'active':
            raise serializers.ValidationError(
                'Cannot submit responses to a survey that is not active.'
            )

        if question.question_type == 'likert_5':
            value = data.get('response_value')
            if value is None or value < 1 or value > 5:
                raise serializers.ValidationError(
                    'Likert questions require a response_value between 1 and 5.'
                )

        if question.question_type == 'yes_no':
            value = data.get('response_value')
            if value not in (0, 1):
                raise serializers.ValidationError(
                    'Yes/No questions require a response_value of 0 or 1.'
                )

        if question.question_type == 'open_text':
            text = data.get('response_text', '').strip()
            if not text:
                raise serializers.ValidationError(
                    'Open-text questions require response_text.'
                )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'company'):
            validated_data['company'] = request.company
        return super().create(validated_data)


class QuestionResultSerializer(serializers.Serializer):
    """
    Aggregated results for a single question.
    Used by the SurveyResultsSerializer.
    """

    question_id = serializers.UUIDField()
    question_text = serializers.CharField()
    question_type = serializers.CharField()
    total_responses = serializers.IntegerField()
    average_score = serializers.FloatField(required=False, allow_null=True)
    score_distribution = serializers.DictField(required=False)
    yes_percentage = serializers.FloatField(required=False, allow_null=True)


class SurveyResultsSerializer(serializers.Serializer):
    """
    Aggregated survey results including per-question statistics.
    Read-only, computed on request.
    """

    survey_id = serializers.UUIDField()
    survey_title = serializers.CharField()
    total_respondents = serializers.IntegerField()
    total_responses = serializers.IntegerField()
    response_rate = serializers.FloatField()
    questions = QuestionResultSerializer(many=True)
