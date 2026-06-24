"""
AOBA Surveys Views

Survey CRUD, lifecycle management (activate/close), response submission,
and aggregated survey analytics.
"""
import logging

from django.db.models import Avg, Count, Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from core.audit import AuditLogMixin
from core.permissions import (
    IsHRAdmin,
    IsHRAdminOrReadOnly,
    IsEmployee,
    CompanyScopedPermission,
)
from employees.models import Employee
from .models import PulseSurvey, SurveyQuestion, SurveyResponse
from .serializers import (
    PulseSurveySerializer,
    SurveyQuestionSerializer,
    SurveyResponseSerializer,
    SurveyResultsSerializer,
)

logger = logging.getLogger(__name__)


class PulseSurveyViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Pulse survey CRUD with lifecycle actions.

    list:     GET /api/v1/surveys/
    create:   POST /api/v1/surveys/
    retrieve: GET /api/v1/surveys/{id}/
    update:   PUT/PATCH /api/v1/surveys/{id}/
    delete:   DELETE /api/v1/surveys/{id}/

    Custom actions:
        POST /api/v1/surveys/{id}/activate/  — transition draft → active
        POST /api/v1/surveys/{id}/close/     — transition active → closed
        POST /api/v1/surveys/{id}/add_questions/ — bulk add questions
    """

    serializer_class = PulseSurveySerializer
    permission_classes = [CompanyScopedPermission, IsHRAdminOrReadOnly]
    audit_resource_type = 'pulse_survey'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title']
    ordering = ['-created_at']

    def get_queryset(self):
        company = getattr(self.request, 'company', None)
        if not company:
            return PulseSurvey.objects.none()
        return PulseSurvey.objects.filter(
            company=company,
        ).prefetch_related('questions')

    @action(detail=True, methods=['post'], permission_classes=[CompanyScopedPermission, IsHRAdmin])
    def activate(self, request, pk=None):
        """
        Transition a draft survey to active status.
        Validates that the survey has at least one question.
        """
        survey = self.get_object()

        if survey.status != 'draft':
            return Response(
                {'error': f"Cannot activate a survey with status '{survey.status}'. Must be 'draft'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if survey.questions.count() == 0:
            return Response(
                {'error': 'Cannot activate a survey with no questions.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        survey.status = 'active'
        survey.save(update_fields=['status'])

        self._log_action(request, 'update', survey.pk, metadata={'action': 'activate'})

        return Response(PulseSurveySerializer(survey).data)

    @action(detail=True, methods=['post'], permission_classes=[CompanyScopedPermission, IsHRAdmin])
    def close(self, request, pk=None):
        """Transition an active survey to closed status."""
        survey = self.get_object()

        if survey.status != 'active':
            return Response(
                {'error': f"Cannot close a survey with status '{survey.status}'. Must be 'active'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        survey.status = 'closed'
        survey.save(update_fields=['status'])

        self._log_action(request, 'update', survey.pk, metadata={'action': 'close'})

        return Response(PulseSurveySerializer(survey).data)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[CompanyScopedPermission, IsHRAdmin],
    )
    def add_questions(self, request, pk=None):
        """
        Bulk-add questions to a survey.

        Expects: {"questions": [{"question_text": "...", "question_type": "likert_5", "order": 1}, ...]}
        """
        survey = self.get_object()

        if survey.status != 'draft':
            return Response(
                {'error': 'Can only add questions to draft surveys.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        questions_data = request.data.get('questions', [])
        if not questions_data:
            return Response(
                {'error': 'No questions provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        for q_data in questions_data:
            q_data['survey'] = survey.id
            serializer = SurveyQuestionSerializer(
                data=q_data, context={'request': request},
            )
            serializer.is_valid(raise_exception=True)
            created.append(serializer.save())

        self._log_action(
            request, 'create', survey.pk,
            metadata={'action': 'add_questions', 'count': len(created)},
        )

        return Response(
            SurveyQuestionSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['get'], permission_classes=[])
    def public(self, request, pk=None):
        """
        Public endpoint to fetch an active survey.
        """
        try:
            survey = PulseSurvey.objects.get(pk=pk)
        except PulseSurvey.DoesNotExist:
            return Response({'error': 'Survey not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if survey.status != 'active':
            return Response({'error': 'Survey is not active.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(PulseSurveySerializer(survey).data)

    @action(detail=True, methods=['post'], permission_classes=[])
    def submit(self, request, pk=None):
        """
        Submit a complete survey response.
        Expects:
        {
          "employee_code": "EMP001",
          "responses": [
            {"question_id": "uuid", "response_value": 4, "response_text": ""}
          ]
        }
        """
        try:
            survey = PulseSurvey.objects.get(pk=pk)
        except PulseSurvey.DoesNotExist:
            return Response({'error': 'Survey not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if survey.status != 'active':
            return Response({'error': 'Survey is not active.'}, status=status.HTTP_400_BAD_REQUEST)
            
        employee_code = request.data.get('employee_code')
        responses_data = request.data.get('responses', [])
        
        if not employee_code:
            return Response({'error': 'employee_code is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            employee = Employee.objects.get(company=survey.company, employee_code=employee_code)
        except Employee.DoesNotExist:
            return Response({'error': 'Invalid employee code.'}, status=status.HTTP_400_BAD_REQUEST)

        created_responses = []
        for r_data in responses_data:
            q_id = r_data.get('question_id')
            
            try:
                question = SurveyQuestion.objects.get(id=q_id, survey=survey)
            except SurveyQuestion.DoesNotExist:
                continue
                
            # Upsert response (allow updating if they submit again? Or fail if exists?)
            response_obj, created = SurveyResponse.objects.update_or_create(
                question=question,
                employee=employee,
                company=survey.company,
                defaults={
                    'response_value': r_data.get('response_value'),
                    'response_text': r_data.get('response_text', '')
                }
            )
            created_responses.append(response_obj)

        return Response({'status': 'success', 'responses_recorded': len(created_responses)})



class SurveyResponseViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """
    Survey response submission.

    Employees submit responses to active surveys.
    HR Admins and Managers can view (but not modify) responses.
    """

    serializer_class = SurveyResponseSerializer
    permission_classes = [CompanyScopedPermission, IsEmployee]
    audit_resource_type = 'survey_response'

    def get_queryset(self):
        company = getattr(self.request, 'company', None)
        if not company:
            return SurveyResponse.objects.none()
        return SurveyResponse.objects.filter(
            company=company,
        ).select_related('question', 'employee')

    def get_queryset_for_employee(self):
        """Restrict to own responses for employee role."""
        qs = self.get_queryset()
        if getattr(self.request, 'app_role', None) == 'employee':
            membership = self.request.user.company_memberships.filter(
                company=self.request.company,
            ).first()
            if membership and membership.employee:
                return qs.filter(employee=membership.employee)
            return qs.none()
        return qs


class SurveyResultsView(AuditLogMixin, APIView):
    """
    Aggregated survey analytics.

    GET /api/v1/surveys/{survey_id}/results/

    Returns per-question statistics including average scores,
    response counts, score distributions, and response rates.
    """

    permission_classes = [CompanyScopedPermission, IsHRAdmin]
    audit_resource_type = 'survey_results'

    def get(self, request, survey_id):
        company = request.company

        try:
            survey = PulseSurvey.objects.get(id=survey_id, company=company)
        except PulseSurvey.DoesNotExist:
            return Response(
                {'error': 'Survey not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Total eligible employees
        total_employees = Employee.objects.filter(
            company=company, employment_status='active',
        ).count()

        questions = survey.questions.all()
        question_results = []

        total_responses = 0
        unique_respondent_ids = set()

        for question in questions:
            responses = SurveyResponse.objects.filter(question=question)
            count = responses.count()
            total_responses += count

            respondent_ids = responses.values_list('employee_id', flat=True)
            unique_respondent_ids.update(respondent_ids)

            result = {
                'question_id': question.id,
                'question_text': question.question_text,
                'question_type': question.question_type,
                'total_responses': count,
                'average_score': None,
                'score_distribution': {},
                'yes_percentage': None,
            }

            if question.question_type == 'likert_5' and count > 0:
                avg = responses.aggregate(avg=Avg('response_value'))['avg']
                result['average_score'] = round(avg, 2) if avg else None

                # Score distribution
                distribution = {}
                for score in range(1, 6):
                    distribution[str(score)] = responses.filter(
                        response_value=score,
                    ).count()
                result['score_distribution'] = distribution

            elif question.question_type == 'yes_no' and count > 0:
                yes_count = responses.filter(response_value=1).count()
                result['yes_percentage'] = round(
                    (yes_count / count) * 100, 1,
                )

            question_results.append(result)

        response_rate = 0
        if total_employees > 0:
            response_rate = round(
                (len(unique_respondent_ids) / total_employees) * 100, 1,
            )

        results_data = {
            'survey_id': survey.id,
            'survey_title': survey.title,
            'total_respondents': len(unique_respondent_ids),
            'total_responses': total_responses,
            'response_rate': response_rate,
            'questions': question_results,
        }

        self._log_action(
            request, 'read', str(survey.id),
            metadata={'action': 'view_results'},
        )

        serializer = SurveyResultsSerializer(results_data)
        return Response(serializer.data)
