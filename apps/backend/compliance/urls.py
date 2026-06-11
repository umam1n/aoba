from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsentLogViewSet, DataExportView, DataCorrectionView, CharterView

router = DefaultRouter()
router.register(r'consent', ConsentLogViewSet, basename='consent')

urlpatterns = [
    path('', include(router.urls)),
    path('data-export/', DataExportView.as_view(), name='data-export'),
    path('data-correction/', DataCorrectionView.as_view(), name='data-correction'),
    path('charter/', CharterView.as_view(), name='charter'),
]
