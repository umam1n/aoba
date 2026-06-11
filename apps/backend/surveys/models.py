"""
AOBA Surveys Models

Pulse survey management: surveys, questions, and anonymous responses.
Used for employee engagement measurement and sentiment analysis.
"""
import uuid

from django.conf import settings
from django.db import models

from companies.models import Company
from employees.models import Employee


class PulseSurvey(models.Model):
    """
    A pulse survey campaign with a defined active window.
    HR Admins create surveys in draft, then activate them for a date range.
    """

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('closed', 'Closed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='surveys',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status})"

    @property
    def response_count(self):
        """Total number of responses across all questions."""
        return SurveyResponse.objects.filter(
            question__survey=self,
        ).count()

    @property
    def unique_respondents(self):
        """Number of unique employees who responded."""
        return SurveyResponse.objects.filter(
            question__survey=self,
        ).values('employee').distinct().count()


class SurveyQuestion(models.Model):
    """
    Individual survey question. Supports Likert-5, open text, and yes/no types.
    Questions are ordered within a survey.
    """

    QUESTION_TYPE_CHOICES = [
        ('likert_5', 'Likert Scale (1–5)'),
        ('open_text', 'Open Text'),
        ('yes_no', 'Yes / No'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(
        PulseSurvey,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
    )
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Q{self.order}: {self.question_text[:60]}"


class SurveyResponse(models.Model):
    """
    Individual employee response to a survey question.
    Each employee can respond once per question (unique_together constraint).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(
        SurveyQuestion,
        on_delete=models.CASCADE,
        related_name='responses',
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='survey_responses',
    )
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    response_value = models.IntegerField(
        null=True,
        blank=True,
        help_text='Likert score (1–5) or yes/no (1/0)',
    )
    response_text = models.TextField(
        blank=True,
        default='',
        help_text='Open-text response',
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['question', 'employee']
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Response by {self.employee.employee_code} to Q{self.question.order}"
