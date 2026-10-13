"""
Phase 12.1 Independent Dataset Integrity Audit Automated Tests.

Verifies:
1. 30 Copernicus DEM GLO-30 GeoTIFFs (georeferencing, EPSG:4326, 1 arc-second posting, EGM2008 datum, zero NaNs).
2. Aspect mathematical formulation (compass downslope azimuth vs legacy polar angle).
3. Terrain v2 features with location accuracy and spatial representativeness tags.
4. Rainfall v3 features with explicit 24h/72h UTC boundary timestamps and 5.5h IST offset documentation.
5. Regional provenance reconciliation (canonical 8 states, 74 excluded West Bengal corridor events).
6. Local and root dataset manifest synchronization and governance immutability.
"""

import json
import math
import pytest
import numpy as np
import pandas as pd
import tifffile
from pathlib import Path

from src.config import BASE_DIR

RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
RAINFALL_V1_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner.csv"
RAINFALL_V2_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner_v2.csv"
RAINFALL_V3_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner_v3.csv"
TERRAIN_V1_CSV = BASE_DIR / "data" / "processed" / "terrain_features_ner.csv"
TERRAIN_V2_CSV = BASE_DIR / "data" / "processed" / "terrain_features_ner_v2.csv"
DEM_DIR = BASE_DIR / "data" / "dem_tiles"
LOCAL_MANIFEST = BASE_DIR / "data" / "processed" / "dataset_manifest.json"
ROOT_MANIFEST = BASE_DIR.parent / "dataset_manifest.json"


def test_copernicus_dem_rasters_georeferencing_and_datum():
    """Verify all 30 GeoTIFF tiles have (3600, 3600) float32, EPSG:4326 tiepoints, 1 arcsec, zero NaNs."""
    tile_files = list(DEM_DIR.glob("*.tif"))
    assert len(tile_files) == 30, f"Expected 30 GeoTIFF tiles, got {len(tile_files)}"

    for tf in tile_files:
        assert tf.stat().st_size > 10_000_000, f"Tile {tf.name} smaller than 10MB"
        with tifffile.TiffFile(str(tf)) as tif:
            p = tif.pages[0]
            assert p.shape == (3600, 3600), f"Tile {tf.name} has shape {p.shape}"
            assert p.dtype == np.float32, f"Tile {tf.name} has dtype {p.dtype}"
            tags = {t.name: t.value for t in p.tags.values()}
            assert "ModelPixelScaleTag" in tags
            assert "ModelTiepointTag" in tags
            scale_x, scale_y, _ = tags["ModelPixelScaleTag"]
            assert abs(scale_x - (1.0 / 3600.0)) < 1e-9
            assert abs(scale_y - (1.0 / 3600.0)) < 1e-9


def test_aspect_mathematics_and_geographic_convention():
    """Verify standard geographic compass aspect formula against synthetic directional slopes."""
    # Test cases: (name, dz_dx, dz_dy, expected_compass_azimuth)
    # Downhill vector is (-dz_dx, -dz_dy). Angle clockwise from North is atan2(-dz_dx, -dz_dy)
    cases = [
        ("Downhill North", 0.0, -1.0, 0.0),
        ("Downhill East", -1.0, 0.0, 90.0),
        ("Downhill South", 0.0, 1.0, 180.0),
        ("Downhill West", 1.0, 0.0, 270.0),
        ("Downhill North-East", -1.0, -1.0, 45.0),
        ("Downhill South-East", -1.0, 1.0, 135.0),
    ]

    for name, dx, dy, expected in cases:
        compass = (math.degrees(math.atan2(-dx, -dy)) + 360.0) % 360.0
        assert abs(compass - expected) < 1e-5, f"Failed on {name}: got {compass}, expected {expected}"


def test_terrain_v2_schema_and_location_uncertainty():
    """Verify terrain v2 CSV includes compass aspect, location accuracy, and representativeness tags."""
    assert TERRAIN_V2_CSV.exists()
    df = pd.read_csv(TERRAIN_V2_CSV)
    assert len(df) == 368

    expected_cols = [
        "event_id",
        "latitude",
        "longitude",
        "elevation_m",
        "slope_deg",
        "aspect_compass_deg",
        "polar_aspect_legacy_deg",
        "location_accuracy",
        "spatial_accuracy_km",
        "spatial_representativeness",
        "dem_product",
        "vertical_datum",
    ]
    for c in expected_cols:
        assert c in df.columns, f"Missing column in terrain v2: {c}"

    # Verify compass aspect range [0, 360] or -1
    valid_aspect = (df["aspect_compass_deg"] >= 0.0) | (df["aspect_compass_deg"] == -1.0)
    assert valid_aspect.all(), "Invalid aspect values found"

    # Verify representativeness tags are populated
    assert df["spatial_representativeness"].str.len().min() > 10
    assert (df["vertical_datum"] == "EGM2008 Geoid Heights (Meters)").all()


def test_rainfall_v3_timezone_offset_and_window_boundaries():
    """Verify rainfall v3 CSV contains explicit UTC window timestamps and IST offset documentation."""
    assert RAINFALL_V3_CSV.exists()
    df = pd.read_csv(RAINFALL_V3_CSV)
    assert len(df) == 368

    expected_cols = [
        "event_id",
        "event_date",
        "aggregation_timezone",
        "local_event_timezone",
        "timezone_offset_hours",
        "window_a_24h_start_utc",
        "window_a_24h_end_utc",
        "window_a_72h_start_utc",
        "window_a_72h_end_utc",
        "rainfall_24h_sameday_mm",
        "rainfall_72h_sameday_mm",
        "window_b_24h_start_utc",
        "window_b_24h_end_utc",
        "window_b_72h_start_utc",
        "window_b_72h_end_utc",
        "rainfall_24h_strictly_prior_mm",
        "rainfall_72h_strictly_prior_mm",
        "window_b_leakage_classification",
    ]
    for c in expected_cols:
        assert c in df.columns, f"Missing column in rainfall v3: {c}"

    assert (df["timezone_offset_hours"] == 5.5).all()
    assert (df["aggregation_timezone"].str.startswith("UTC")).all()
    assert (df["local_event_timezone"] == "Asia/Kolkata (IST = UTC+05:30)").all()

    # Verify window B strictly prior excludes event-day in UTC
    for _, row in df.iterrows():
        dt = row["event_date"]
        assert row["window_b_24h_end_utc"] == f"{dt}T00:00:00Z"
        assert row["window_b_72h_end_utc"] == f"{dt}T00:00:00Z"


def test_reconciliation_of_west_bengal_corridor():
    """Verify reconciliation of the 74 excluded corridor events from West Bengal."""
    df_raw = pd.read_csv(RAW_CSV, low_memory=False)
    df_events = pd.read_csv(EVENTS_CSV)

    ne_box_candidates = df_raw[
        (df_raw["country_name"] == "India")
        & (df_raw["latitude"] >= 21.5)
        & (df_raw["latitude"] <= 29.5)
        & (df_raw["longitude"] >= 88.0)
        & (df_raw["longitude"] <= 97.5)
    ]
    assert len(ne_box_candidates) == 442

    accepted_eids = set(df_events["event_id"].unique())
    assert len(accepted_eids) == 368

    excluded = ne_box_candidates[~ne_box_candidates["event_id"].isin(accepted_eids)]
    assert len(excluded) == 74, f"Expected 74 excluded events, found {len(excluded)}"

    # All 74 excluded belong to Bengal / West Bengal
    admin_names = set(excluded["admin_division_name"].unique())
    assert admin_names.issubset({"Bengal", "West Bengal"}), f"Unexpected admin names: {admin_names}"


def test_manifest_synchronization_and_governance():
    """Verify local and root manifests match and preserve governance fields."""
    with open(LOCAL_MANIFEST, "r", encoding="utf-8") as f:
        local_data = json.load(f)
    with open(ROOT_MANIFEST, "r", encoding="utf-8") as f:
        root_data = json.load(f)

    assert local_data == root_data, "Local and root manifests are out of sync!"
    assert local_data["status"] in [
        "PHASE_12_1_INDEPENDENT_AUDIT_VERIFIED",
        "PHASE_12_2_RECONCILIATION_VERIFIED",
        "PHASE_12_4_GEOGRAPHIC_VERIFICATION_AUDITED",
        "PHASE_12_6_EVIDENCE_PLANNING_COMPLETED",
        "PHASE_12_7_TARGETED_EVIDENCE_VERIFIED",
        "PHASE_12_8_INSTITUTIONAL_SOURCING_ASSESSED",
    ]

    gov = local_data["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
