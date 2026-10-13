"""Automated tests for FastAPI endpoints, request validation, and error handling."""

import pytest
from fastapi.testclient import TestClient
from src.api import app
from src.config import MODEL_STATUS_DEMO, MODEL_VERSION


@pytest.fixture
def client():
    """Create test client using TestClient context."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client):
    """Verify GET /health returns 200 and expected service status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "slopeguard-ai-service"
    assert data["version"] == MODEL_VERSION


def test_model_status_endpoint(client):
    """Verify GET /model/status returns governance status and evaluation summary."""
    res = client.get("/model/status")
    assert res.status_code == 200
    data = res.json()
    assert data["model_version"] == MODEL_VERSION
    assert data["model_status"] == MODEL_STATUS_DEMO
    assert data["artifact_loaded"] is True
    assert "evaluation_summary" in data
    assert "disclaimer" in data


def test_predict_endpoint_valid_request(client):
    """Verify POST /predict returns 200 with structured risk assessment."""
    payload = {
        "latitude": 25.5788,
        "longitude": 91.8933,
        "rainfall_24h_mm": 110.0,
        "slope_deg": 42.0,
        "rainfall_72h_mm": 210.0,
        "elevation_m": 1450.0,
        "vegetation_ndvi": 0.32,
        "aspect_deg": 180.0,
        "lithology": "Metamorphic",
        "soil_type": "Gravelly_Soil",
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["prediction_status"] in ["SUCCESS", "DEMO_PREDICTION"]
    assert data["model_status"] == MODEL_STATUS_DEMO
    assert "risk_score" in data
    assert 0.0 <= data["risk_score"] <= 1.0
    assert data["risk_category"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]
    assert data["is_provisional_category"] is True
    assert len(data["top_contributing_features"]) > 0
    assert len(data["warnings"]) > 0


def test_predict_endpoint_invalid_coordinates(client):
    """Verify POST /predict rejects out-of-bounds coordinates with 422."""
    payload = {
        "latitude": 95.0,  # Invalid (> 90.0)
        "longitude": 91.8933,
        "rainfall_24h_mm": 50.0,
        "slope_deg": 30.0,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert data["error"] == "Validation Error"


def test_predict_endpoint_inconsistent_rainfall(client):
    """Verify POST /predict rejects physically impossible rainfall values (72h < 24h) with 422."""
    payload = {
        "latitude": 25.5788,
        "longitude": 91.8933,
        "rainfall_24h_mm": 100.0,
        "rainfall_72h_mm": 30.0,  # 30.0 < 100.0
        "slope_deg": 35.0,
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
    data = res.json()
    assert data["error"] == "Validation Error"
    assert any("Physically inconsistent precipitation" in err for err in data["details"])


def test_predict_endpoint_negative_slope(client):
    """Verify POST /predict rejects negative slope angle with 422."""
    payload = {
        "latitude": 25.5788,
        "longitude": 91.8933,
        "rainfall_24h_mm": 50.0,
        "slope_deg": -5.0,  # Invalid
    }
    res = client.post("/predict", json=payload)
    assert res.status_code == 422
