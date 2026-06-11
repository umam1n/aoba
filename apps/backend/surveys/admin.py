"""
AOBA Surveys Admin
"""
from django.contrib import admin

from .models import PulseSurvey, SurveyQuestion, SurveyResponse


class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1
    readonly_fields = ['id']


@admin.register(PulseSurvey)
class PulseSurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'starts_at', 'ends_at', 'company', 'created_at']
    list_filter = ['status', 'company']
    search_fields = ['title']
    readonly_fields = ['id', 'created_at']
    raw_id_fields = ['company', 'created_by']
    inlines = [SurveyQuestionInline]


@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ['question_text', 'question_type', 'order', 'survey']
    list_filter = ['question_type']
    readonly_fields = ['id']
    raw_id_fields = ['survey', 'company']


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['employee', 'question', 'response_value', 'submitted_at']
    readonly_fields = ['id', 'submitted_at']
    raw_id_fields = ['question', 'employee', 'company']
