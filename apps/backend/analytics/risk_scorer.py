"""
AOBA Workforce Intelligence Platform — Rule-Based Risk Scorer

Consumes Layer-1 signal scores and produces a weighted composite risk
score (0-100) per employee, along with a risk tier classification and
the top contributing factors.

Reference: Technical Handoff Doc v2.1 — RISK SCORING
"""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from analytics.layer1 import Layer1Calculator
from analytics.models import RiskScore
from employees.models import Employee

logger = logging.getLogger(__name__)


class RuleBasedRiskScorer:
    """Weighted composite risk scorer for Layer-1 HR signals.

    Signal weights are taken directly from the Technical Handoff Doc v2.1:
        High        → 3.0
        Medium-High → 2.5
        Medium      → 2.0
    """

    SIGNAL_WEIGHTS: dict[str, float] = {
        "tenure_risk": 3.0,            # High
        "compensation_ratio": 3.0,     # High
        "promotion_velocity": 2.5,     # Medium-High
        "manager_change_recency": 2.0, # Medium
        "team_attrition_exposure": 3.0, # High
        "time_since_role_change": 2.0,  # Medium
        "leave_anomaly": 2.0,          # Medium
        "onboarding_completion": 3.0,   # High
    }

    RISK_TIERS: list[tuple[int, str]] = [
        (25, "low"),
        (50, "medium"),
        (75, "high"),
        (100, "critical"),
    ]

    # ------------------------------------------------------------------ #
    # Single-employee scoring                                              #
    # ------------------------------------------------------------------ #
    def score_employee(self, signal_scores: dict[str, float | int]) -> dict[str, Any]:
        """Produce a composite risk assessment for one employee.

        Args:
            signal_scores: Dict mapping each signal name to its 0-100 score.
                           Missing signals are treated as 0 (neutral).

        Returns:
            A dict with keys:
                ``overall_score`` (int 0-100),
                ``risk_tier``     (str),
                ``component_scores`` (dict of weighted contributions),
                ``top_factors``  (list of top-3 signal names by contribution).
        """
        total_weight = sum(self.SIGNAL_WEIGHTS.values())

        component_scores: dict[str, float] = {}
        weighted_sum = 0.0

        for signal_name, weight in self.SIGNAL_WEIGHTS.items():
            raw = signal_scores.get(signal_name)
            if raw is None:
                raw = 0
            contribution = float(raw) * weight
            component_scores[signal_name] = round(contribution, 2)
            weighted_sum += contribution

        overall_score = int(round(weighted_sum / total_weight)) if total_weight else 0
        overall_score = max(0, min(100, overall_score))  # clamp

        risk_tier = self._classify_tier(overall_score)

        # Top 3 contributing factors (highest weighted contribution)
        sorted_factors = sorted(
            component_scores.items(), key=lambda kv: kv[1], reverse=True
        )
        top_factors = [name for name, _ in sorted_factors[:3]]

        return {
            "overall_score": overall_score,
            "risk_tier": risk_tier,
            "component_scores": component_scores,
            "top_factors": top_factors,
        }

    # ------------------------------------------------------------------ #
    # Company-wide batch scoring                                           #
    # ------------------------------------------------------------------ #
    def score_all(self, company_id: int) -> list[dict[str, Any]]:
        """Score every active employee in a company and persist results.

        Runs the full Layer-1 → Risk-Score pipeline:
        1. Calculate all Layer-1 signals via ``Layer1Calculator``.
        2. Score each employee.
        3. Upsert ``RiskScore`` records.

        Args:
            company_id: PK of the target Company.

        Returns:
            List of result dicts (one per employee).
        """
        calculator = Layer1Calculator()
        signals_df = calculator.calculate_all_signals(company_id)

        if signals_df.empty:
            logger.warning("No signals to score for company_id=%s", company_id)
            return []

        results: list[dict[str, Any]] = []
        now = timezone.now()

        for _, row in signals_df.iterrows():
            employee_id = row["employee_id"]
            signal_dict = {
                col: row[col]
                for col in Layer1Calculator.SIGNAL_NAMES
                if row[col] is not None
            }

            scored = self.score_employee(signal_dict)
            scored["employee_id"] = employee_id

            # ---- Persist to RiskScore model ---- #
            try:
                RiskScore.objects.update_or_create(
                    employee_id=employee_id,
                    defaults={
                        "overall_score": scored["overall_score"],
                        "risk_tier": scored["risk_tier"],
                        "component_scores": scored["component_scores"],
                        "top_factors": scored["top_factors"],
                        "calculated_at": now,
                    },
                )
            except Exception:
                logger.exception(
                    "Failed to persist RiskScore for employee %s", employee_id
                )

            results.append(scored)

        logger.info(
            "Risk scores calculated for %d employees (company_id=%s)",
            len(results),
            company_id,
        )
        return results

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #
    @classmethod
    def _classify_tier(cls, score: int) -> str:
        """Map a 0-100 score to a named risk tier."""
        for threshold, tier in cls.RISK_TIERS:
            if score <= threshold:
                return tier
        return "critical"  # fallback for score > 100
