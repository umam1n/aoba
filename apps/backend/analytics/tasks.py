"""
AOBA Analytics — Celery Tasks

Defines async tasks for risk score recalculation and anomaly detection.
All tasks are scoped per-company (tenant isolation enforced).
"""
import logging

from celery import shared_task

from companies.models import Company

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name='analytics.tasks.calculate_all_risk_scores',
    max_retries=3,
    default_retry_delay=60,  # 1 minute
    acks_late=True,
)
def calculate_all_risk_scores(self, company_id: str) -> dict:
    """
    Recalculate Layer-1 → Rule-Based risk scores for every active employee
    in the specified company.

    Triggered by:
    - Nightly Celery beat schedule (configured in settings.CELERY_BEAT_SCHEDULE)
    - On-demand via POST /api/v1/analytics/recalculate/

    Args:
        company_id: UUID string of the target Company.

    Returns:
        Dict with `scored_count` and `company_id`.
    """
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        logger.error("[RiskScore] Company %s not found — aborting task.", company_id)
        return {'error': f'Company {company_id} not found', 'scored_count': 0}

    logger.info("[RiskScore] Starting risk recalculation for company: %s (%s)", company.name, company_id)

    try:
        from analytics.risk_scorer import RuleBasedRiskScorer
        scorer = RuleBasedRiskScorer()
        results = scorer.score_all(company_id=company.pk)
    except Exception as exc:
        logger.exception("[RiskScore] Risk scoring failed for company %s", company_id)
        raise self.retry(exc=exc)

    logger.info(
        "[RiskScore] Completed for company %s: %d employees scored.",
        company_id,
        len(results),
    )
    return {'company_id': company_id, 'scored_count': len(results)}


@shared_task(
    bind=True,
    name='analytics.tasks.run_anomaly_detection',
    max_retries=3,
    default_retry_delay=120,
    acks_late=True,
)
def run_anomaly_detection(self, company_id: str) -> dict:
    """
    Run the rule-based anomaly detection engine for a company.

    Detects:
    - Survey response rate drops
    - Team attrition spikes per manager
    - Manager low engagement scores
    - Department-level leave spikes

    Args:
        company_id: UUID string of the target Company.

    Returns:
        Dict with `flags_created` count and `company_id`.
    """
    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        logger.error("[Anomaly] Company %s not found — aborting task.", company_id)
        return {'error': f'Company {company_id} not found', 'flags_created': 0}

    logger.info("[Anomaly] Starting anomaly detection for company: %s (%s)", company.name, company_id)

    try:
        from analytics.anomaly_fallback import AnomalyFallbackEngine
        engine = AnomalyFallbackEngine()
        flags  = engine.run_all(company_id=company.pk)
    except Exception as exc:
        logger.exception("[Anomaly] Detection failed for company %s", company_id)
        raise self.retry(exc=exc)

    logger.info(
        "[Anomaly] Completed for company %s: %d flags upserted.",
        company_id,
        len(flags),
    )
    return {'company_id': company_id, 'flags_created': len(flags)}


@shared_task(
    name='analytics.tasks.nightly_pipeline',
    acks_late=True,
)
def nightly_pipeline() -> dict:
    """
    Orchestrates the full nightly analytics pipeline for all active companies.

    Runs:
    1. Risk score recalculation (per company)
    2. Anomaly detection (per company)

    Scheduled via CELERY_BEAT_SCHEDULE — typically runs at 02:00 WIB.
    """
    active_companies = Company.objects.filter(
        subscription_status__in=['trial', 'active']
    ).values_list('id', flat=True)

    dispatched = 0
    for company_id in active_companies:
        cid = str(company_id)
        calculate_all_risk_scores.delay(cid)
        run_anomaly_detection.delay(cid)
        dispatched += 1

    logger.info("[Nightly] Dispatched pipeline tasks for %d companies.", dispatched)
    return {'companies_dispatched': dispatched}
