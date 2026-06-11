"""
AOBA Celery Application
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aoba.settings')

app = Celery('aoba')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Override beat schedule with proper crontab timing
app.conf.beat_schedule = {
    'nightly-risk-recalculation': {
        'task': 'analytics.tasks.calculate_all_risk_scores',
        'schedule': crontab(hour=2, minute=0),  # 02:00 UTC
    },
    'nightly-anomaly-check': {
        'task': 'analytics.tasks.check_all_anomalies',
        'schedule': crontab(hour=2, minute=15),  # 02:15 UTC
    },
    'nightly-survey-aggregation': {
        'task': 'analytics.tasks.aggregate_survey_metrics',
        'schedule': crontab(hour=2, minute=30),  # 02:30 UTC
    },
}
