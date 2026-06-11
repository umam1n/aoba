"""
AOBA Employees URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import EmployeeViewSet, CSVImportView

router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')

app_name = 'employees'

urlpatterns = [
    path('import/', CSVImportView.as_view(), name='csv-import'),
    path('', include(router.urls)),
]
