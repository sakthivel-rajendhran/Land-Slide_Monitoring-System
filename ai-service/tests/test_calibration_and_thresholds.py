"""Unit tests for probability calibration deferral and candidate thresholds governance."""

import json
import pytest
import numpy as np

from src.calibration import CalibrationDecisionEngine
from src.config import BASE_DIR, CANDIDATE_THRESHOLDS_PATH


def test_calibration_deferred_for_synthetic_dataset():
    """Calibration must be strictly deferred when dataset is synthetic."""
    res = CalibrationDecisionEngine.assess_calibration_eligibility(
        total_records=500,
        positive_events=250,
        is_synthetic=True,
    )
    assert res["status"] == "CALIBRATION_DEFERRED"
    assert res["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert res["can_deploy"] is False


def test_calibration_deferred_for_small_historical_sample():
    """Calibration must be strictly deferred when sample size is below minimum threshold."""
    res = CalibrationDecisionEngine.assess_calibration_eligibility(
        total_records=20,
        positive_events=10,
        is_synthetic=False,
    )
    assert res["status"] == "CALIBRATION_DEFERRED"
    assert res["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert res["can_deploy"] is False
    assert "Insufficient historical sample size" in res["reason"]


def test_calibration_eligible_only_when_sufficient_field_records():
    """Calibration may only be considered when real records exceed threshold."""
    res = CalibrationDecisionEngine.assess_calibration_eligibility(
        total_records=250,
        positive_events=80,
        is_synthetic=False,
    )
    assert res["status"] == "CALIBRATION_ELIGIBLE"
    assert res["can_deploy"] is True


def test_brier_score_computation():
    """Verify Brier Score calculation."""
    y_true = np.array([1, 0, 1, 0])
    y_scores = np.array([0.9, 0.1, 0.8, 0.2])
    brier = CalibrationDecisionEngine.compute_brier_score(y_true, y_scores)
    assert brier is not None
    assert 0.0 <= brier <= 1.0


def test_candidate_thresholds_schema_and_status():
    """Verify candidate threshold configuration file integrity."""
    assert CANDIDATE_THRESHOLDS_PATH.exists()
    with open(CANDIDATE_THRESHOLDS_PATH, "r", encoding="utf-8") as f:
        config = json.load(f)

    assert config["threshold_set_id"] == "TH-NE-INDIA-V1-CANDIDATE"
    assert config["version"] == "1.0.0-candidate"
    assert config["review_status"] == "PENDING_EXPERT_REVIEW"
    assert isinstance(config["thresholds"], list)
    assert len(config["thresholds"]) == 4

    categories = [t["category"] for t in config["thresholds"]]
    assert categories == ["LOW", "MODERATE", "HIGH", "SEVERE"]

    # Verify coverage across [0.0, 1.0]
    assert config["thresholds"][0]["range_min"] == 0.0
    assert config["thresholds"][-1]["range_max"] == 1.0

    # Verify required reviewer qualifications exist
    assert len(config["required_reviewer_qualifications"]) >= 2
