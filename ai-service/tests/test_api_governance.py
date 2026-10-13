"""Integration tests for AI service governance API endpoints."""

import pytest
from fastapi.testclient import TestClient

from src.api import app

client = TestClient(app)


def test_model_status_governance_metadata():
    """Verify /model/status exposes Phase 11 governance fields."""
    response = client.get("/model/status")
    assert response.status_code == 200
    data = response.json()

    assert data["model_status"] == "DEMO_NOT_VALIDATED"
    assert data["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert data["calibration_status"] == "CALIBRATION_DEFERRED"
    assert data["threshold_set_version"] == "1.0.0-candidate"
    assert data["threshold_review_status"] == "PENDING_EXPERT_REVIEW"
    assert data["data_readiness_status"] == "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"
    assert "uncertainty_notice" in data
    assert "disclaimer" in data


def test_candidate_thresholds_endpoint():
    """Verify /model/thresholds endpoint returns candidate configuration."""
    response = client.get("/model/thresholds")
    assert response.status_code == 200
    data = response.json()

    assert data["threshold_set_id"] == "TH-NE-INDIA-V1-CANDIDATE"
    assert data["review_status"] == "PENDING_EXPERT_REVIEW"
    assert len(data["thresholds"]) == 4


def test_predict_governance_metadata():
    """Verify /predict response includes Phase 11 governance fields."""
    payload = {
        "latitude": 25.5788,
        "longitude": 91.8933,
        "rainfall_24h_mm": 45.0,
        "slope_deg": 35.0,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["model_status"] == "DEMO_NOT_VALIDATED"
    assert data["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert data["calibration_status"] == "CALIBRATION_DEFERRED"
    assert data["threshold_review_status"] == "PENDING_EXPERT_REVIEW"
    assert "risk_score" in data
    assert "risk_category" in data
