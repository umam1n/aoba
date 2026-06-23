from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WebhookIngestView, TaskFrictionViewSet

router = DefaultRouter()
router.register(r'task-friction', TaskFrictionViewSet, basename='task-friction')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/', WebhookIngestView.as_view(), name='webhook-ingest'),
]
