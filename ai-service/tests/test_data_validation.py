"""Automated tests for dataset schema validation and integrity rules."""

import pytest
import pandas as pd
from pathlib import Path
from src.data_validator import DatasetValidator, DatasetValidationError
from src.config import SYNTHETIC_DATA_PATH


def test_synthetic_fixtures_validation_passes():
    """Verify that the official synthetic fixtures pass all validation rules."""
    validator = DatasetValidator()
    clean_df, metadata = validator.validate_file(SYNTHETIC_DATA_PATH)

    assert len(clean_df) > 0
    assert metadata["valid_rows"] == len(clean_df)
    assert metadata["is_synthetic_dataset"] is True
    assert "class_distribution" in metadata
    assert metadata["class_distribution"]["non_landslide_count_0"] > 0
    assert metadata["class_distribution"]["landslide_count_1"] > 0


def test_missing_required_columns_fails():
    """Verify that omitting a required column raises DatasetValidationError."""
    df_missing = pd.DataFrame({
        "record_id": ["TEST-1"],
        "latitude": [25.5],
        # longitude missing
        "observation_timestamp": ["2023-05-10T08:00:00Z"],
        "rainfall_24h_mm": [20.0],
        "slope_deg": [30.0],
        "landslide_occurred": [1],
        "is_synthetic": [True],
        "data_source": ["TEST"],
    })
    validator = DatasetValidator()
    with pytest.raises(DatasetValidationError, match="Missing required columns"):
        validator.validate_dataframe(df_missing)


def test_out_of_bounds_coordinates_dropped():
    """Verify that records with invalid latitude (> 90) or longitude (< -180) are dropped."""
    df_bad_coords = pd.DataFrame({
        "record_id": ["TEST-1", "TEST-2"],
        "latitude": [95.0, 25.5],  # 95.0 is invalid
        "longitude": [91.8, -190.0],  # -190.0 is invalid
        "observation_timestamp": ["2023-05-10T08:00:00Z", "2023-05-11T08:00:00Z"],
        "rainfall_24h_mm": [20.0, 10.0],
        "slope_deg": [30.0, 25.0],
        "landslide_occurred": [1, 0],
        "is_synthetic": [True, True],
        "data_source": ["TEST", "TEST"],
    })
    validator = DatasetValidator()
    with pytest.raises(DatasetValidationError, match="All records dropped|No valid target labels|Dataset empty"):
        validator.validate_dataframe(df_bad_coords)


def test_inconsistent_rainfall_dropped():
    """Verify that rainfall_72h_mm < rainfall_24h_mm violates physics and is dropped."""
    df_bad_rain = pd.DataFrame({
        "record_id": ["TEST-VALID", "TEST-INVALID"],
        "latitude": [25.5, 25.6],
        "longitude": [91.8, 91.9],
        "observation_timestamp": ["2023-05-10T08:00:00Z", "2023-05-11T08:00:00Z"],
        "rainfall_24h_mm": [50.0, 100.0],
        "rainfall_72h_mm": [80.0, 20.0],  # 20.0 < 100.0 is physically impossible
        "slope_deg": [30.0, 35.0],
        "landslide_occurred": [0, 1],
        "is_synthetic": [True, True],
        "data_source": ["TEST", "TEST"],
    })
    validator = DatasetValidator()
    clean_df, metadata = validator.validate_dataframe(df_bad_rain)

    assert len(clean_df) == 1
    assert clean_df.iloc[0]["record_id"] == "TEST-VALID"
    assert metadata["dropped_rows"] == 1


def test_synthetic_commingling_rejection():
    """Verify that mixing synthetic and real data without explicit flag is rejected."""
    df_commingled = pd.DataFrame({
        "record_id": ["TEST-1", "TEST-2"],
        "latitude": [25.5, 25.6],
        "longitude": [91.8, 91.9],
        "observation_timestamp": ["2023-05-10T08:00:00Z", "2023-05-11T08:00:00Z"],
        "rainfall_24h_mm": [50.0, 60.0],
        "slope_deg": [30.0, 35.0],
        "landslide_occurred": [0, 1],
        "is_synthetic": [True, False],  # Mixed!
        "data_source": ["SYNTH", "GSI"],
    })
    validator = DatasetValidator(allow_synthetic_mixture=False)
    with pytest.raises(DatasetValidationError, match="commingles synthetic"):
        validator.validate_dataframe(df_commingled)


def test_deduplication_of_identical_records():
    """Verify that identical space-time observations are deduplicated."""
    df_duplicates = pd.DataFrame({
        "record_id": ["TEST-1", "TEST-2"],
        "latitude": [25.5, 25.5],
        "longitude": [91.8, 91.8],
        "observation_timestamp": ["2023-05-10T08:00:00Z", "2023-05-10T08:00:00Z"],
        "rainfall_24h_mm": [50.0, 50.0],
        "slope_deg": [30.0, 30.0],
        "landslide_occurred": [0, 0],
        "is_synthetic": [True, True],
        "data_source": ["TEST", "TEST"],
    })
    validator = DatasetValidator()
    clean_df, metadata = validator.validate_dataframe(df_duplicates)

    assert len(clean_df) == 1
    assert metadata["dropped_rows"] == 1
