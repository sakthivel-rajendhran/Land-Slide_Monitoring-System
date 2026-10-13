"""Automated tests for model training reproducibility, leakage prevention, and metrics."""

import pytest
import pandas as pd
from pathlib import Path
import tempfile
import joblib

from src.train import train_model, split_data_preventing_leakage
from src.config import SYNTHETIC_DATA_PATH, MODEL_STATUS_DEMO


def test_training_pipeline_artifacts_creation():
    """Verify that train_model generates model, metadata, and evaluation report."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        model_out = tmp_path / "model.joblib"
        meta_out = tmp_path / "meta.json"
        eval_out = tmp_path / "eval.json"

        results = train_model(
            data_path=SYNTHETIC_DATA_PATH,
            output_model_path=model_out,
            output_metadata_path=meta_out,
            output_eval_path=eval_out,
            allow_synthetic_mixture=False,
        )

        assert model_out.exists()
        assert meta_out.exists()
        assert eval_out.exists()

        assert results["model_status"] == MODEL_STATUS_DEMO
        metrics = results["evaluation"]["metrics"]
        assert "precision" in metrics
        assert "recall" in metrics
        assert "f1_score" in metrics
        assert "confusion_matrix" in metrics
        assert "class_distribution_test" in metrics


def test_target_leakage_prevention_temporal_split():
    """Verify that the temporal split strictly prevents look-ahead data leakage."""
    df = pd.read_csv(SYNTHETIC_DATA_PATH)
    train_df, test_df = split_data_preventing_leakage(df, test_ratio=0.3, split_strategy="temporal")

    max_train_time = pd.to_datetime(train_df["observation_timestamp"]).max()
    min_test_time = pd.to_datetime(test_df["observation_timestamp"]).min()

    assert max_train_time <= min_test_time, (
        f"Data leakage detected! Max train time ({max_train_time}) > Min test time ({min_test_time})"
    )


def test_training_reproducibility():
    """Verify that identical random seed produces identical predictions."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        m1 = tmp_path / "m1.joblib"
        m2 = tmp_path / "m2.joblib"

        train_model(
            data_path=SYNTHETIC_DATA_PATH,
            output_model_path=m1,
            output_metadata_path=tmp_path / "meta1.json",
            output_eval_path=tmp_path / "eval1.json",
        )
        train_model(
            data_path=SYNTHETIC_DATA_PATH,
            output_model_path=m2,
            output_metadata_path=tmp_path / "meta2.json",
            output_eval_path=tmp_path / "eval2.json",
        )

        pipe1 = joblib.load(m1)
        pipe2 = joblib.load(m2)

        test_df = pd.DataFrame([{
            "latitude": 25.5788,
            "longitude": 91.8933,
            "rainfall_24h_mm": 85.0,
            "slope_deg": 38.0,
            "rainfall_72h_mm": 150.0,
            "elevation_m": 1450.0,
            "vegetation_ndvi": 0.45,
            "aspect_deg": 180.0,
            "lithology": "Sedimentary",
            "soil_type": "Clay_Loam",
        }])

        pred1 = pipe1.predict_proba(test_df)
        pred2 = pipe2.predict_proba(test_df)

        assert (pred1 == pred2).all(), "Predictions diverged across runs with identical seed!"
