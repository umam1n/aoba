"""
AOBA URL Configuration
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/companies/', include('companies.urls')),
    path('api/v1/employees/', include('employees.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/surveys/', include('surveys.urls')),
    path('api/v1/billing/', include('billing.urls')),
    path('api/v1/compliance/', include('compliance.urls')),
    path('api/v1/projects/', include('projects.urls')),
]
