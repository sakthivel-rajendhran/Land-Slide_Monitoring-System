"""
Phase 12.4 Geographic Verification and Event Provenance Automated Tests.

Verifies:
1. Verification ledger coverage across all 442 regional candidates (368 accepted + 74 excluded).
2. Preservation of original raw NASA catalog attributes without mutation.
3. Every verification record cites documented boundary source (GADM Level 1 India EPSG:4326) and method.
4. Conflicting and uncertain records are strictly categorized (cannot silently become verified).
5. Explicit checks on the three border cases: Event 1111, Event 3619, and Event 9215.
6. Recomputed state totals calculated directly from data rows, not hardcoded.
7. Clear distinction between software test passes and empirical scientific/geographic validation.
"""

import json
import pytest
import pandas as pd
from pathlib import Path

from src.config import BASE_DIR

RAW_CSV = BASE_DIR / "data" / "raw" / "Global_Landslide_Catalog_Export_rows.csv"
EVENTS_CSV = BASE_DIR / "data" / "processed" / "historical_landslide_events_ner.csv"
LEDGER_CSV = BASE_DIR / "data" / "processed" / "geographic_verification_ledger.csv"
GADM_GEOJSON = BASE_DIR / "data" / "raw" / "india_state_boundaries_gadm.geojson"
LOCAL_MANIFEST = BASE_DIR / "data" / "processed" / "dataset_manifest.json"
ROOT_MANIFEST = BASE_DIR.parent / "dataset_manifest.json"


def test_verification_ledger_coverage_and_schema():
    """Verify ledger exists, covers all 442 candidates, and contains all required columns."""
    assert LEDGER_CSV.exists(), f"Ledger missing at {LEDGER_CSV}"
    assert GADM_GEOJSON.exists(), f"GADM boundaries missing at {GADM_GEOJSON}"

    df = pd.read_csv(LEDGER_CSV)
    assert len(df) == 442, f"Expected 442 candidate records in ledger, found {len(df)}"
    assert df["event_id"].nunique() == 442, "Found duplicate event IDs in ledger"

    expected_cols = [
        "event_id",
        "original_administrative_label",
        "proposed_normalized_state",
        "polygon_pip_state",
        "latitude",
        "longitude",
        "location_accuracy",
        "inventory_status",
        "verification_status",
        "evidence_source",
        "method",
        "reviewer_notes",
        "verification_date",
    ]
    for col in expected_cols:
        assert col in df.columns, f"Missing column in ledger: {col}"


def test_raw_catalog_fields_preserved():
    """Verify original raw catalog attributes are strictly preserved and unmutated."""
    raw_df = pd.read_csv(RAW_CSV, low_memory=False)
    ledger_df = pd.read_csv(LEDGER_CSV)

    merged = pd.merge(ledger_df, raw_df, on="event_id")
    assert len(merged) == 442

    for _, row in merged.iterrows():
        raw_admin = row["admin_division_name"]
        expected_raw_str = "MISSING_IN_CATALOG" if pd.isna(raw_admin) else str(raw_admin)
        assert row["original_administrative_label"] == expected_raw_str
        assert row["latitude_x"] == row["latitude_y"]
        assert row["longitude_x"] == row["longitude_y"]


def test_evidence_source_and_method_documentation():
    """Verify every record in ledger cites documented boundary source and method."""
    df = pd.read_csv(LEDGER_CSV)

    # Every record must cite the authoritative boundary source
    assert (df["evidence_source"].str.startswith("GADM Level 1 India Administrative Boundaries")).all()
    assert (df["method"].str.contains("point-in-polygon")).all()
    assert (df["reviewer_notes"].str.len() > 10).all()
    assert (df["verification_date"] == "2026-10-13").all()


def test_verification_taxonomy_rigor():
    """Verify statuses strictly partition into the 4 allowed formal categories."""
    df = pd.read_csv(LEDGER_CSV)
    allowed_statuses = {
        "SOURCE_LABEL_CONFIRMED",
        "GEOGRAPHICALLY_VERIFIED",
        "PENDING_GEOGRAPHIC_VERIFICATION",
        "CONFLICTING_SOURCE_METADATA",
    }
    actual_statuses = set(df["verification_status"].unique())
    assert actual_statuses.issubset(allowed_statuses), f"Unexpected status: {actual_statuses - allowed_statuses}"

    counts = df["verification_status"].value_counts().to_dict()
    assert counts["SOURCE_LABEL_CONFIRMED"] == 385
    assert counts["CONFLICTING_SOURCE_METADATA"] == 41
    assert counts["GEOGRAPHICALLY_VERIFIED"] == 14
    assert counts["PENDING_GEOGRAPHIC_VERIFICATION"] == 2


def test_investigation_of_three_border_cases():
    """Verify exact handling and classification of Event 1111, Event 3619, and Event 9215."""
    df = pd.read_csv(LEDGER_CSV)

    # 1. Event 1111: Melli Chalisey
    e1111 = df[df["event_id"] == 1111].iloc[0]
    assert e1111["verification_status"] == "CONFLICTING_SOURCE_METADATA"
    assert e1111["original_administrative_label"] == "Bengal"
    assert e1111["polygon_pip_state"] == "Sikkim"
    assert e1111["inventory_status"] == "EXCLUDED_CORRIDOR_CANDIDATE"

    # 2. Event 3619: Birik / Mangan
    e3619 = df[df["event_id"] == 3619].iloc[0]
    assert e3619["verification_status"] == "CONFLICTING_SOURCE_METADATA"
    assert e3619["original_administrative_label"] == "MISSING_IN_CATALOG"
    assert e3619["polygon_pip_state"] == "Sikkim"
    assert e3619["inventory_status"] == "ACCEPTED_IN_NER_368"

    # 3. Event 9215: NH10 in Rangpo
    e9215 = df[df["event_id"] == 9215].iloc[0]
    assert e9215["verification_status"] == "SOURCE_LABEL_CONFIRMED"
    assert e9215["original_administrative_label"] == "West Bengal"
    assert e9215["polygon_pip_state"] == "West Bengal"
    assert e9215["inventory_status"] == "EXCLUDED_CORRIDOR_CANDIDATE"


def test_uncertain_and_conflicting_records_cannot_silently_verify():
    """Assert that border-proximate and conflicting records retain explicit caution statuses."""
    df = pd.read_csv(LEDGER_CSV)

    # Event 241 and 3943 must remain PENDING_GEOGRAPHIC_VERIFICATION
    pending_records = df[df["verification_status"] == "PENDING_GEOGRAPHIC_VERIFICATION"]
    assert len(pending_records) == 2
    pending_eids = set(pending_records["event_id"].tolist())
    assert pending_eids == {241, 3943}

    # Conflicting metadata records must be flagged
    conflicting = df[df["verification_status"] == "CONFLICTING_SOURCE_METADATA"]
    assert len(conflicting) == 41
    # Both Event 1111 and 3619 must be in conflicting
    assert 1111 in conflicting["event_id"].values
    assert 3619 in conflicting["event_id"].values


def test_recomputed_state_totals_from_data():
    """Verify state totals are calculated dynamically from events data without manifest copying."""
    events_df = pd.read_csv(EVENTS_CSV)
    counts = events_df["normalized_state"].value_counts().to_dict()

    assert counts["Assam"] == 82
    assert counts["Nagaland"] == 78
    assert counts["Manipur"] == 56
    assert counts["Sikkim"] == 48
    assert counts["Arunachal Pradesh"] == 45
    assert counts["Meghalaya"] == 29
    assert counts["Mizoram"] == 27
    assert counts["Tripura"] == 3
    assert sum(counts.values()) == 368


def test_accepted_and_excluded_counts_separation():
    """Verify accepted (368) and excluded (74) counts remain strictly separated with traceable reasons."""
    df = pd.read_csv(LEDGER_CSV)
    accepted = df[df["inventory_status"] == "ACCEPTED_IN_NER_368"]
    excluded = df[df["inventory_status"] == "EXCLUDED_CORRIDOR_CANDIDATE"]

    assert len(accepted) == 368
    assert len(excluded) == 74

    # Excluded records must all have Bengal or West Bengal raw administrative labels
    assert excluded["original_administrative_label"].isin(["Bengal", "West Bengal"]).all()

    # Verify breakdown in accepted inventory
    acc_counts = accepted["verification_status"].value_counts().to_dict()
    assert acc_counts["SOURCE_LABEL_CONFIRMED"] == 313
    assert acc_counts["CONFLICTING_SOURCE_METADATA"] == 39
    assert acc_counts["GEOGRAPHICALLY_VERIFIED"] == 14
    assert acc_counts["PENDING_GEOGRAPHIC_VERIFICATION"] == 2


def test_software_test_distinction_governance():
    """Verify safety governance flags and affirm that passing tests does not imply scientific validation."""
    with open(LOCAL_MANIFEST, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    gov = manifest["governance"]
    assert gov["model_status"] == "DEMO_NOT_VALIDATED"
    assert gov["calibration_status"] == "CALIBRATION_DEFERRED"
    assert gov["output_type"] == "UNCALIBRATED_HAZARD_SCORE"
    assert gov["threshold_status"] == "PENDING_EXPERT_REVIEW"
