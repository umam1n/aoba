"""
AOBA Companies URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CompanyViewSet, CompanyMembershipViewSet

router = DefaultRouter()
router.register(r'', CompanyViewSet, basename='company')
router.register(r'memberships', CompanyMembershipViewSet, basename='company-membership')

app_name = 'companies'

urlpatterns = [
    path('', include(router.urls)),
]
