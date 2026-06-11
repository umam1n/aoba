"""
AOBA Workforce Intelligence Platform — Celery Scheduled Tasks

Three nightly tasks (02:00 UTC via celery beat):
    1. calculate_all_risk_scores  — Layer 1 → Risk Score pipeline
    2. check_all_anomalies        — Layer 3 anomaly detection fallback
    3. aggregate_survey_metrics   — Per-company survey aggregations

Each task iterates all active companies.  A failure in one company does
not block processing of subsequent companies.

Schedule is configured in ``aoba/celery.py``.
"""

from __future__ import annotations

import logging
import time

from celery import shared_task
from django.db.models import Avg, Count, Q
from django.utils import timezone

from companies.models import Company

logger = logging.getLogger(__name__)


@shared_task(
    name="analytics.tasks.calculate_all_risk_scores",
    bind=True,
    max_retries=2,
    default_retry_delay=300,
    acks_late=True,
)
def calculate_all_risk_scores(self) -> dict:
    """Nightly: Compute Layer-1 signals + risk scores for every company.

    Iterates all active companies, calculates the full signal → score
    pipeline, and persists ``RiskScore`` records.

    Returns:
        Summary dict with company-level success/failure counts.
    """
    from analytics.risk_scorer import RuleBasedRiskScorer

    start = time.monotonic()
    logger.info("=== calculate_all_risk_scores — START ===")

    scorer = RuleBasedRiskScorer()
    companies = Company.objects.filter(is_active=True)
    summary = {"total": 0, "success": 0, "failed": 0, "employees_scored": 0}

    for company in companies.iterator():
        summary["total"] += 1
        try:
            results = scorer.score_all(company.pk)
            summary["success"] += 1
            summary["employees_scored"] += len(results)
            logger.info(
                "Risk scores completed for company %s (%d employees)",
                company.pk,
                len(results),
            )
        except Exception as exc:
            summary["failed"] += 1
            logger.exception(
                "Risk scoring failed for company %s: %s", company.pk, exc
            )

    elapsed = time.monotonic() - start
    logger.info(
        "=== calculate_all_risk_scores — END (%.2fs) | %s ===",
        elapsed,
        summary,
    )
    return summary


@shared_task(
    name="analytics.tasks.check_all_anomalies",
    bind=True,
    max_retries=2,
    default_retry_delay=300,
    acks_late=True,
)
def check_all_anomalies(self) -> dict:
    """Nightly: Run Layer-3 anomaly detection for every company.

    Iterates all active companies, executes the 4 hardcoded anomaly
    rules, and creates/resolves ``AnomalyFlag`` records.

    Returns:
        Summary dict with company-level success/failure counts.
    """
    from analytics.anomaly_fallback import AnomalyDetector

    start = time.monotonic()
    logger.info("=== check_all_anomalies — START ===")

    detector = AnomalyDetector()
    companies = Company.objects.filter(is_active=True)
    summary = {"total": 0, "success": 0, "failed": 0, "flags_raised": 0}

    for company in companies.iterator():
        summary["total"] += 1
        try:
            flags = detector.detect_all(company.pk)
            summary["success"] += 1
            summary["flags_raised"] += len(flags)
            logger.info(
                "Anomaly detection completed for company %s (%d flags)",
                company.pk,
                len(flags),
            )
        except Exception as exc:
            summary["failed"] += 1
            logger.exception(
                "Anomaly detection failed for company %s: %s", company.pk, exc
            )

    elapsed = time.monotonic() - start
    logger.info(
        "=== check_all_anomalies — END (%.2fs) | %s ===",
        elapsed,
        summary,
    )
    return summary


@shared_task(
    name="analytics.tasks.aggregate_survey_metrics",
    bind=True,
    max_retries=2,
    default_retry_delay=300,
    acks_late=True,
)
def aggregate_survey_metrics(self) -> dict:
    """Nightly: Compute per-company survey response rates and aggregations.

    Calculates:
        - Total responses in the current month
        - Response rate (responses / active employees)
        - Average survey score
        - Department-level breakdowns

    Results are logged for downstream consumption (dashboard cache,
    notification triggers, etc.).

    Returns:
        Summary dict with company-level metrics.
    """
    from surveys.models import SurveyResponse
    from employees.models import Employee

    start = time.monotonic()
    logger.info("=== aggregate_survey_metrics — START ===")

    now = timezone.now().date()
    month_start = now.replace(day=1)

    companies = Company.objects.filter(is_active=True)
    summary = {"total": 0, "success": 0, "failed": 0, "company_metrics": []}

    for company in companies.iterator():
        summary["total"] += 1
        try:
            active_count = Employee.objects.filter(
                company=company, is_active=True
            ).count()

            month_responses = SurveyResponse.objects.filter(
                employee__company=company,
                submitted_at__date__gte=month_start,
                submitted_at__date__lte=now,
            )

            response_count = month_responses.count()
            response_rate = (
                round(response_count / active_count, 4)
                if active_count > 0
                else 0.0
            )

            avg_score = month_responses.aggregate(avg=Avg("score")).get("avg")

            # Department-level breakdown
            dept_breakdown = (
                month_responses.values("employee__department")
                .annotate(
                    dept_count=Count("id"),
                    dept_avg_score=Avg("score"),
                )
                .order_by("-dept_count")
            )

            metrics = {
                "company_id": company.pk,
                "active_employees": active_count,
                "responses_this_month": response_count,
                "response_rate": response_rate,
                "avg_score": round(float(avg_score), 2) if avg_score else None,
                "department_breakdown": list(dept_breakdown),
            }

            summary["company_metrics"].append(metrics)
            summary["success"] += 1

            logger.info(
                "Survey metrics for company %s: %d responses, %.1f%% rate, avg=%.2f",
                company.pk,
                response_count,
                response_rate * 100,
                float(avg_score or 0),
            )

        except Exception as exc:
            summary["failed"] += 1
            logger.exception(
                "Survey aggregation failed for company %s: %s",
                company.pk,
                exc,
            )

    elapsed = time.monotonic() - start
    logger.info(
        "=== aggregate_survey_metrics — END (%.2fs) | %s ===",
        elapsed,
        {k: v for k, v in summary.items() if k != "company_metrics"},
    )
    return summary
