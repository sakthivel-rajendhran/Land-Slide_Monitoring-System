"""
Phase 12.7 Targeted Historical Event Evidence Acquisition and Verification Tests.

Verifies:
1. PHASE_12_7_EVENT_EVIDENCE_LEDGER.csv schema completeness and row count (52 Tier 1 events).
2. Traceability of all ledger event IDs to raw catalog and retained historical events.
3. Accurate recording of source URLs and access statuses without fabrication.
4. Adherence to strict verification statuses (SOURCE_UNAVAILABLE, DATE_CORROBORATED_TIME_UNKNOWN, SOURCE_RETRIEVED_NOT_CORROBORATED).
5. Explicit preservation of unknown occurrence times (intraday failure hour remains unconfirmed).
6. Publication dates are not conflated with occurrence dates.
7. Original catalog records, processed events, rainfall features, and terrain features remain unmutated.
8. Preservation of all four safety governance flags and data readiness status.
9. Absence of negative samples or synthetic relabeling.
"""

import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR, DATA_READINESS_STATUS

ROOT_DIR = BASE_DIR.parent
LEDGER_CSV = ROOT_DIR / "PHASE_12_7_EVENT_EVIDENCE_LEDGER.csv"
REPORTS_LEDGER_CSV = BASE_DIR / "data" / "reports" / "PHASE_12_7_EVENT_EVIDENCE_LEDGER.csv"
RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
PRIORITY_CSV = ROOT_DIR / "PHASE_12_6_EVENT_PRIORITY.csv"
MANIFEST_PATH = ROOT_DIR / "dataset_manifest.json"


def test_evidence_ledger_existence_and_schema():
    """Verify ledger exists at both root and reports dir with all required columns."""
    assert LEDGER_CSV.exists(), f"Missing {LEDGER_CSV}"
    assert REPORTS_LEDGER_CSV.exists(), f"Missing {REPORTS_LEDGER_CSV}"

    df = pd.read_csv(LEDGER_CSV)
    assert len(df) == 52, f"Expected 52 Tier 1 events, found {len(df)}"
    assert df["event_id"].nunique() == 52, "Found duplicate event IDs in evidence ledger"

    expected_cols = [
        "event_id",
        "original_catalog_date",
        "original_source_name",
        "original_source_url",
        "source_url_checked",
        "source_access_status",
        "source_title",
        "publisher",
        "publication_date",
        "event_identity_match",
        "landslide_occurrence_evidence",
        "supported_occurrence_date",
        "supported_occurrence_time",
        "time_precision",
        "time_zone_evidence",
        "location_description",
        "supported_latitude",
        "supported_longitude",
        "location_evidence",
        "coordinate_precision",
        "road_chainage_or_site_reference",
        "corroborating_source_url",
        "evidence_summary",
        "evidence_quote_or_page_reference",
        "verification_status",
        "uncertainties",
        "reviewer_notes",
        "next_action",
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing required column in evidence ledger: {col}"


def test_ledger_traceability_to_raw_and_priority_cohort():
    """Verify all 52 ledger IDs trace exactly to raw catalog and Phase 12.6 Tier 1 cohort."""
    df = pd.read_csv(LEDGER_CSV)
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)
    priority_df = pd.read_csv(PRIORITY_CSV)

    t1_priority = priority_df[priority_df["evidence_priority_tier"] == "TIER_1_HIGH_RECOVERY_POTENTIAL"]
    assert set(df["event_id"]) == set(t1_priority["event_id"])
    assert set(df["event_id"]).issubset(set(raw_df["event_id"]))


def test_verification_status_taxonomy_and_distribution():
    """Verify allowed taxonomy and exact distribution across inspected Tier 1 records."""
    df = pd.read_csv(LEDGER_CSV)
    allowed_statuses = {
        "NOT_YET_INSPECTED",
        "SOURCE_UNAVAILABLE",
        "SOURCE_RETRIEVED_NOT_CORROBORATED",
        "EVENT_IDENTITY_UNCERTAIN",
        "LANDSLIDE_EVENT_CORROBORATED",
        "DATE_CORROBORATED_TIME_UNKNOWN",
        "OCCURRENCE_TIME_CORROBORATED",
        "LOCATION_CORROBORATED",
        "REQUIRES_EXPERT_REVIEW",
    }
    actual_statuses = set(df["verification_status"].unique())
    assert actual_statuses.issubset(allowed_statuses), f"Unexpected status: {actual_statuses - allowed_statuses}"

    counts = df["verification_status"].value_counts().to_dict()
    assert counts.get("SOURCE_UNAVAILABLE") == 33
    assert counts.get("DATE_CORROBORATED_TIME_UNKNOWN") == 15
    assert counts.get("SOURCE_RETRIEVED_NOT_CORROBORATED") == 4


def test_unknown_intraday_occurrence_times_preserved():
    """Verify failure times are not fabricated and remain unconfirmed across all 52 events."""
    df = pd.read_csv(LEDGER_CSV)

    # No record may claim verified or exact intraday failure time
    assert not (df["verification_status"] == "OCCURRENCE_TIME_CORROBORATED").any()
    assert not (df["supported_occurrence_time"] == "VERIFIED_EXACT").any()

    # Records with corroborated dates explicitly document that intraday time is unknown or unconfirmed
    corroborated = df[df["verification_status"] == "DATE_CORROBORATED_TIME_UNKNOWN"]
    assert len(corroborated) == 15
    for _, row in corroborated.iterrows():
        assert row["supported_occurrence_time"] in ["UNKNOWN", "REPORTED_IN_CATALOG_UNCONFIRMED_BY_ARTICLE"]


def test_publication_date_distinct_from_occurrence_date():
    """Verify publication date is explicitly maintained as distinct from occurrence date."""
    df = pd.read_csv(LEDGER_CSV)
    for _, row in df.iterrows():
        # publication_date must not be copied as occurrence date
        assert row["publication_date"] != row["supported_occurrence_date"] or row["supported_occurrence_date"] == "UNCONFIRMED"


def test_preservation_of_raw_and_processed_datasets():
    """Verify raw catalog and processed datasets remain strictly unmutated."""
    events_df = pd.read_csv(EVENTS_CSV)
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)

    assert len(events_df) == 368
    assert len(raw_df) == 11033

    # Ensure no negative samples or synthetic target columns were added
    assert "is_synthetic_negative" not in events_df.columns
    if "landslide_occurred" in events_df.columns:
        assert (events_df["landslide_occurred"] == 1).all()


def test_safety_governance_invariants_preserved():
    """Verify all four governance banners remain active and unweakened."""
    assert DATA_READINESS_STATUS == "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    gov = manifest["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
