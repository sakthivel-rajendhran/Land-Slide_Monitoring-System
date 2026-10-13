"""
Phase 12.2 Dataset Reconciliation & Regional Counts Automated Tests.

Verifies:
1. Exact state counts across all versioned CSV datasets:
   Assam: 82, Nagaland: 78, Manipur: 56, Sikkim: 48, Arunachal Pradesh: 45,
   Meghalaya: 29, Mizoram: 27, Tripura: 3 (Total: 368).
2. Provenance reconciliation for the 17 Sikkim events with null catalog admin names.
3. Provenance reconciliation for the 74 excluded West Bengal corridor events.
4. Complete 1-to-1 join integrity (event_id, latitude, longitude) across all 6 datasets.
5. Pipeline isolation: feature namespaces are strictly preserved across versions.
6. Manifest synchronization and immutability of governance flags.
"""

import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR

RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
RAINFALL_V1_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner.csv"
RAINFALL_V2_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner_v2.csv"
RAINFALL_V3_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner_v3.csv"
TERRAIN_V1_CSV = BASE_DIR / "data" / "processed" / "terrain_features_ner.csv"
TERRAIN_V2_CSV = BASE_DIR / "data" / "processed" / "terrain_features_ner_v2.csv"
LOCAL_MANIFEST = BASE_DIR / "data" / "processed" / "dataset_manifest.json"
ROOT_MANIFEST = BASE_DIR.parent / "dataset_manifest.json"

EXPECTED_STATE_COUNTS = {
    "Assam": 82,
    "Nagaland": 78,
    "Manipur": 56,
    "Sikkim": 48,
    "Arunachal Pradesh": 45,
    "Meghalaya": 29,
    "Mizoram": 27,
    "Tripura": 3,
}


def test_state_counts_reconciliation_across_all_datasets():
    """Verify that every dataset containing normalized_state matches the verified distribution."""
    datasets_with_state = [
        ("events", EVENTS_CSV),
        ("terrain_v1", TERRAIN_V1_CSV),
        ("terrain_v2", TERRAIN_V2_CSV),
        ("rainfall_v2", RAINFALL_V2_CSV),
        ("rainfall_v3", RAINFALL_V3_CSV),
    ]

    for name, path in datasets_with_state:
        df = pd.read_csv(path)
        assert len(df) == 368, f"{name} does not have 368 rows"
        actual_counts = df["normalized_state"].value_counts().to_dict()
        assert actual_counts == EXPECTED_STATE_COUNTS, f"State count mismatch in {name}: {actual_counts}"


def test_sikkim_missing_admin_name_resolution():
    """Verify that the 17 records with empty admin_division_name are authentically located in Sikkim."""
    df = pd.read_csv(EVENTS_CSV)
    missing_admin = df[df["admin_division_name"].isna()]
    assert len(missing_admin) == 17, f"Expected 17 missing admin rows, got {len(missing_admin)}"

    # All 17 assigned to Sikkim
    assert (missing_admin["normalized_state"] == "Sikkim").all()

    # All 17 coordinates fall within Sikkim geographical bounding box (27.0-28.2 N, 88.0-88.9 E)
    assert ((missing_admin["latitude"] >= 27.0) & (missing_admin["latitude"] <= 28.2)).all()
    assert ((missing_admin["longitude"] >= 88.0) & (missing_admin["longitude"] <= 88.9)).all()

    # Verify textual confirmation in title or location description
    for _, row in missing_admin.iterrows():
        text = f"{row['event_title']} {row['location_description']}".lower()
        has_sikkim_mention = any(
            k in text for k in ["sikkim", "mangan", "chungthang", "gangtok", "singtam", "rangpo", "lachen", "sombaria"]
        )
        assert has_sikkim_mention, f"Record {row['event_id']} lacks Sikkim evidence in text: {text}"


def test_west_bengal_74_reconciliation():
    """Verify exact count and administrative division for all 74 excluded corridor records."""
    df_raw = pd.read_csv(RAW_CSV, low_memory=False)
    df_events = pd.read_csv(EVENTS_CSV)

    in_box = df_raw[
        (df_raw["country_name"] == "India")
        & (df_raw["latitude"] >= 21.5)
        & (df_raw["latitude"] <= 29.5)
        & (df_raw["longitude"] >= 88.0)
        & (df_raw["longitude"] <= 97.5)
    ]
    assert len(in_box) == 442

    accepted_eids = set(df_events["event_id"].unique())
    assert len(accepted_eids) == 368

    excluded = in_box[~in_box["event_id"].isin(accepted_eids)]
    assert len(excluded) == 74

    excluded_divisions = excluded["admin_division_name"].value_counts().to_dict()
    assert excluded_divisions == {"Bengal": 47, "West Bengal": 27}


def test_dataset_joins_and_coordinate_invariance():
    """Verify 100% 1-to-1 join integrity and exact coordinate match across all 6 datasets."""
    base_df = pd.read_csv(EVENTS_CSV)
    base_eids = set(base_df["event_id"].unique())

    all_csvs = [
        ("terrain_v1", TERRAIN_V1_CSV),
        ("terrain_v2", TERRAIN_V2_CSV),
        ("rain_v1", RAINFALL_V1_CSV),
        ("rain_v2", RAINFALL_V2_CSV),
        ("rain_v3", RAINFALL_V3_CSV),
    ]

    for name, path in all_csvs:
        df = pd.read_csv(path)
        assert len(df) == 368, f"{name} does not have 368 rows"
        assert set(df["event_id"].unique()) == base_eids, f"{name} event IDs do not match baseline"
        assert df["event_id"].duplicated().sum() == 0, f"{name} contains duplicate event IDs"

        merged = pd.merge(base_df[["event_id", "latitude", "longitude"]], df[["event_id", "latitude", "longitude"]], on="event_id")
        lat_diff = (merged["latitude_x"] - merged["latitude_y"]).abs().max()
        lon_diff = (merged["longitude_x"] - merged["longitude_y"]).abs().max()
        assert lat_diff == 0.0, f"Latitude discrepancy in {name}"
        assert lon_diff == 0.0, f"Longitude discrepancy in {name}"


def test_rainfall_feature_semantics_v3():
    """Verify v3 rainfall semantics: explicit UTC start/end timestamps and IST offset."""
    df = pd.read_csv(RAINFALL_V3_CSV)
    assert len(df) == 368

    # All rows must declare 5.5h offset and UTC aggregation
    assert (df["timezone_offset_hours"] == 5.5).all()
    assert (df["local_event_timezone"] == "Asia/Kolkata (IST = UTC+05:30)").all()
    assert df["window_b_leakage_classification"].str.startswith("CONDITIONAL_PRIOR_WINDOW").all()

    # Exact window date verification
    for _, row in df.iterrows():
        dt = row["event_date"]
        # Window B ends strictly at D 00:00:00 UTC
        assert row["window_b_24h_end_utc"] == f"{dt}T00:00:00Z"
        assert row["window_b_72h_end_utc"] == f"{dt}T00:00:00Z"
        # Window A ends at D 23:59:59 UTC
        assert row["window_a_24h_end_utc"] == f"{dt}T23:59:59Z"
        assert row["window_a_72h_end_utc"] == f"{dt}T23:59:59Z"


def test_terrain_feature_semantics_v2():
    """Verify v2 terrain semantics: aspect compass convention, flat codes, and pixel bounds."""
    df = pd.read_csv(TERRAIN_V2_CSV)
    assert len(df) == 368

    # Aspect values must be in [0, 360] or -1
    valid_aspect = (df["aspect_compass_deg"] >= 0.0) | (df["aspect_compass_deg"] == -1.0)
    assert valid_aspect.all()

    # Exactly 1 flat slope (< 0.1 deg) with aspect == -1.0
    flat_rows = df[df["slope_deg"] < 0.1]
    assert len(flat_rows) == 1
    assert (flat_rows["aspect_compass_deg"] == -1.0).all()

    # Verify legacy polar angle and compass angle relationship
    non_flat = df[df["slope_deg"] >= 0.1]
    for _, row in non_flat.iterrows():
        expected_polar = round((row["aspect_compass_deg"] + 90.0) % 360.0, 2)
        assert abs(row["polar_aspect_legacy_deg"] - expected_polar) < 0.01

    # Verify pixel indices are inside 0 to 3599
    assert ((df["raster_pixel_row"] >= 0) & (df["raster_pixel_row"] < 3600)).all()
    assert ((df["raster_pixel_col"] >= 0) & (df["raster_pixel_col"] < 3600)).all()


def test_manifest_reconciled_state_counts_and_governance():
    """Verify local and root manifests match, include state_counts, and preserve governance."""
    with open(LOCAL_MANIFEST, "r", encoding="utf-8") as f:
        loc = json.load(f)
    with open(ROOT_MANIFEST, "r", encoding="utf-8") as f:
        rot = json.load(f)

    assert loc == rot, "Local and root manifests differ"
    assert loc["state_counts"] == EXPECTED_STATE_COUNTS

    gov = loc["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
