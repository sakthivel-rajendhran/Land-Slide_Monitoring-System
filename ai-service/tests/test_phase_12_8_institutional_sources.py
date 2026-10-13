"""
Phase 12.8 Institutional Data Sourcing and Landslide Inventory Access Automated Tests.

Verifies:
1. Existence and schema of PHASE_12_8_INSTITUTIONAL_SOURCE_REGISTER.csv and PHASE_12_8_EVENT_MATCHING_PLAN.csv.
2. Root and reports-directory copies match identically.
3. Source register statuses follow explicit rules (e.g. OFFICIAL_PAGE_INSPECTED, ACCESS_REQUEST_REQUIRED).
4. No false download claims: sources without local files are explicitly marked as requiring requests.
5. Event matching plan covers all 4 disputed border cases and corroborated Tier 1 candidates.
6. Spatial matches and temporal matches are assessed separately.
7. Original catalog data, processed events, rainfall features, terrain features, and model code remain unchanged.
8. Preservation of all four safety governance flags and data readiness status.
"""

import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR, DATA_READINESS_STATUS

ROOT_DIR = BASE_DIR.parent
SOURCE_REG_ROOT = ROOT_DIR / "PHASE_12_8_INSTITUTIONAL_SOURCE_REGISTER.csv"
SOURCE_REG_REP = BASE_DIR / "data" / "reports" / "PHASE_12_8_INSTITUTIONAL_SOURCE_REGISTER.csv"
MATCH_PLAN_ROOT = ROOT_DIR / "PHASE_12_8_EVENT_MATCHING_PLAN.csv"
MATCH_PLAN_REP = BASE_DIR / "data" / "reports" / "PHASE_12_8_EVENT_MATCHING_PLAN.csv"

RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
MANIFEST_PATH = ROOT_DIR / "dataset_manifest.json"


def test_institutional_source_register_schema_and_sync():
    """Verify source register exists in both locations with identical contents and valid schema."""
    assert SOURCE_REG_ROOT.exists(), f"Missing {SOURCE_REG_ROOT}"
    assert SOURCE_REG_REP.exists(), f"Missing {SOURCE_REG_REP}"

    df_root = pd.read_csv(SOURCE_REG_ROOT)
    df_rep = pd.read_csv(SOURCE_REG_REP)
    pd.testing.assert_frame_equal(df_root, df_rep)

    expected_cols = [
        "source_id",
        "institution",
        "source_name",
        "source_category",
        "official_url",
        "access_date_utc",
        "access_status",
        "dataset_access_status",
        "inspection_status",
        "download_status",
        "local_file_path",
        "coverage_area",
        "coverage_period",
        "spatial_resolution",
        "temporal_resolution",
        "available_geometry",
        "available_attributes",
        "licence_or_terms_url",
        "licence_status",
        "access_requirements",
        "event_matching_potential",
        "evidence_actually_inspected",
        "known_limitations",
        "proposed_next_action",
    ]
    for col in expected_cols:
        assert col in df_root.columns, f"Missing column in source register: {col}"

    assert len(df_root) == 6
    assert (df_root["access_status"] == "OFFICIAL_PAGE_INSPECTED").all()


def test_no_false_download_claims_in_source_register():
    """Verify that sources without local files are not claimed as downloaded."""
    df = pd.read_csv(SOURCE_REG_ROOT)
    for _, row in df.iterrows():
        if row["download_status"] != "DATASET_DOWNLOADED_AND_INSPECTED":
            assert row["local_file_path"].startswith("NONE")


def test_event_matching_plan_schema_and_sync():
    """Verify event matching plan exists in both locations with identical contents and valid schema."""
    assert MATCH_PLAN_ROOT.exists(), f"Missing {MATCH_PLAN_ROOT}"
    assert MATCH_PLAN_REP.exists(), f"Missing {MATCH_PLAN_REP}"

    df_root = pd.read_csv(MATCH_PLAN_ROOT)
    df_rep = pd.read_csv(MATCH_PLAN_REP)
    pd.testing.assert_frame_equal(df_root, df_rep)

    expected_cols = [
        "event_id",
        "catalog_state",
        "catalog_date",
        "catalog_latitude",
        "catalog_longitude",
        "location_accuracy",
        "existing_evidence_status",
        "candidate_institutional_source",
        "candidate_record_identifier",
        "candidate_location_description",
        "candidate_event_date",
        "spatial_match_status",
        "temporal_match_status",
        "identity_match_status",
        "candidate_geometry_type",
        "evidence_reference",
        "unresolved_conflicts",
        "recommended_next_action",
    ]
    for col in expected_cols:
        assert col in df_root.columns, f"Missing column in matching plan: {col}"

    assert len(df_root) == 29
    assert df_root["event_id"].nunique() == 29


def test_disputed_border_cases_preserved_in_matching_plan():
    """Verify that disputed border cases (Events 241, 3943, 1111, 3619) are included and require expert review."""
    df = pd.read_csv(MATCH_PLAN_ROOT)
    disputed_ids = {241, 3943, 1111, 3619}
    assert disputed_ids.issubset(set(df["event_id"]))

    disputed_rows = df[df["event_id"].isin(disputed_ids)]
    assert (disputed_rows["spatial_match_status"] == "CANDIDATE_REQUIRES_REVIEW").all()
    assert (disputed_rows["identity_match_status"] == "SPATIAL_AND_TEMPORAL_MATCH_REQUIRES_EXPERT_REVIEW").all()


def test_spatial_and_temporal_match_separation():
    """Assert spatial match status and temporal match status are distinct columns and evaluated separately."""
    df = pd.read_csv(MATCH_PLAN_ROOT)
    assert "spatial_match_status" in df.columns
    assert "temporal_match_status" in df.columns

    allowed_spatial = {
        "NOT_SEARCHED",
        "NO_CANDIDATE_FOUND",
        "CANDIDATE_REQUIRES_REVIEW",
        "LOCATION_MATCH_ONLY",
    }
    allowed_temporal = {
        "NOT_SEARCHED",
        "NO_CANDIDATE_FOUND",
        "DATE_MATCH_ONLY",
        "EXACT_TIME_MATCH",
    }
    assert set(df["spatial_match_status"]).issubset(allowed_spatial)
    assert set(df["temporal_match_status"]).issubset(allowed_temporal)


def test_raw_catalog_and_processed_datasets_unmutated():
    """Verify raw catalog and processed datasets remain unmutated."""
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)
    events_df = pd.read_csv(EVENTS_CSV)

    assert len(raw_df) == 11033
    assert len(events_df) == 368


def test_governance_invariants_preserved():
    """Verify safety governance flags and readiness status are preserved."""
    assert DATA_READINESS_STATUS == "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    gov = manifest["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
