"""
AOBA Supabase JWT Authentication Backend

Verifies Supabase Auth tokens (GoTrue JWTs) for Django REST Framework.
Supabase handles user registration, login, password resets, and token rotation.
Django validates the JWT signature and extracts user identity + claims.
"""
import logging

import jwt
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import authentication, exceptions

logger = logging.getLogger(__name__)


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom DRF authentication class that validates Supabase-issued JWTs.

    Flow:
    1. Frontend authenticates user via Supabase Auth (magic link, password, etc.)
    2. Frontend sends the Supabase access_token as Bearer token
    3. This middleware verifies the token's signature using SUPABASE_JWT_SECRET
    4. Extracts user identity and maps to Django User for DRF permissions
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None  # Let other auth classes try

        token = auth_header[7:]  # Strip 'Bearer '

        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience='authenticated',
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid Supabase JWT: {e}")
            raise exceptions.AuthenticationFailed('Invalid authentication token')

        # Extract user identity from Supabase JWT claims
        supabase_user_id = payload.get('sub')
        email = payload.get('email', '')
        role = payload.get('role', 'authenticated')
        app_metadata = payload.get('app_metadata', {})

        if not supabase_user_id:
            raise exceptions.AuthenticationFailed('Token missing user identity')

        # Get or create Django user (synced from Supabase)
        user, created = User.objects.get_or_create(
            username=supabase_user_id,
            defaults={
                'email': email,
                'is_active': True,
            }
        )

        if created:
            logger.info(f"Created Django user for Supabase ID: {supabase_user_id}")

        # Attach Supabase metadata to request for downstream use
        request.supabase_claims = payload
        request.app_role = app_metadata.get('aoba_role', 'employee')  # hr_admin, manager, employee
        request.supabase_user_id = supabase_user_id

        return (user, payload)

    def authenticate_header(self, request):
        return 'Bearer'
