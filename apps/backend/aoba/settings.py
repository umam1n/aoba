"""
AOBA Workforce Intelligence Platform — Django Settings
"""
import os
from pathlib import Path
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# === Security ===
SECRET_KEY = config('DJANGO_SECRET_KEY', default='insecure-dev-key-change-in-production')
DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())

# === Encryption ===
FIELD_ENCRYPTION_KEY = config('FIELD_ENCRYPTION_KEY', default='')

# === Application Definition ===
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    'django_filters',
    # AOBA apps
    'core',
    'companies',
    'employees',
    'analytics',
    'surveys',
    'billing',
    'compliance',
    'projects',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # AOBA custom middleware
    'core.middleware.LocalAuthMiddleware',
    'core.middleware.CompanyMiddleware',
    'core.middleware.DelinquencyGuardMiddleware',
]

ROOT_URLCONF = 'aoba.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'aoba.wsgi.application'

import dj_database_url

# === Database ===
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# === Auth ===
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# === Internationalization ===
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# === Static Files ===
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# === Django REST Framework ===
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'core.authentication.SupabaseJWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',  # To respect LocalAuthMiddleware
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/minute',
        'user': '200/minute',
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# === CORS ===
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://127.0.0.1:3000',
    cast=Csv()
)
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'x-company-id',
    'x-mock-email',
    'x-csrftoken',
]

# === Celery ===
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://127.0.0.1:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_BEAT_SCHEDULE = {
    'nightly-risk-recalculation': {
        'task': 'analytics.tasks.calculate_all_risk_scores',
        'schedule': 60 * 60 * 24,  # Daily — configured to 02:00 UTC via crontab in celery.py
    },
    'nightly-anomaly-check': {
        'task': 'analytics.tasks.check_all_anomalies',
        'schedule': 60 * 60 * 24,
    },
    'nightly-survey-aggregation': {
        'task': 'analytics.tasks.aggregate_survey_metrics',
        'schedule': 60 * 60 * 24,
    },
}

# === Supabase ===
SUPABASE_URL = config('SUPABASE_URL', default='')
SUPABASE_ANON_KEY = config('SUPABASE_ANON_KEY', default='')
SUPABASE_SERVICE_ROLE_KEY = config('SUPABASE_SERVICE_ROLE_KEY', default='')
SUPABASE_JWT_SECRET = config('SUPABASE_JWT_SECRET', default='')

# === Stripe ===
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# === Billing Tiers (scaffold for multi-tier, only flat active in MVP) ===
BILLING_TIERS = {
    'starter': {
        'name': 'Starter',
        'price_monthly_usd': 49,
        'max_employees': 100,
        'features': ['layer_1', 'layer_3_fallback', 'pulse_surveys', 'csv_import'],
        'stripe_price_id': config('STRIPE_PRICE_STARTER', default=''),
        'active': True,  # Only tier active in MVP
    },
    'growth': {
        'name': 'Growth',
        'price_monthly_usd': 149,
        'max_employees': 300,
        'features': ['layer_1', 'layer_2', 'layer_3', 'layer_4', 'pulse_surveys', 'csv_import', 'fte_planning'],
        'stripe_price_id': config('STRIPE_PRICE_GROWTH', default=''),
        'active': False,  # Phase 2
    },
    'enterprise': {
        'name': 'Enterprise',
        'price_monthly_usd': 399,
        'max_employees': 500,
        'features': ['all'],
        'stripe_price_id': config('STRIPE_PRICE_ENTERPRISE', default=''),
        'active': False,  # Phase 2
    },
}
