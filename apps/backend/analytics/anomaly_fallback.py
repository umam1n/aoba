"""
AOBA Workforce Intelligence Platform — Layer 3: Hardcoded Anomaly Detection Fallback

Implements 4 rule-based anomaly detection checks that run independently of
the ML pipeline (Layer 2).  These act as a safety net to catch critical
workforce signals even when the ML layer is unavailable.

Reference: Technical Handoff Doc v2.1 — LAYER 3 FALLBACK
"""

from __future__ import annotations

import logging
import math
from datetime import timedelta
from typing import Any

import pandas as pd
from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone

from analytics.models import AnomalyFlag
from employees.models import Employee, LeaveRecord
from surveys.models import SurveyResponse

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Runs 4 hardcoded anomaly detection rules per company.

    Each rule produces zero or more ``AnomalyFlag`` records.  Existing
    flags that no longer meet their trigger threshold are auto-resolved.

    Severity levels (from handoff doc):
        - WARNING  — needs monitoring
        - ALERT    — escalated attention
        - CRITICAL — immediate action required
    """

    SEVERITY_WARNING = "warning"
    SEVERITY_ALERT = "alert"
    SEVERITY_CRITICAL = "critical"

    # ================================================================== #
    # Public API                                                           #
    # ================================================================== #
    def detect_all(self, company_id: int) -> list[AnomalyFlag]:
        """Run all anomaly detection rules for a company.

        Args:
            company_id: PK of the target Company.

        Returns:
            List of newly created or updated ``AnomalyFlag`` instances.
        """
        created_flags: list[AnomalyFlag] = []

        detectors = [
            self._detect_response_rate_drop,
            self._detect_team_attrition_spike,
            self._detect_manager_sentiment_low,
            self._detect_leave_spike,
        ]

        for detector in detectors:
            try:
                flags = detector(company_id)
                created_flags.extend(flags)
            except Exception:
                logger.exception(
                    "Anomaly detector %s failed for company_id=%s",
                    detector.__name__,
                    company_id,
                )

        logger.info(
            "Anomaly detection complete: %d flags raised for company_id=%s",
            len(created_flags),
            company_id,
        )
        return created_flags

    # ================================================================== #
    # Rule 1: Survey Response Rate Drop > 30 % MoM                        #
    # ================================================================== #
    def _detect_response_rate_drop(self, company_id: int) -> list[AnomalyFlag]:
        """Detect departments where survey response rate dropped > 30 % MoM.

        Compares the current month's response count against the previous
        month's.  A drop exceeding 30 % triggers a WARNING flag.
        """
        now = timezone.now().date()
        current_month_start = now.replace(day=1)
        prev_month_end = current_month_start - timedelta(days=1)
        prev_month_start = prev_month_end.replace(day=1)

        flags: list[AnomalyFlag] = []
        rule_type = "response_rate_drop"

        departments = (
            Employee.objects.filter(company_id=company_id, employment_status='active')
            .values_list("department", flat=True)
            .distinct()
        )

        for dept in departments:
            if not dept:
                continue

            prev_count = SurveyResponse.objects.filter(
                employee__company_id=company_id,
                employee__department=dept,
                submitted_at__date__gte=prev_month_start,
                submitted_at__date__lte=prev_month_end,
            ).count()

            curr_count = SurveyResponse.objects.filter(
                employee__company_id=company_id,
                employee__department=dept,
                submitted_at__date__gte=current_month_start,
                submitted_at__date__lte=now,
            ).count()

            if prev_count == 0:
                self._auto_resolve(company_id, rule_type, dept)
                continue

            drop_pct = (prev_count - curr_count) / prev_count

            if drop_pct > 0.30:
                flag = self._upsert_flag(
                    company_id=company_id,
                    anomaly_type=rule_type,
                    entity_type="department",
                    entity_id=dept,
                    entity_name=dept,
                    severity=self.SEVERITY_WARNING,
                    description={
                        "department": dept,
                        "previous_month_responses": prev_count,
                        "current_month_responses": curr_count,
                        "drop_pct": round(drop_pct * 100, 1),
                    },
                )
                flags.append(flag)
            else:
                self._auto_resolve(company_id, rule_type, dept)

        return flags

    # ================================================================== #
    # Rule 2: Team Attrition > 20 % in 6 Months                           #
    # ================================================================== #
    def _detect_team_attrition_spike(self, company_id: int) -> list[AnomalyFlag]:
        """Detect teams (by manager) losing > 20 % of members in 6 months.

        Triggers a CRITICAL flag — this is one of the strongest leading
        indicators of cascading attrition.
        """
        six_months_ago = timezone.now().date() - timedelta(days=180)
        rule_type = "team_attrition_spike"
        flags: list[AnomalyFlag] = []

        # Group employees by manager
        managers = (
            Employee.objects.filter(company_id=company_id)
            .exclude(manager__isnull=True)
            .values_list("manager_id", flat=True)
            .distinct()
        )

        for manager_id in managers:
            team = Employee.objects.filter(
                company_id=company_id,
                manager_id=manager_id,
            )
            total = team.count()
            if total == 0:
                continue

            exited = team.filter(
                employment_status='exited',
                exit_date__gte=six_months_ago,
            ).count()

            rate = exited / total

            if rate > 0.20:
                manager_name = Employee.objects.filter(id=manager_id).values_list('full_name', flat=True).first() or str(manager_id)
                flag = self._upsert_flag(
                    company_id=company_id,
                    anomaly_type=rule_type,
                    entity_type="manager",
                    entity_id=str(manager_id),
                    entity_name=manager_name,
                    severity=self.SEVERITY_CRITICAL,
                    description={
                        "manager_id": manager_id,
                        "team_size": total,
                        "exits_6mo": exited,
                        "attrition_rate_pct": round(rate * 100, 1),
                    },
                )
                flags.append(flag)
            else:
                self._auto_resolve(company_id, rule_type, str(manager_id))

        return flags

    # ================================================================== #
    # Rule 3: Manager Team Sentiment Below Company P25                     #
    # ================================================================== #
    def _detect_manager_sentiment_low(self, company_id: int) -> list[AnomalyFlag]:
        """Detect managers whose team's average survey sentiment is below
        the company-wide 25th percentile.

        This is a placeholder that uses raw survey ``score`` fields.  A
        proper NLP-sentiment pipeline belongs in Layer 2.
        """
        rule_type = "manager_sentiment_low"
        flags: list[AnomalyFlag] = []

        # Compute per-manager average survey score
        ninety_days_ago = timezone.now().date() - timedelta(days=90)

        manager_scores = (
            SurveyResponse.objects.filter(
                employee__company_id=company_id,
                submitted_at__date__gte=ninety_days_ago,
            )
            .exclude(employee__manager__isnull=True)
            .values("employee__manager_id")
            .annotate(avg_score=Avg("response_value"))
        )

        if not manager_scores:
            return flags

        scores_series = pd.Series([m["avg_score"] for m in manager_scores if m["avg_score"] is not None])
        if scores_series.empty:
            return flags

        p25 = float(scores_series.quantile(0.25))

        for entry in manager_scores:
            avg = entry.get("avg_score")
            manager_id = entry["employee__manager_id"]
            if avg is None:
                continue

            if avg < p25:
                manager_name = Employee.objects.filter(id=manager_id).values_list('full_name', flat=True).first() or str(manager_id)
                flag = self._upsert_flag(
                    company_id=company_id,
                    anomaly_type=rule_type,
                    entity_type="manager",
                    entity_id=str(manager_id),
                    entity_name=manager_name,
                    severity=self.SEVERITY_WARNING,
                    description={
                        "manager_id": manager_id,
                        "team_avg_score": round(float(avg), 2),
                        "company_p25": round(p25, 2),
                    },
                )
                flags.append(flag)
            else:
                self._auto_resolve(company_id, rule_type, str(manager_id))

        return flags

    # ================================================================== #
    # Rule 4: Department Leave Spike > 2σ from Baseline                    #
    # ================================================================== #
    def _detect_leave_spike(self, company_id: int) -> list[AnomalyFlag]:
        """Detect departments with leave volume > 2 standard deviations
        above their 12-month rolling baseline.

        Uses sick + personal leave types only, consistent with the
        Layer-1 leave_anomaly signal.
        """
        now = timezone.now().date()
        one_month_ago = now - timedelta(days=30)
        twelve_months_ago = now - timedelta(days=365)
        rule_type = "leave_spike"
        flags: list[AnomalyFlag] = []

        departments = (
            Employee.objects.filter(company_id=company_id, employment_status='active')
            .values_list("department", flat=True)
            .distinct()
        )

        for dept in departments:
            if not dept:
                continue

            dept_employees = Employee.objects.filter(
                company_id=company_id,
                department=dept,
            )
            emp_ids = list(dept_employees.values_list("pk", flat=True))

            if not emp_ids:
                continue

            leave_qs = LeaveRecord.objects.filter(
                employee_id__in=emp_ids,
                leave_type__in=["sick", "personal"],
            )

            # Monthly totals for the trailing 12 months
            monthly_totals = self._monthly_leave_totals(
                leave_qs, twelve_months_ago, now
            )

            if len(monthly_totals) < 3:
                # Not enough data for a meaningful baseline
                continue

            # Current month leave
            current_total = (
                leave_qs.filter(
                    start_date__gte=one_month_ago,
                    start_date__lte=now,
                )
                .aggregate(total=Sum("days_count"))
                .get("total")
                or 0
            )

            mean = sum(monthly_totals) / len(monthly_totals)
            variance = sum((x - mean) ** 2 for x in monthly_totals) / len(monthly_totals)
            std = math.sqrt(variance) if variance > 0 else 0

            if std > 0 and current_total > mean + 2 * std:
                flag = self._upsert_flag(
                    company_id=company_id,
                    anomaly_type=rule_type,
                    entity_type="department",
                    entity_id=dept,
                    entity_name=dept,
                    severity=self.SEVERITY_ALERT,
                    description={
                        "department": dept,
                        "current_month_leave_days": float(current_total),
                        "baseline_mean": round(mean, 2),
                        "baseline_std": round(std, 2),
                        "sigma_deviation": round(
                            (float(current_total) - mean) / std, 2
                        ),
                    },
                )
                flags.append(flag)
            else:
                self._auto_resolve(company_id, rule_type, dept)

        return flags

    # ================================================================== #
    # Helpers                                                              #
    # ================================================================== #
    @staticmethod
    def _monthly_leave_totals(
        qs: Any, start_date: Any, end_date: Any
    ) -> list[float]:
        """Bucket leave records into calendar-month totals."""
        records = qs.filter(
            start_date__gte=start_date,
            start_date__lt=end_date,
        ).values_list("start_date", "days_count")

        from collections import defaultdict

        buckets: dict[str, float] = defaultdict(float)
        for dt, days in records:
            key = f"{dt.year}-{dt.month:02d}"
            buckets[key] += float(days or 0)

        return list(buckets.values())

    @staticmethod
    def _upsert_flag(
        company_id: int,
        anomaly_type: str,
        entity_type: str,
        entity_id: str,
        entity_name: str,
        severity: str,
        description: dict,
    ) -> AnomalyFlag:
        """Create or update an AnomalyFlag record."""
        flag, created = AnomalyFlag.objects.update_or_create(
            company_id=company_id,
            anomaly_type=anomaly_type,
            entity_type=entity_type,
            entity_id=entity_id,
            is_active=True,
            defaults={
                "entity_name": entity_name,
                "severity": severity,
                "description": description,
                "detected_at": timezone.now(),
            },
        )
        action = "Created" if created else "Updated"
        logger.debug(
            "%s AnomalyFlag: rule=%s entity=%s/%s severity=%s",
            action,
            anomaly_type,
            entity_type,
            entity_id,
            severity,
        )
        return flag

    @staticmethod
    def _auto_resolve(company_id: int, rule_type: str, entity_id: str) -> None:
        """Resolve any open flags for a rule+entity that no longer triggers."""
        updated = AnomalyFlag.objects.filter(
            company_id=company_id,
            anomaly_type=rule_type,
            entity_id=entity_id,
            is_active=True,
        ).update(
            is_active=False,
            resolved_at=timezone.now(),
        )
        if updated:
            logger.info(
                "Auto-resolved %d AnomalyFlag(s): rule=%s entity=%s",
                updated,
                rule_type,
                entity_id,
            )
