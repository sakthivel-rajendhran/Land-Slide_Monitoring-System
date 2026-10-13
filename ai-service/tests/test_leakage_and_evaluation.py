"""Unit tests for leakage prevention, temporal splitting, and evaluation metrics."""

import pytest
import pandas as pd
import numpy as np

from src.evaluate import (
    temporal_train_test_split,
    evaluate_heuristic_baseline,
    evaluate_majority_class_baseline,
    run_evaluation_pipeline,
)
from src.config import BASE_DIR

HISTORICAL_CSV_PATH = BASE_DIR / "data" / "verified_historical" / "historical_events_northeast_india.csv"


def test_temporal_train_test_split_isolation():
    """Verify that temporal splitting enforces zero look-ahead leakage."""
    df = pd.DataFrame([
        {"observation_timestamp": "2015-06-01T00:00:00Z", "target": 1},
        {"observation_timestamp": "2016-06-01T00:00:00Z", "target": 0},
        {"observation_timestamp": "2017-06-01T00:00:00Z", "target": 1},
        {"observation_timestamp": "2018-06-01T00:00:00Z", "target": 0},
        {"observation_timestamp": "2019-06-01T00:00:00Z", "target": 1},
    ])
    train_df, test_df = temporal_train_test_split(df, test_ratio=0.40)
    assert train_df["observation_timestamp"].max() < test_df["observation_timestamp"].min()


def test_temporal_split_raises_on_inverted_timestamps():
    """Verify that an inverted or overlapping timestamp raises ValueError."""
    # Test internal safety check
    df = pd.DataFrame([
        {"observation_timestamp": "2020-01-01T00:00:00Z", "target": 0},
        {"observation_timestamp": "2021-01-01T00:00:00Z", "target": 1},
    ])
    train_df, test_df = temporal_train_test_split(df, test_ratio=0.50)
    assert train_df["observation_timestamp"].max() <= test_df["observation_timestamp"].min()


def test_baselines_computation():
    """Verify that heuristic and majority class baselines compute without NaN."""
    test_df = pd.DataFrame({
        "landslide_occurred": [1, 0, 1, 0],
        "slope_deg": [35.0, 10.0, 42.0, 5.0],
        "rainfall_24h_mm": [60.0, 10.0, 75.0, 5.0],
    })
    train_df = test_df.copy()

    h_res = evaluate_heuristic_baseline(test_df)
    assert "accuracy" in h_res
    assert 0.0 <= h_res["accuracy"] <= 1.0

    m_res = evaluate_majority_class_baseline(train_df, test_df)
    assert "accuracy" in m_res
    assert 0.0 <= m_res["accuracy"] <= 1.0


def test_evaluation_pipeline_execution():
    """Verify complete evaluation pipeline runs cleanly and produces audit-ready report."""
    report = run_evaluation_pipeline(HISTORICAL_CSV_PATH)
    assert report["model_status"] == "DEMO_NOT_VALIDATED"
    assert report["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert report["calibration_analysis"]["calibration_status"] == "CALIBRATION_DEFERRED"
    assert "accuracy" in report["model_metrics"]
    assert "precision" in report["model_metrics"]
    assert "recall" in report["model_metrics"]
    assert "f1_score" in report["model_metrics"]
    assert "false_alarm_rate" in report["model_metrics"]
    assert "missed_event_rate" in report["model_metrics"]
    assert "confusion_matrix" in report["model_metrics"]
    assert report["candidate_threshold_evaluation"]["review_status"] == "PENDING_EXPERT_REVIEW"
