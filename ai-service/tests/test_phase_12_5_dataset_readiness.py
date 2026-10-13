"""
Phase 12.5 Historical Dataset Readiness and Evidence Audit Automated Tests.

Verifies:
1. Event provenance tracing and 100% missing intraday timestamps in raw catalog.
2. Spatial accuracy quantification: dominance of approximate/centroid geocoding (98.91% coarse/approximate, only 1.09% exact).
3. Rainfall leakage classification: Window A confirmed as lookahead leakage; Window B confirmed as CONDITIONAL_PRIOR_WINDOW (not guaranteed leakage-free).
4. Terrain representativeness: quantification of low-slope anomalies (<5 deg and <10 deg) caused by town/road centroid geocoding.
5. Presence-only label quality: 100% occurrence-only inventory with 0 true negative non-landslide samples.
6. Ledger recalculation from data: 442 total, 368 accepted, 74 excluded, and exact status distributions with unresolved border conflicts preserved.
7. Boundary data provenance: GADM Level 1 WGS84 documentation and distinction from official Survey of India boundaries.
8. Manifest hash and referential integrity.
9. Readiness verdict and safety governance invariants.
"""

import hashlib
import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR, DATA_READINESS_STATUS

RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
RAINFALL_V3_CSV = BASE_DIR / "data" / "processed" / "historical_rainfall_features_ner_v3.csv"
TERRAIN_V2_CSV = BASE_DIR / "data" / "processed" / "terrain_features_ner_v2.csv"
LEDGER_CSV = BASE_DIR / "data" / "processed" / "geographic_verification_ledger.csv"
GADM_GEOJSON = BASE_DIR / "data" / "raw" / "india_state_boundaries_gadm.geojson"
MANIFEST_PATH = BASE_DIR.parent / "dataset_manifest.json"


def compute_sha256(file_path: Path) -> str:
    """Compute sha256 checksum of a file."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def test_readiness_event_provenance_and_missing_intraday_timestamps():
    """All 368 events trace to raw catalog; 100% lack intraday time-of-day timestamps."""
    events_df = pd.read_csv(EVENTS_CSV)
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)

    assert len(events_df) == 368
    retained_eids = set(events_df["event_id"].unique())
    assert len(retained_eids) == 368

    raw_retained = raw_df[raw_df["event_id"].isin(retained_eids)]
    assert len(raw_retained) == 368

    # All 368 have event dates
    assert events_df["event_date"].notna().all()

    # In raw NASA catalog, event_time is completely NaN across all 368 Northeast events
    assert raw_retained["event_time"].isna().all(), "Unexpected non-null event_time found in raw catalog"


def test_readiness_spatial_accuracy_and_centroid_dominance():
    """Quantify exact vs approximate coordinates: 98.91% are approximate, coarse, or unknown."""
    events_df = pd.read_csv(EVENTS_CSV)
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)

    merged = pd.merge(events_df[["event_id"]], raw_df[["event_id", "location_accuracy"]], on="event_id")
    assert len(merged) == 368

    acc_counts = merged["location_accuracy"].value_counts(dropna=False).to_dict()

    # Exactly 4 records have exact accuracy (1.09%)
    exact_count = acc_counts.get("exact", 0)
    assert exact_count == 4, f"Expected 4 exact coordinates, found {exact_count}"

    # 364 records (98.91%) have coarse/approximate accuracy
    approximate_count = len(merged) - exact_count
    assert approximate_count == 364
    assert round(exact_count / len(merged) * 100, 2) == 1.09
    assert round(approximate_count / len(merged) * 100, 2) == 98.91

    # Dominant categories are 5km (122), 25km (64), 10km (56), 50km (52), 1km (48)
    assert acc_counts["5km"] == 122
    assert acc_counts["25km"] == 64
    assert acc_counts["10km"] == 56
    assert acc_counts["50km"] == 52
    assert acc_counts["1km"] == 48


def test_readiness_rainfall_leakage_and_conditional_prior_classification():
    """Verify rainfall window leakage classifications: Window A has lookahead; Window B is conditional."""
    rain_df = pd.read_csv(RAINFALL_V3_CSV)
    assert len(rain_df) == 368

    # Window A (sameday inclusive) is 100% POTENTIAL_LOOKAHEAD_LEAKAGE
    assert (rain_df["window_a_leakage_classification"].str.startswith("POTENTIAL_LOOKAHEAD_LEAKAGE")).all()

    # Window B (ends at 00:00 UTC) is 100% CONDITIONAL_PRIOR_WINDOW, NOT guaranteed leakage-free
    assert (rain_df["window_b_leakage_classification"].str.startswith("CONDITIONAL_PRIOR_WINDOW")).all()

    # Time precision is date only for all 368 records
    assert (rain_df["reported_time_precision"] == "DATE_ONLY").all()

    # Units are millimeters and source is Open-Meteo ERA5 / Historical
    assert (rain_df["units"] == "mm").all()
    assert (rain_df["weather_source"].str.contains("ERA5")).all()
    assert (rain_df["weather_source"].str.contains("Open-Meteo")).all()


def test_readiness_terrain_representativeness_and_low_slope_anomaly():
    """Quantify low-slope anomalies (<5 deg and <10 deg) caused by valley/centroid geocoding."""
    terrain_df = pd.read_csv(TERRAIN_V2_CSV)
    assert len(terrain_df) == 368

    # All 368 have authentic Copernicus GLO-30 extraction
    assert (terrain_df["dem_product"].str.contains("Copernicus DEM GLO-30")).all()
    assert (terrain_df["extraction_status"] == "AUDITED_VERIFIED_AUTHENTIC").all()

    # Exactly 54 events (14.67%) have DEM slope < 5.0 degrees
    low_slope_5 = terrain_df[terrain_df["slope_deg"] < 5.0]
    assert len(low_slope_5) == 54

    # Exactly 97 events (26.36%) have DEM slope < 10.0 degrees
    low_slope_10 = terrain_df[terrain_df["slope_deg"] < 10.0]
    assert len(low_slope_10) == 97

    # Spatial representativeness field reflects this uncertainty
    rep_counts = terrain_df["spatial_representativeness"].value_counts().to_dict()
    assert any("COARSE_CENTROID_ONLY" in k for k in rep_counts.keys())
    assert any("MODERATE_SPATIAL_UNCERTAINTY" in k for k in rep_counts.keys())
    assert any("HIGH_SPATIAL_CONFIDENCE" in k for k in rep_counts.keys())


def test_readiness_presence_only_sampling_bias():
    """Verify inventory is presence-only (100% landslides, 0 true negative non-landslide samples)."""
    events_df = pd.read_csv(EVENTS_CSV)
    assert len(events_df) == 368

    # All records represent reported landslide events
    assert "event_id" in events_df.columns
    # Raw landslide category confirmed
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)
    raw_retained = raw_df[raw_df["event_id"].isin(events_df["event_id"])]
    assert raw_retained["landslide_category"].notna().all()

    # Zero negative records exist in the processed historical NER inventory
    assert "landslide_occurred" not in events_df.columns or (events_df["landslide_occurred"] == 1).all()


def test_readiness_geographic_ledger_recalculation_and_unresolved_conflicts():
    """Dynamically recalculate ledger counts and assert preservation of unresolved conflicts."""
    ledger_df = pd.read_csv(LEDGER_CSV)

    assert len(ledger_df) == 442
    assert ledger_df["event_id"].nunique() == 442

    accepted = ledger_df[ledger_df["inventory_status"] == "ACCEPTED_IN_NER_368"]
    excluded = ledger_df[ledger_df["inventory_status"] == "EXCLUDED_CORRIDOR_CANDIDATE"]
    assert len(accepted) == 368
    assert len(excluded) == 74

    status_counts = ledger_df["verification_status"].value_counts().to_dict()
    assert status_counts["SOURCE_LABEL_CONFIRMED"] == 385
    assert status_counts["CONFLICTING_SOURCE_METADATA"] == 41
    assert status_counts["GEOGRAPHICALLY_VERIFIED"] == 14
    assert status_counts["PENDING_GEOGRAPHIC_VERIFICATION"] == 2

    # Unresolved border cases: Events 241 and 3943 must remain PENDING_GEOGRAPHIC_VERIFICATION
    pending_records = ledger_df[ledger_df["verification_status"] == "PENDING_GEOGRAPHIC_VERIFICATION"]
    assert set(pending_records["event_id"].tolist()) == {241, 3943}

    # Border conflicting metadata cases: Events 1111 and 3619 must remain CONFLICTING_SOURCE_METADATA
    conflicting_records = ledger_df[ledger_df["verification_status"] == "CONFLICTING_SOURCE_METADATA"]
    assert 1111 in conflicting_records["event_id"].values
    assert 3619 in conflicting_records["event_id"].values


def test_readiness_boundary_dataset_provenance_and_authority():
    """Boundary file exists, has correct hash, and is documented as third-party GADM."""
    assert GADM_GEOJSON.exists()
    calculated_hash = compute_sha256(GADM_GEOJSON)
    expected_hash = "48769e32911313a4e741ebcdfb1359bd73ba7be3123cfad1bd10b3edf6e3d4cb"
    assert calculated_hash == expected_hash

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    gadm_entry = manifest["files"]["india_state_boundaries_gadm"]
    assert gadm_entry["sha256"] == expected_hash
    assert "GADM" in gadm_entry["notes"]
    assert "EPSG:4326" in gadm_entry["notes"]


def test_readiness_manifest_hash_integrity():
    """Verify manifest file hashes match actual workspace files."""
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    files_dict = manifest["files"]
    for key, info in files_dict.items():
        rel_path = info["path"]
        abs_path = BASE_DIR.parent / rel_path
        assert abs_path.exists(), f"File in manifest missing: {abs_path}"
        actual_hash = compute_sha256(abs_path)
        assert actual_hash == info["sha256"], f"Hash mismatch for {key}: {actual_hash} != {info['sha256']}"


def test_readiness_verdict_and_safety_governance_invariants():
    """Assert governance invariants and readiness verdict DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION."""
    assert DATA_READINESS_STATUS == "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    gov = manifest["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
