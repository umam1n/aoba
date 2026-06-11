"""
AOBA Workforce Intelligence Platform — Layer 1: Structural HR Signal Calculator

Computes 8 structural HR signals per employee, each normalized to 0-100.
Signals are derived from objective HR data (tenure, compensation, promotions,
manager changes, team attrition, role changes, leave patterns, onboarding).

Reference: Technical Handoff Doc v2.1 — LAYER 1 Structural HR Signals
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

import pandas as pd
from django.db.models import Avg, Count, Q, QuerySet
from django.utils import timezone

from employees.models import (
    CompensationHistory,
    Employee,
    LeaveRecord,
    ManagerChangeLog,
    RoleHistory,
)
from analytics.models import RoleCostBand

logger = logging.getLogger(__name__)


class Layer1Calculator:
    """Calculates 8 Layer-1 structural HR signals for a given company.

    Each signal method operates on a single employee and returns a score
    in the range [0, 100].  The ``calculate_all_signals`` method
    orchestrates batch computation across every active employee in a
    company and returns a tidy DataFrame.
    """

    SIGNAL_NAMES: list[str] = [
        "tenure_risk",
        "compensation_ratio",
        "promotion_velocity",
        "manager_change_recency",
        "team_attrition_exposure",
        "time_since_role_change",
        "leave_anomaly",
        "onboarding_completion",
    ]

    # ------------------------------------------------------------------ #
    # Risk-window constants                                                #
    # ------------------------------------------------------------------ #
    _TENURE_RISK_WINDOWS: list[tuple[int, int, int]] = [
        # (low_months, high_months, peak_score)
        (18, 24, 75),
        (48, 60, 60),   # 4-5 years
        (108, 120, 55),  # 9-10 years
    ]
    _TENURE_PROXIMITY_MONTHS = 12  # Half-width for linear interpolation

    # ------------------------------------------------------------------ #
    # 1. Tenure Risk                                                       #
    # ------------------------------------------------------------------ #
    def tenure_risk(self, employee: Employee) -> int:
        """Score attrition-spike probability based on tenure length.

        Returns higher scores when the employee's tenure falls within
        empirically-known attrition risk windows (18-24 mo, 4-5 yr,
        9-10 yr).  Outside those windows the score decays linearly with
        distance.
        """
        now = timezone.now().date()
        tenure_months = (now - employee.hire_date).days / 30.44  # avg days/month

        best_score = 0
        for low, high, peak in self._TENURE_RISK_WINDOWS:
            if low <= tenure_months <= high:
                return peak

            # Linear interpolation within proximity band
            if tenure_months < low:
                distance = low - tenure_months
            else:
                distance = tenure_months - high

            if distance <= self._TENURE_PROXIMITY_MONTHS:
                interpolated = int(peak * (1 - distance / self._TENURE_PROXIMITY_MONTHS))
                best_score = max(best_score, interpolated)

        return best_score

    # ------------------------------------------------------------------ #
    # 2. Compensation Ratio                                                #
    # ------------------------------------------------------------------ #
    def compensation_ratio(self, employee: Employee) -> int:
        """Score under/over-pay risk vs. market median for the role.

        Looks up ``RoleCostBand`` for the employee's current role_title,
        role_level, and company.  Returns a neutral 50 if no benchmark
        exists.
        """
        try:
            band = RoleCostBand.objects.get(
                company=employee.company,
                role_title=employee.role_title,
                role_level=employee.role_level,
            )
        except RoleCostBand.DoesNotExist:
            return 50  # no benchmark → neutral

        if band.median_salary <= 0:
            return 50

        ratio = float(employee.current_salary) / float(band.median_salary)

        if ratio < 0.70:
            return 100  # critical underpay
        elif ratio < 0.85:
            return 75
        elif ratio <= 1.0:
            return 40
        else:
            return 10  # overpaid — low flight risk from comp

    # ------------------------------------------------------------------ #
    # 3. Promotion Velocity                                                #
    # ------------------------------------------------------------------ #
    def promotion_velocity(self, employee: Employee) -> int:
        """Score stagnation risk based on time since last promotion.

        Compares the employee's months-since-last-promotion against the
        company-wide average promotion interval.
        """
        now = timezone.now().date()

        last_promo = (
            RoleHistory.objects.filter(employee=employee, change_type="promotion")
            .order_by("-effective_date")
            .first()
        )

        if last_promo:
            months_since = (now - last_promo.effective_date).days / 30.44
        else:
            # Never promoted → measure from hire date
            months_since = (now - employee.hire_date).days / 30.44

        # Company-wide average promotion interval
        company_avg = self._company_avg_promotion_interval(employee.company_id)

        delta = months_since - company_avg

        if delta > 24:
            return 85
        elif delta > 12:
            return 60
        elif delta > 0:
            return 30
        else:
            return 5

    def _company_avg_promotion_interval(self, company_id: int) -> float:
        """Return the average months between promotions across the company."""
        avg = (
            RoleHistory.objects.filter(
                employee__company_id=company_id,
                change_type="promotion",
            )
            .values("employee")
            .annotate(promo_count=Count("id"))
            .aggregate(avg_count=Avg("promo_count"))
        )
        avg_count = avg.get("avg_count") or 1.0

        # Rough estimate: company_tenure / promo_count per employee
        employees = Employee.objects.filter(company_id=company_id, is_active=True)
        if not employees.exists():
            return 24.0  # sensible default

        now = timezone.now().date()
        total_tenure_months = sum(
            (now - e.hire_date).days / 30.44 for e in employees.iterator()
        )
        avg_tenure = total_tenure_months / employees.count()
        return avg_tenure / avg_count if avg_count else 24.0

    # ------------------------------------------------------------------ #
    # 4. Manager Change Recency                                            #
    # ------------------------------------------------------------------ #
    def manager_change_recency(self, employee: Employee) -> int:
        """Score disruption risk from recent manager changes.

        Very recent changes (< 30 days) indicate high disruption potential.
        """
        last_change = (
            ManagerChangeLog.objects.filter(employee=employee)
            .order_by("-change_date")
            .first()
        )

        if not last_change:
            return 10  # no recorded change — stable

        days_since = (timezone.now().date() - last_change.change_date).days

        if days_since < 30:
            return 70
        elif days_since < 90:
            return 50
        elif days_since < 180:
            return 30
        else:
            return 10

    # ------------------------------------------------------------------ #
    # 5. Team Attrition Exposure                                           #
    # ------------------------------------------------------------------ #
    def team_attrition_exposure(self, employee: Employee) -> int:
        """Score risk from losing direct peers in the last 6 months.

        Peers = same manager + same department.  Rate × 200 is capped
        at 100 so that ≥ 50 % peer exits yield the maximum score.
        """
        six_months_ago = timezone.now().date() - timedelta(days=180)

        peers = Employee.objects.filter(
            company=employee.company,
            department=employee.department,
            manager=employee.manager,
        ).exclude(pk=employee.pk)

        total_peers = peers.count()
        if total_peers == 0:
            return 0

        exited = peers.filter(
            is_active=False,
            exit_date__gte=six_months_ago,
        ).count()

        rate = exited / total_peers
        return min(int(rate * 200), 100)

    # ------------------------------------------------------------------ #
    # 6. Time Since Last Role Change                                       #
    # ------------------------------------------------------------------ #
    def time_since_role_change(self, employee: Employee) -> int:
        """Score stagnation risk based on time since *any* role change."""
        now = timezone.now().date()

        last_role = (
            RoleHistory.objects.filter(employee=employee)
            .order_by("-effective_date")
            .first()
        )

        if last_role:
            months = (now - last_role.effective_date).days / 30.44
        else:
            months = (now - employee.hire_date).days / 30.44

        if months > 36:
            return 80
        elif months > 24:
            return 60
        elif months > 12:
            return 30
        else:
            return 5

    # ------------------------------------------------------------------ #
    # 7. Leave Anomaly                                                     #
    # ------------------------------------------------------------------ #
    def leave_anomaly(self, employee: Employee) -> int:
        """Score sudden increase in sick/personal leave vs. 12-month baseline.

        Compares the most recent 3-month leave total against the
        employee's own rolling 3-month averages over the prior 12 months.
        """
        now = timezone.now().date()
        three_months_ago = now - timedelta(days=90)
        twelve_months_ago = now - timedelta(days=365)

        leave_qs = LeaveRecord.objects.filter(
            employee=employee,
            leave_type__in=["sick", "personal"],
        )

        recent_days = self._sum_leave_days(leave_qs, three_months_ago, now)
        baseline_days = self._sum_leave_days(leave_qs, twelve_months_ago, three_months_ago)

        # Baseline is 9 months of data → average 3-month window
        baseline_avg = baseline_days / 3.0 if baseline_days > 0 else 0

        if baseline_avg == 0:
            # No historical baseline — can't flag anomaly
            return 5 if recent_days == 0 else 35

        ratio = recent_days / baseline_avg

        if ratio > 2.0:
            return 85
        elif ratio > 1.5:
            return 60
        elif ratio > 1.2:
            return 35
        else:
            return 5

    @staticmethod
    def _sum_leave_days(
        qs: QuerySet, start: Any, end: Any
    ) -> float:
        """Sum ``days_taken`` from LeaveRecord queryset in the given window."""
        agg = qs.filter(
            start_date__gte=start,
            start_date__lt=end,
        ).aggregate(total=pd.compat.import_optional_dependency("django.db.models").Sum("days_taken"))
        # Avoid importing Sum above through a separate path — use direct import
        # below as a cleaner alternative.
        from django.db.models import Sum as DjSum

        result = qs.filter(
            start_date__gte=start,
            start_date__lt=end,
        ).aggregate(total=DjSum("days_taken"))
        return float(result["total"] or 0)

    # ------------------------------------------------------------------ #
    # 8. Onboarding Completion (placeholder)                               #
    # ------------------------------------------------------------------ #
    def onboarding_completion(self, employee: Employee) -> int:
        """Placeholder — flag incomplete onboarding for recent hires.

        Full implementation requires an onboarding-milestone model
        (Phase 2).  For MVP, we heuristic-check whether a ``hire``
        RoleHistory entry exists within 90 days of hire_date.
        """
        now = timezone.now().date()
        days_since_hire = (now - employee.hire_date).days

        if days_since_hire > 90:
            return 10  # past onboarding window

        has_hire_record = RoleHistory.objects.filter(
            employee=employee,
            change_type="hire",
        ).exists()

        return 10 if has_hire_record else 70

    # ================================================================== #
    # Batch Orchestrator                                                   #
    # ================================================================== #
    def calculate_all_signals(self, company_id: int) -> pd.DataFrame:
        """Compute all 8 Layer-1 signals for every active employee.

        Args:
            company_id: Primary key of the target Company.

        Returns:
            A pandas DataFrame with columns:
            ``employee_id`` + one column per signal name.
            Each signal value is in the range [0, 100].
        """
        employees = Employee.objects.filter(
            company_id=company_id,
            is_active=True,
        ).select_related("company")

        if not employees.exists():
            logger.warning("No active employees found for company_id=%s", company_id)
            return pd.DataFrame(columns=["employee_id"] + self.SIGNAL_NAMES)

        rows: list[dict[str, Any]] = []

        for emp in employees.iterator():
            row: dict[str, Any] = {"employee_id": emp.pk}
            for signal_name in self.SIGNAL_NAMES:
                try:
                    calculator_fn = getattr(self, signal_name)
                    row[signal_name] = calculator_fn(emp)
                except Exception:
                    logger.exception(
                        "Signal %s failed for employee %s", signal_name, emp.pk
                    )
                    row[signal_name] = None  # graceful degradation
            rows.append(row)

        df = pd.DataFrame(rows)
        logger.info(
            "Layer-1 signals calculated for %d employees (company_id=%s)",
            len(df),
            company_id,
        )
        return df
