"""Automated tests for inference engine, missing artifacts, and risk categorization."""

import pytest
from pathlib import Path
from src.predictor import LandslidePredictor
from src.schema import PredictionRequest
from src.config import MODEL_ARTIFACT_PATH, METADATA_ARTIFACT_PATH, MODEL_STATUS_DEMO


def test_missing_model_artifact_returns_unavailable():
    """Verify that predictor handles absent model files safely without crashing."""
    predictor = LandslidePredictor(
        model_path=Path("non_existent_model_dir/model.joblib"),
        metadata_path=Path("non_existent_model_dir/meta.json"),
    )
    req = PredictionRequest(
        latitude=25.5788,
        longitude=91.8933,
        rainfall_24h_mm=45.0,
        slope_deg=30.0,
    )
    res = predictor.predict(req)

    assert res.prediction_status == "MODEL_UNAVAILABLE"
    assert res.risk_score is None
    assert res.risk_category == "UNAVAILABLE"
    assert len(res.warnings) > 0


def test_valid_prediction_returns_demo_status():
    """Verify inference on existing model artifact produces structured output with demo warning."""
    predictor = LandslidePredictor(
        model_path=MODEL_ARTIFACT_PATH,
        metadata_path=METADATA_ARTIFACT_PATH,
    )
    req = PredictionRequest(
        latitude=25.5788,
        longitude=91.8933,
        rainfall_24h_mm=95.0,
        slope_deg=40.0,
        rainfall_72h_mm=180.0,
        elevation_m=1450.0,
        vegetation_ndvi=0.35,
        aspect_deg=180.0,
        lithology="Metamorphic",
        soil_type="Gravelly_Soil",
    )
    res = predictor.predict(req)

    assert res.prediction_status in ["SUCCESS", "DEMO_PREDICTION"]
    assert res.model_status == MODEL_STATUS_DEMO
    assert res.risk_score is not None
    assert 0.0 <= res.risk_score <= 1.0
    assert res.risk_category in ["LOW", "MODERATE", "HIGH", "SEVERE"]
    assert res.is_provisional_category is True
    assert len(res.top_contributing_features) > 0
    assert "EXPERIMENTAL PROTOTYPE" in res.disclaimer


def test_zero_rainfall_high_slope_warning():
    """Verify distinction between static susceptibility and dynamic rainfall trigger."""
    predictor = LandslidePredictor(
        model_path=MODEL_ARTIFACT_PATH,
        metadata_path=METADATA_ARTIFACT_PATH,
    )
    req = PredictionRequest(
        latitude=25.5788,
        longitude=91.8933,
        rainfall_24h_mm=0.0,  # Zero rainfall
        slope_deg=45.0,        # Very steep slope
    )
    res = predictor.predict(req)

    # Check for domain warning explaining that rainfall trigger is missing
    warning_found = any("susceptibility" in w.lower() for w in res.warnings)
    assert warning_found, f"Expected static susceptibility warning in: {res.warnings}"
