"""
Phase 12.6 Evidence Acquisition and Data Enrichment Planning Automated Tests.

Verifies:
1. Existence and schema of PHASE_12_6_SOURCE_REGISTER.csv and PHASE_12_6_EVENT_PRIORITY.csv.
2. Source register clearly partitions into ACTUALLY_ACCESSED_AND_VERIFIED and PROPOSED_FOR_FUTURE_INVESTIGATION.
3. Event priority table covers all 368 accepted events without duplicates or orphan IDs.
4. Stratification into evidence priority tiers (Tier 1 high recovery, Tier 2 moderate, Tier 3 coarse, Tier 4 border unresolved).
5. Explicit preservation of unresolved border cases (Events 241, 3943, 3619).
6. 100% of events acknowledge missing intraday failure time and rainfall leakage concern.
7. Low-slope events (<5 deg and <10 deg) are flagged for centroid misrepresentation without discarding or fabricating negatives.
8. Preservation of mandatory AI governance invariants.
"""

import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR, DATA_READINESS_STATUS

ROOT_DIR = BASE_DIR.parent
SOURCE_REGISTER_CSV = ROOT_DIR / "PHASE_12_6_SOURCE_REGISTER.csv"
EVENT_PRIORITY_CSV = ROOT_DIR / "PHASE_12_6_EVENT_PRIORITY.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
MANIFEST_PATH = ROOT_DIR / "dataset_manifest.json"


def test_source_register_schema_and_verification_partition():
    """Verify source register schema and clear separation of accessed vs proposed sources."""
    assert SOURCE_REGISTER_CSV.exists(), f"Missing {SOURCE_REGISTER_CSV}"

    df = pd.read_csv(SOURCE_REGISTER_CSV)
    required_cols = [
        "source",
        "url",
        "access_date",
        "licence_or_terms",
        "geographic_coverage",
        "temporal_coverage",
        "expected_evidence",
        "limitations",
        "verification_status",
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required column in source register: {col}"

    # Partition check
    status_counts = df["verification_status"].value_counts().to_dict()
    assert status_counts.get("ACTUALLY_ACCESSED_AND_VERIFIED") == 4
    assert status_counts.get("PROPOSED_FOR_FUTURE_INVESTIGATION") == 6
    assert len(df) == 10


def test_event_priority_coverage_and_schema():
    """Verify event priority table covers all 368 accepted events with required columns."""
    assert EVENT_PRIORITY_CSV.exists(), f"Missing {EVENT_PRIORITY_CSV}"

    p_df = pd.read_csv(EVENT_PRIORITY_CSV)
    events_df = pd.read_csv(EVENTS_CSV)

    assert len(p_df) == 368
    assert p_df["event_id"].nunique() == 368
    assert set(p_df["event_id"]) == set(events_df["event_id"])

    required_cols = [
        "event_id",
        "current_geographic_status",
        "coordinate_accuracy",
        "event_time_available",
        "rainfall_leakage_concern",
        "terrain_representativeness_concern",
        "available_source_evidence",
        "recommended_next_action",
        "evidence_priority_tier",
        "confidence_score",
        "reason_for_confidence",
    ]
    for col in required_cols:
        assert col in p_df.columns, f"Missing column in event priority CSV: {col}"


def test_event_priority_tier_stratification():
    """Verify stratification across the 4 evidence priority tiers."""
    p_df = pd.read_csv(EVENT_PRIORITY_CSV)
    tier_counts = p_df["evidence_priority_tier"].value_counts().to_dict()

    assert tier_counts["TIER_1_HIGH_RECOVERY_POTENTIAL"] == 52
    assert tier_counts["TIER_2_MODERATE_RECOVERY_POTENTIAL"] == 177
    assert tier_counts["TIER_3_COARSE_REGIONAL_CENTROID"] == 136
    assert tier_counts["TIER_4_BORDER_UNRESOLVED"] == 3


def test_preservation_of_unresolved_border_cases():
    """Assert unresolved border edge cases (Events 241, 3943, 3619) are in Tier 4 and retain caution statuses."""
    p_df = pd.read_csv(EVENT_PRIORITY_CSV)

    tier4 = p_df[p_df["evidence_priority_tier"] == "TIER_4_BORDER_UNRESOLVED"]
    assert len(tier4) == 3
    assert set(tier4["event_id"]) == {241, 3943, 3619}

    e241 = tier4[tier4["event_id"] == 241].iloc[0]
    assert e241["current_geographic_status"] == "PENDING_GEOGRAPHIC_VERIFICATION"
    assert "PENDING_GEOGRAPHIC_VERIFICATION" in e241["recommended_next_action"]

    e3943 = tier4[tier4["event_id"] == 3943].iloc[0]
    assert e3943["current_geographic_status"] == "PENDING_GEOGRAPHIC_VERIFICATION"

    e3619 = tier4[tier4["event_id"] == 3619].iloc[0]
    assert e3619["current_geographic_status"] == "CONFLICTING_SOURCE_METADATA"


def test_intraday_time_and_rainfall_leakage_acknowledgement():
    """Assert 100% of prioritized events acknowledge missing event time and rainfall lookahead risk."""
    p_df = pd.read_csv(EVENT_PRIORITY_CSV)

    assert (p_df["event_time_available"] == "NO (Date only)").all()
    assert (p_df["rainfall_leakage_concern"].str.contains("LOOKAHEAD_RISK")).all()


def test_low_slope_terrain_flagging():
    """Assert events with low slopes (<5 deg and <10 deg) are explicitly flagged for centroid misrepresentation."""
    p_df = pd.read_csv(EVENT_PRIORITY_CSV)

    severe_flagged = p_df[p_df["terrain_representativeness_concern"].str.contains("SEVERE_CENTROID_MISREPRESENTATION")]
    assert len(severe_flagged) == 54, f"Expected 54 severe centroid flags (<5 deg), found {len(severe_flagged)}"

    moderate_flagged = p_df[p_df["terrain_representativeness_concern"].str.contains("MODERATE_CENTROID_SMOOTHING")]
    assert len(moderate_flagged) == 43, f"Expected 43 moderate centroid flags (5-10 deg), found {len(moderate_flagged)}"


def test_safety_governance_invariants_preserved():
    """Assert governance invariants and readiness status DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION."""
    assert DATA_READINESS_STATUS == "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"

    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    gov = manifest["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
