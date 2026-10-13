"""Unit and pipeline integration tests for automated data acquisition, terrain extraction, and rainfall window audit."""

import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR

RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
RAINFALL_V1_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner.csv"
RAINFALL_V2_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner_v2.csv"
TERRAIN_CSV = BASE_DIR / "data" / "processed" / "terrain_features_ner.csv"
TILE_INDEX_CSV = BASE_DIR / "data" / "processed" / "copernicus_dem_tile_index_requirements.csv"
DEM_DIR = BASE_DIR / "data" / "dem_tiles"
MANIFEST_PATH = BASE_DIR / "data" / "processed" / "dataset_manifest.json"
ROOT_MANIFEST_PATH = BASE_DIR.parent / "dataset_manifest.json"


def test_files_exist_on_disk():
    """Verify all real dataset artifacts exist on disk and are not missing."""
    assert RAW_CSV.exists(), f"Missing raw catalog CSV at {RAW_CSV}"
    assert EVENTS_CSV.exists(), f"Missing verified events CSV at {EVENTS_CSV}"
    assert RAINFALL_V1_CSV.exists(), f"Missing rainfall features v1 CSV at {RAINFALL_V1_CSV}"
    assert RAINFALL_V2_CSV.exists(), f"Missing rainfall features v2 CSV at {RAINFALL_V2_CSV}"
    assert TERRAIN_CSV.exists(), f"Missing terrain features CSV at {TERRAIN_CSV}"
    assert TILE_INDEX_CSV.exists(), f"Missing tile index CSV at {TILE_INDEX_CSV}"
    assert MANIFEST_PATH.exists(), f"Missing local dataset manifest at {MANIFEST_PATH}"
    assert ROOT_MANIFEST_PATH.exists(), f"Missing root dataset manifest at {ROOT_MANIFEST_PATH}"


def test_csv_parsing_and_source_column_handling():
    """Verify CSV parsing, record count, and preservation of mandatory source attributes."""
    df = pd.read_csv(EVENTS_CSV)
    assert len(df) == 368, f"Expected exactly 368 NE India events, got {len(df)}"

    required_cols = [
        "event_id",
        "event_date",
        "latitude",
        "longitude",
        "source_name",
        "source_link",
        "location_description",
        "location_accuracy",
        "landslide_category",
        "landslide_trigger",
        "admin_division_name",
        "normalized_state",
        "verification_status",
        "verification_evidence",
        "verification_notes",
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column in events CSV: {col}"

    assert df["event_id"].notna().all(), "Found null event IDs!"
    assert df["latitude"].notna().all(), "Found null latitudes!"
    assert df["longitude"].notna().all(), "Found null longitudes!"


def test_regional_filtering_and_state_bounds():
    """Verify all accepted events fall strictly within Northeast India bounding box and 8 states."""
    df = pd.read_csv(EVENTS_CSV)

    assert (df["latitude"] >= 21.5).all(), "Found latitude below 21.5°N"
    assert (df["latitude"] <= 29.5).all(), "Found latitude above 29.5°N"
    assert (df["longitude"] >= 88.0).all(), "Found longitude below 88.0°E"
    assert (df["longitude"] <= 97.5).all(), "Found longitude above 97.5°E"

    canonical_states = {
        "Arunachal Pradesh",
        "Assam",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Sikkim",
        "Tripura",
    }
    actual_states = set(df["normalized_state"].unique())
    assert actual_states.issubset(canonical_states), f"Unexpected states found: {actual_states - canonical_states}"


def test_coordinate_validation():
    """Verify coordinate validity and range enforcement."""
    df = pd.read_csv(EVENTS_CSV)
    assert ((df["latitude"] >= -90.0) & (df["latitude"] <= 90.0)).all()
    assert ((df["longitude"] >= -180.0) & (df["longitude"] <= 180.0)).all()


def test_duplicate_detection():
    """Verify zero duplicate event IDs and zero duplicate (lat, lon, date) records."""
    df = pd.read_csv(EVENTS_CSV)
    assert df["event_id"].duplicated().sum() == 0, "Duplicate event_id detected!"
    assert df.duplicated(subset=["latitude", "longitude", "event_date"]).sum() == 0, "Duplicate coordinate-date tuple detected!"


def test_source_traceability_and_verification_categories():
    """Verify explicit verification status taxonomy and non-empty evidence notes."""
    df = pd.read_csv(EVENTS_CSV)
    allowed_statuses = {"VERIFIED_FROM_SOURCE", "PARTIALLY_VERIFIED", "UNVERIFIED", "REJECTED"}
    assert set(df["verification_status"].unique()).issubset(allowed_statuses)

    assert (df["verification_evidence"].str.len() > 5).all()
    assert (df["verification_notes"].str.len() > 10).all()

    counts = df["verification_status"].value_counts()
    assert counts["VERIFIED_FROM_SOURCE"] == 289
    assert counts["PARTIALLY_VERIFIED"] == 79


def test_rainfall_v1_features():
    """Verify original rainfall v1 features dataset."""
    df = pd.read_csv(RAINFALL_V1_CSV)
    assert len(df) == 368
    assert (df["retrieval_status"] == "SUCCESS").all()
    assert (df["rainfall_72h_mm"] >= df["rainfall_24h_mm"]).all()
    assert (df["rainfall_24h_mm"] >= 0.0).all()


def test_rainfall_v2_dual_window_audit():
    """Verify version 2 audited dual-window rainfall features and look-ahead risk documentation."""
    df = pd.read_csv(RAINFALL_V2_CSV)
    assert len(df) == 368, f"Expected 368 rows in v2 rainfall dataset, got {len(df)}"

    # All 368 events are date-only
    assert (df["reported_time_precision"] == "DATE_ONLY").all()
    assert (~df["timestamp_known"]).all()

    # Window A (Same-day)
    assert (df["rainfall_72h_sameday_mm"] >= df["rainfall_24h_sameday_mm"]).all()
    assert (df["rainfall_24h_sameday_mm"] >= 0.0).all()

    # Window B (Strictly prior conservative)
    assert (df["rainfall_72h_strictly_prior_mm"] >= df["rainfall_24h_strictly_prior_mm"]).all()
    assert (df["rainfall_24h_strictly_prior_mm"] >= 0.0).all()

    # Audit checks
    assert "POTENTIAL_POST_FAILURE_LEAKAGE" in df["window_a_leakage_risk"].iloc[0]
    assert "ZERO_LOOKAHEAD_LEAKAGE_GUARANTEED" in df["window_b_leakage_risk"].iloc[0]
    assert (df["valid_observations_24h"] == 24).all()
    assert (df["valid_observations_72h"] == 72).all()
    assert (df["missing_hours_count"] == 0).all()


def test_copernicus_dem_tiles_integrity():
    """Verify that all 30 required unique Copernicus DEM GLO-30 tiles exist and are valid GeoTIFFs."""
    df_idx = pd.read_csv(TILE_INDEX_CSV)
    unique_tiles = df_idx["required_tile_filename"].unique()
    assert len(unique_tiles) == 30, f"Expected 30 unique required tiles, got {len(unique_tiles)}"

    for tile_name in unique_tiles:
        tile_path = DEM_DIR / tile_name
        assert tile_path.exists(), f"Tile missing on disk: {tile_name}"
        assert tile_path.stat().st_size > 10_000_000, f"Tile {tile_name} unexpectedly small ({tile_path.stat().st_size} bytes)"


def test_terrain_extraction_coverage_and_authenticity():
    """Verify authentic terrain extraction for all 368 events from the 30 GeoTIFF tiles with zero fabrication."""
    df_terrain = pd.read_csv(TERRAIN_CSV)
    assert len(df_terrain) == 368, f"Expected 368 authentic terrain records, got {len(df_terrain)}"

    # Zero nulls
    for col in ["elevation_m", "slope_deg", "aspect_deg", "elev_min_3x3_m", "elev_max_3x3_m", "elev_range_3x3_m"]:
        assert df_terrain[col].notna().all(), f"Found nulls in terrain metric: {col}"

    # Physical plausibility
    assert (df_terrain["elevation_m"] >= 10.0).all()
    assert (df_terrain["elevation_m"] <= 5000.0).all()
    assert (df_terrain["slope_deg"] >= 0.0).all()
    assert (df_terrain["slope_deg"] <= 90.0).all()
    assert (df_terrain["aspect_deg"] >= 0.0).all()
    assert (df_terrain["aspect_deg"] <= 360.0).all()
    assert (df_terrain["terrain_status"] == "EXTRACTED_FROM_AUTHENTIC_RASTER").all()

    # Provenance check: all 30 unique tiles used
    assert df_terrain["tile_source"].nunique() == 30


def test_dataset_manifest_integrity_and_governance():
    """Verify dataset manifest records exact verified counts, checksums, and safety governance."""
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest["status"] in [
        "DATA_ACQUISITION_AND_TERRAIN_EXTRACTION_VERIFIED",
        "PHASE_12_1_INDEPENDENT_AUDIT_VERIFIED",
        "PHASE_12_2_RECONCILIATION_VERIFIED",
        "PHASE_12_4_GEOGRAPHIC_VERIFICATION_AUDITED",
        "PHASE_12_6_EVIDENCE_PLANNING_COMPLETED",
        "PHASE_12_7_TARGETED_EVIDENCE_VERIFIED",
        "PHASE_12_8_INSTITUTIONAL_SOURCING_ASSESSED",
    ]

    counts = manifest["record_counts"]
    assert counts["raw_global_catalog"] == 11033
    assert counts["processed_events_ner"] == 368
    assert counts["rainfall_matched"] == 368
    assert counts["rainfall_failed"] == 0
    assert counts["terrain_extracted"] == 368
    assert counts["terrain_pending"] == 0
    assert counts["dem_tiles_downloaded"] == 30

    gov = manifest["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
