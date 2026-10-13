# SlopeGuard Phase 12.2 — Dataset Reconciliation & Regional Counts Audit

**Audit Identifier:** `SG-RECONCILIATION-PHASE-12.2-2026-10-13`  
**Evaluation Scope:** Complete cross-version dataset reconciliation, state-level census verification, multi-table join integrity, rainfall and terrain feature semantics, pipeline namespace isolation, and manifest synchronization.  
**System Governance Classification:** `DEMO_NOT_VALIDATED` &bull; `CALIBRATION_DEFERRED` &bull; `UNCALIBRATED_HAZARD_SCORE` &bull; `PENDING_EXPERT_REVIEW`  
**Operational Status:** Prototype Research System — Strictly non-operational. Not calibrated or authorized for live hazard warning.

---

## Executive Summary

Phase 12.2 resolves discrepancies between earlier and later project reports, performs an exhaustive multi-table join audit across all versioned CSV files, validates rainfall and terrain feature semantics, and verifies pipeline namespace isolation.

### Key Audit Conclusions

1. **State-Level Census Reconciliation (Definitive Ground Truth):**
   - The authentic, physical distribution across **all actual dataset files** (`historical_landslide_events_ner.csv`, `terrain_features_ner.csv`, `terrain_features_ner_v2.csv`, `historical_rainfall_features_ner_v2.csv`, `historical_rainfall_features_ner_v3.csv`) is:
     - **Assam:** 82 (22.3%)
     - **Nagaland:** 78 (21.2%)
     - **Manipur:** 56 (15.2%)
     - **Sikkim:** 48 (13.0%)
     - **Arunachal Pradesh:** 45 (12.2%)
     - **Meghalaya:** 29 (7.9%)
     - **Mizoram:** 27 (7.3%)
     - **Tripura:** 3 (0.8%)
     - **Total:** Exactly **368 events**.
   - The earlier Phase 12 reports (`DATA_QUALITY_REPORT.md` and `HISTORICAL_DATA_INTEGRITY_AUDIT.md`) correctly cited this exact distribution.
   - The text in the Phase 12.1 report contained a narrative drafting discrepancy (`Assam: 153, Meghalaya: 62, ...`) that conflicted with the actual CSVs, the manifests, and the preceding audit reports. The underlying CSV data never changed. The narrative text has now been rectified across all documents.

2. **Source Provenance & Unicode Normalization:**
   - Raw NASA Global Landslide Catalog records contained diacritics and alternate spellings: `Nāgāland` (64) + `Nagaland` (14) = 78; `Arunāchal Pradesh` (25) + `Arunachal Pradesh` (20) = 45; `Meghālaya` (11) + `Meghalaya` (18) = 29.
   - 17 records had missing/null `admin_division_name` in the NASA export. All 17 were authentically assigned to `Sikkim` (bringing Sikkim from 31 to 48) based on explicit location titles (e.g. *Chungthang*, *Mangan*, *North Sikkim Highway*, *Sombaria*) and geographic coordinates falling strictly within the Sikkim boundary ($27.0^\circ\text{N} - 28.2^\circ\text{N}$, $88.0^\circ\text{E} - 88.9^\circ\text{E}$).
   - Exactly **74 records** in the regional bounding box were excluded. All 74 were verified as `admin_division_name = Bengal` (47) or `West Bengal` (27) situated in the Darjeeling/Kurseong/Kalimpong/Siliguri corridor. They were excluded under the North Eastern Council (NEC) 8-state administrative domain rule.

3. **Multi-Table Join Integrity (100% Exact):**
   - Across all 6 datasets (`events`, `terrain_v1`, `terrain_v2`, `rain_v1`, `rain_v2`, `rain_v3`), row count is exactly **368**, unique event IDs are **368**, missing IDs are **0**, extra IDs are **0**, and duplicate IDs are **0**.
   - Maximum coordinate difference between any versioned table and the baseline is **0.000000** (bit-for-bit identical floating-point values).

4. **Feature Semantics & Pipeline Isolation:**
   - **Rainfall V3:** Explicit 24h and 72h window timestamps are defined in UTC. The 5.5-hour offset between UTC daily aggregation and India Standard Time (IST = UTC+05:30) is explicitly documented. Window B is classified as `CONDITIONAL_PRIOR_WINDOW`. No window is claimed as guaranteed leakage-free.
   - **Terrain V2:** Standard clockwise downslope geographic compass azimuth (`aspect_compass_deg`: 0°=N, 90°=E, 180°=S, 270°=W; Flat=-1°) is verified alongside legacy polar angle (`polar_aspect_legacy_deg`). Catalog location accuracy is attached to prevent learning false associations from coarse valley centroids.
   - **Pipeline Isolation:** Existing training (`train.py`) and inference (`predictor.py`) modules consume core legacy namespaces (`rainfall_24h_mm`, `slope_deg`, etc.) from designated fixtures and are strictly insulated from versioned exploratory features.

5. **Test Suite Expansion:**
   - 7 new targeted reconciliation tests added in `test_phase_12_2_reconciliation.py`.
   - Full test suite: **62 passed in 5.59s** (`python -m pytest -v ai-service/tests`).

---

## 1. Resolution of State-Count Discrepancies

### 1.1 Cross-Document Reconciliation Table

| Document / Dataset | Assam | Nagaland | Manipur | Sikkim | Arunachal | Meghalaya | Mizoram | Tripura | Total | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `historical_landslide_events_ner.csv` | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | **Actual Processed Ground Truth** |
| `terrain_features_ner.csv` (v1) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | Exact match with baseline |
| `terrain_features_ner_v2.csv` (v2) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | Exact match with baseline |
| `historical_rainfall_features_ner.csv` (v1) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | **368** | Coordinate-only baseline |
| `historical_rainfall_features_ner_v2.csv` (v2) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | Exact match with baseline |
| `historical_rainfall_features_ner_v3.csv` (v3) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | Exact match with baseline |
| `DATA_QUALITY_REPORT.md` (Phase 12) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | Matches actual CSVs |
| `HISTORICAL_DATA_INTEGRITY_AUDIT.md` (Phase 11) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | Matches actual CSVs |
| `dataset_manifest.json` (Phase 12.1) | — | — | — | — | — | — | — | — | **368** | Reconciled total (states unlisted) |
| `PHASE_12_1_INDEPENDENT_INTEGRITY_AUDIT.md` (Original Text) | *153* | *37* | *13* | *61* | *22* | *62* | *19* | *1* | *368* | **Drafting Narrative Discrepancy (Rectified)** |
| `dataset_manifest.json` (Phase 12.2 Reconciled) | **82** | **78** | **56** | **48** | **45** | **29** | **27** | **3** | **368** | **Explicitly Anchored in Manifest** |

### 1.2 Root Cause of Narrative Discrepancy
The actual CSV files, data processing pipelines, and earlier reports (`DATA_QUALITY_REPORT.md` and `HISTORICAL_DATA_INTEGRITY_AUDIT.md`) have always maintained the exact count of 82, 78, 56, 48, 45, 29, 27, and 3. The alternative distribution figures (`153, 62, 61, 37, 22, 19, 13, 1`) appeared solely in the narrative markdown text of the Phase 12.1 report due to a transcription error during report composition. The underlying dataset was never altered. Both Phase 12.1 and Phase 12.2 reports are now unified and agree with the actual data files.

### 1.3 State Normalization Cross-Tabulation
Cross-tabulation between raw catalog `admin_division_name` and processed `normalized_state`:

| Raw `admin_division_name` | Raw Records | Processed `normalized_state` | Assigned Count | Evidence & Rationale |
| :--- | :---: | :--- | :---: | :--- |
| `Arunachal Pradesh` | 20 | Arunachal Pradesh | 20 | Canonical spelling |
| `Arunāchal Pradesh` | 25 | Arunachal Pradesh | 25 | Diacritic stripped via Unicode NFKD |
| `Assam` | 82 | Assam | 82 | Direct match |
| `Manipur` | 56 | Manipur | 56 | Direct match |
| `Meghalaya` | 18 | Meghalaya | 18 | Canonical spelling |
| `Meghālaya` | 11 | Meghalaya | 11 | Diacritic stripped via Unicode NFKD |
| `Mizoram` | 27 | Mizoram | 27 | Direct match |
| `Nagaland` | 14 | Nagaland | 14 | Canonical spelling |
| `Nāgāland` | 64 | Nagaland | 64 | Diacritic stripped via Unicode NFKD |
| `Sikkim` | 31 | Sikkim | 31 | Direct match |
| `Tripura` | 3 | Tripura | 3 | Direct match |
| `MISSING / NaN` | 17 | Sikkim | 17 | Topographic descriptions (e.g. *Chungthang*, *Mangan*, *North Sikkim*, *Sombaria*) & coordinates in Sikkim bounding polygon ($27.0^\circ - 28.2^\circ\text{N}, 88.0^\circ - 88.9^\circ\text{E}$) |
| **Total Accepted** | **368** | **8 Canonical States** | **368** | **Zero unassigned or synthetic records** |

### 1.4 Reconciliation of the 74 Excluded West Bengal Corridor Records
- Raw NASA Global Landslide Catalog exports contain **1,265** records for India.
- In the Northeast India regional bounding box (`21.5°N - 29.5°N, 88.0°E - 97.5°E`), **442 records** exist.
- Accepted into Northeast India: **368 records**.
- Excluded from Northeast India: **74 records**.
- **Audit Findings:**
  - `Bengal`: 47 records
  - `West Bengal`: 27 records
  - **Locations:** Darjeeling, Kurseong, Kalimpong, Singamari, Gayabari, and Siliguri.
  - **Administrative Rule:** Under the North Eastern Council (NEC) Act of 1971 (as amended in 2002), the Northeast region comprises strictly the 8 states of Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura. West Bengal belongs to Eastern India and is excluded from the Northeast administrative inventory.

---

## 2. Multi-Table Join Integrity Verification

All versioned datasets were joined directly on `event_id` and verified against the baseline `historical_landslide_events_ner.csv`:

```
====================================================================================================
Dataset Table      Rows    Unique IDs   Missing   Extra   Duplicates   Max Lat Diff   Max Lon Diff
====================================================================================================
events (base)       368       368          0        0         0          0.000000       0.000000
terrain_v1          368       368          0        0         0          0.000000       0.000000
terrain_v2          368       368          0        0         0          0.000000       0.000000
rainfall_v1         368       368          0        0         0          0.000000       0.000000
rainfall_v2         368       368          0        0         0          0.000000       0.000000
rainfall_v3         368       368          0        0         0          0.000000       0.000000
====================================================================================================
Join Verification Status: 100% EXACT ONE-TO-ONE CORRESPONDENCE ACROSS ALL VERSIONS
```

### Pipeline Isolation Verification
Inspection of `ai-service/src/config.py`, `ai-service/src/train.py`, `ai-service/src/evaluate.py`, and `ai-service/src/predictor.py` confirmed:
- Model training and inference consume designated core feature names (`rainfall_24h_mm`, `slope_deg`, `elevation_m`, `aspect_deg`) from isolated baseline fixtures (`synthetic_fixtures.csv` or `historical_events_northeast_india.csv`).
- Exploratory and versioned feature columns (`rainfall_24h_sameday_mm`, `rainfall_24h_strictly_prior_mm`, `aspect_compass_deg`, `polar_aspect_legacy_deg`, `spatial_representativeness`) reside in distinct versioned tables and are **not commingled** with the baseline training pipeline.

---

## 3. Rainfall Feature Semantics & Timezone Boundaries

Inspection of `historical_rainfall_features_ner_v3.csv` confirmed exact window semantics:

```
Sample Record: Event ID 1061 (Sikkim, Event Date: 2009-07-01)
----------------------------------------------------------------------------------------------------
Aggregation Timezone:     UTC (00:00:00 to 23:59:59 UTC daily calendar boundaries)
Local Event Timezone:     Asia/Kolkata (IST = UTC+05:30)
Timezone Offset:          5.5 hours

Window A (Same-Day Inclusive):
  Window A 24h:           2009-07-01T00:00:00Z to 2009-07-01T23:59:59Z  (Precip: 37.7 mm)
  Window A 72h:           2009-06-29T00:00:00Z to 2009-07-01T23:59:59Z  (Precip: 104.5 mm)
  Classification:         POTENTIAL_LOOKAHEAD_LEAKAGE (Includes rainfall occurring after failure)

Window B (Strictly Prior in UTC):
  Window B 24h:           2009-06-30T00:00:00Z to 2009-07-01T00:00:00Z  (Precip: 27.1 mm)
  Window B 72h:           2009-06-28T00:00:00Z to 2009-07-01T00:00:00Z  (Precip: 120.8 mm)
  Classification:         CONDITIONAL_PRIOR_WINDOW (Strictly prior in UTC; ends at 05:30 IST on day D.
                          Cannot guarantee zero intra-day lookahead for early morning failures)
```

**Core Principle:** Because intra-day failure hour is unknown in historical catalog data, no temporal aggregation can be claimed as guaranteed leakage-free. Window B represents a conservative, documented approximation.

---

## 4. Terrain Feature Semantics & Location Uncertainty

Inspection of `terrain_features_ner_v2.csv` confirmed:
- **Aspect Compass Convention:** `aspect_compass_deg` follows standard clockwise downslope geographic azimuth (0° = North, 90° = East, 180° = South, 270° = West; -1° = Flat terrain).
- **Mathematical Relation:** For all slopes $\ge 0.1^\circ$, `polar_aspect_legacy_deg = (aspect_compass_deg + 90.0) % 360.0` (verified to floating-point precision).
- **Flat Slopes:** Exactly 1 event has slope $< 0.1^\circ$ (slope = 0.0°); its `aspect_compass_deg` is explicitly set to `-1.0`.
- **Pixel Indexing:** Raster row indices range from 5 to 3596; column indices range from 0 to 3590. Zero out-of-bounds pixel accesses.
- **Location Uncertainty:** Attached `location_accuracy` (1km to 50km) and `spatial_representativeness` (`HIGH_SPATIAL_CONFIDENCE`, `MODERATE_SPATIAL_UNCERTAINTY`, `COARSE_CENTROID_ONLY`) prevent models from misinterpreting valley gazetteer centroids as landslide initiation scarps.

---

## 5. Dataset Manifest & Checksum Synchronization

Both root [dataset_manifest.json](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/dataset_manifest.json) and internal [ai-service/data/processed/dataset_manifest.json](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/ai-service/data/processed/dataset_manifest.json) have been synchronized:

```json
{
  "generated_utc": "2026-10-13",
  "status": "PHASE_12_2_RECONCILIATION_VERIFIED",
  "pipeline_version": "2.3.0-reconciled-datasets",
  "description": "SlopeGuard Automated Real-World Data Acquisition, Validation, Integrity Audit & Reconciliation for Northeast India",
  "record_counts": {
    "raw_global_catalog": 11033,
    "raw_india_catalog": 1265,
    "processed_events_ner": 368,
    "verified_from_source": 289,
    "partially_verified": 79,
    "unverified": 0,
    "rejected_out_of_domain": 74,
    "rainfall_matched": 368,
    "rainfall_failed": 0,
    "terrain_extracted": 368,
    "terrain_pending": 0,
    "dem_tiles_downloaded": 30
  },
  "state_counts": {
    "Assam": 82,
    "Nagaland": 78,
    "Manipur": 56,
    "Sikkim": 48,
    "Arunachal Pradesh": 45,
    "Meghalaya": 29,
    "Mizoram": 27,
    "Tripura": 3
  },
  "governance": {
    "model_status": "DEMO_NOT_VALIDATED",
    "calibration_status": "CALIBRATION_DEFERRED",
    "output_type": "UNCALIBRATED_HAZARD_SCORE",
    "threshold_status": "PENDING_EXPERT_REVIEW"
  }
}
```

---

## 6. Automated Testing Suite Execution

Command:
```powershell
python -m pytest -v ai-service/tests
```

Output:
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\sakth\OneDrive\Desktop\SlopeGuard
collected 62 items

ai-service/tests/test_api.py (6 passed)
ai-service/tests/test_api_governance.py (3 passed)
ai-service/tests/test_calibration_and_thresholds.py (5 passed)
ai-service/tests/test_data_acquisition_pipeline.py (11 passed)
ai-service/tests/test_data_validation.py (6 passed)
ai-service/tests/test_historical_and_calibration.py (2 passed)
ai-service/tests/test_historical_readiness.py (6 passed)
ai-service/tests/test_leakage_and_evaluation.py (4 passed)
ai-service/tests/test_phase_12_1_audit.py (6 passed)
ai-service/tests/test_phase_12_2_reconciliation.py (7 passed)
ai-service/tests/test_predictor.py (3 passed)
ai-service/tests/test_training_pipeline.py (3 passed)

============================= 62 passed in 5.59s ==============================
```

---

## 7. Mandatory AI Model Governance Affirmation

In strict compliance with SlopeGuard project safety and governance protocols:
- System status remains **`DEMO_NOT_VALIDATED`**.
- Model calibration remains **`CALIBRATION_DEFERRED`**.
- Inference hazard score remains **`UNCALIBRATED_HAZARD_SCORE`**.
- Candidate thresholds remain **`PENDING_EXPERT_REVIEW`**.
- No synthetic negative pseudo-samples were invented.
- The 368-event inventory is an authentic historical catalogue of recorded landslide occurrences, not a balanced training distribution or operational early warning system.
