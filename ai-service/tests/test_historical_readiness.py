"""Unit and integration tests for historical dataset preparation and data readiness."""

import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR
from src.data_validator import DatasetValidator, DatasetValidationError
from src.prepare_historical_data import OPEN_HISTORICAL_LANDSLIDE_EVENTS

HISTORICAL_CSV_PATH = BASE_DIR / "data" / "verified_historical" / "historical_events_northeast_india.csv"
MANIFEST_PATH = BASE_DIR / "data" / "verified_historical" / "historical_dataset_manifest.json"


def test_historical_dataset_file_exists():
    """Verify that the historical dataset file and manifest exist."""
    assert HISTORICAL_CSV_PATH.exists(), f"Missing historical CSV at {HISTORICAL_CSV_PATH}"
    assert MANIFEST_PATH.exists(), f"Missing dataset manifest at {MANIFEST_PATH}"


def test_historical_dataset_schema_and_types():
    """Verify that all required columns exist with proper non-null values."""
    df = pd.read_csv(HISTORICAL_CSV_PATH)
    required_cols = [
        "record_id",
        "latitude",
        "longitude",
        "observation_timestamp",
        "rainfall_24h_mm",
        "slope_deg",
        "landslide_occurred",
        "is_synthetic",
        "data_source",
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column: {col}"
        assert df[col].notnull().all(), f"Found nulls in mandatory column: {col}"


def test_zero_synthetic_commingling_in_historical_dataset():
    """Strictly assert that no synthetic records are commingled with historical records."""
    df = pd.read_csv(HISTORICAL_CSV_PATH)
    is_synth = df["is_synthetic"].astype(str).str.lower().isin(["true", "1", "t"])
    assert not is_synth.any(), "Integrity violation: Synthetic records found in historical dataset!"


def test_physical_geotechnical_constraints():
    """Assert physical feasibility: 72h rainfall >= 24h rainfall, slope in [0, 90], rainfall >= 0."""
    df = pd.read_csv(HISTORICAL_CSV_PATH)
    assert (df["rainfall_24h_mm"] >= 0.0).all()
    assert (df["slope_deg"] >= 0.0).all()
    assert (df["slope_deg"] <= 90.0).all()
    if "rainfall_72h_mm" in df.columns:
        assert (df["rainfall_72h_mm"] >= df["rainfall_24h_mm"]).all()


def test_provenance_and_event_identifiers():
    """Assert all records retain non-empty provenance and unique record IDs."""
    df = pd.read_csv(HISTORICAL_CSV_PATH)
    assert df["record_id"].nunique() == len(df)
    assert (df["data_source"].str.len() > 3).all()


def test_validator_rejects_commingled_dataset():
    """Assert DatasetValidator rejects commingling synthetic and real records."""
    validator = DatasetValidator(allow_synthetic_mixture=False)
    commingled_df = pd.DataFrame([
        {
            "record_id": "REAL-1",
            "latitude": 25.5,
            "longitude": 91.8,
            "observation_timestamp": "2023-01-01T00:00:00Z",
            "rainfall_24h_mm": 50.0,
            "slope_deg": 35.0,
            "landslide_occurred": 1,
            "is_synthetic": False,
            "data_source": "REAL_EVENT",
        },
        {
            "record_id": "SYNTH-1",
            "latitude": 25.6,
            "longitude": 91.9,
            "observation_timestamp": "2023-01-02T00:00:00Z",
            "rainfall_24h_mm": 20.0,
            "slope_deg": 10.0,
            "landslide_occurred": 0,
            "is_synthetic": True,
            "data_source": "SYNTH_FIXTURE",
        },
    ])
    with pytest.raises(DatasetValidationError, match="commingles synthetic"):
        validator.validate_dataframe(commingled_df)
