"""
Probability Calibration Evaluator and Decision Engine for SlopeGuard.

Evaluates whether empirical calibration (Platt Sigmoid / Isotonic Regression)
is methodologically justified based on sample size, positive event count,
and data provenance. Enforces CALIBRATION_DEFERRED whenever evidence is insufficient.
"""

import logging
from typing import Dict, Any, Optional, Tuple
import numpy as np
from sklearn.metrics import brier_score_loss

logger = logging.getLogger(__name__)

# Minimum threshold for considering calibration deployment
MINIMUM_HISTORICAL_SAMPLE_SIZE = 100
MINIMUM_POSITIVE_EVENTS = 40


class CalibrationDecisionEngine:
    """Evaluates suitability of calibration deployment and calculates reliability metrics."""

    @staticmethod
    def assess_calibration_eligibility(
        total_records: int,
        positive_events: int,
        is_synthetic: bool,
    ) -> Dict[str, Any]:
        """
        Determine whether calibration mapping should be deployed or deferred.
        """
        if is_synthetic:
            return {
                "status": "CALIBRATION_DEFERRED",
                "output_type": "UNCALIBRATED_HAZARD_SCORE",
                "can_deploy": False,
                "reason": (
                    "Synthetic fixtures used for training. Calibrating probabilities on synthetic "
                    "data produces deceptive confidence curves unrepresentative of real terrain."
                ),
            }

        if total_records < MINIMUM_HISTORICAL_SAMPLE_SIZE or positive_events < MINIMUM_POSITIVE_EVENTS:
            return {
                "status": "CALIBRATION_DEFERRED",
                "output_type": "UNCALIBRATED_HAZARD_SCORE",
                "can_deploy": False,
                "reason": (
                    f"Insufficient historical sample size (N={total_records}, positive={positive_events}). "
                    f"Minimum required: N>={MINIMUM_HISTORICAL_SAMPLE_SIZE}, positive>={MINIMUM_POSITIVE_EVENTS}. "
                    "Fitting empirical calibration on limited data leads to high parameter variance and false precision."
                ),
            }

        return {
            "status": "CALIBRATION_ELIGIBLE",
            "output_type": "CALIBRATED_PROBABILITY_ESTIMATE",
            "can_deploy": True,
            "reason": "Sufficient real-world observations available for empirical calibration assessment.",
        }

    @staticmethod
    def compute_brier_score(y_true: np.ndarray, y_scores: np.ndarray) -> Optional[float]:
        """Compute Brier Score loss safely."""
        if len(y_true) == 0 or len(y_scores) == 0 or len(np.unique(y_true)) < 2:
            return None
        return round(float(brier_score_loss(y_true, y_scores)), 4)
