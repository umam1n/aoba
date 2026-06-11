"""
AOBA Surveys URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PulseSurveyViewSet, SurveyResponseViewSet, SurveyResultsView

router = DefaultRouter()
router.register(r'', PulseSurveyViewSet, basename='pulse-survey')
router.register(r'responses', SurveyResponseViewSet, basename='survey-response')

app_name = 'surveys'

urlpatterns = [
    path('<uuid:survey_id>/results/', SurveyResultsView.as_view(), name='survey-results'),
    path('', include(router.urls)),
]
