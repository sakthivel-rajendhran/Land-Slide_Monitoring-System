# SlopeGuard Phase 12.4 — Geographic Verification and Event Provenance Report

**Date:** 2026-10-13  
**Auditor / Engineering Subsystem:** SlopeGuard AI Data Quality & Governance Subsystem  
**Pipeline Version:** `2.4.0-geographic-verification`  
**Dataset Audit Status:** `PHASE_12_4_GEOGRAPHIC_VERIFICATION_AUDITED`  

---

## Executive Summary

Phase 12.4 was conducted to establish authoritative geographic verification and rigorous provenance tracking for the 368-event Northeast India landslide inventory, resolving ambiguities identified in Phase 12.3. Prior to this phase, 17 records assigned to Sikkim lacked raw administrative labels and were categorized as `PENDING_GEOGRAPHIC_VERIFICATION` due to reliance on bounding-box heuristics.

In Phase 12.4:
1. **Authoritative Administrative Boundary Acquisition:** Acquired official Level 1 administrative boundaries for India (`india_state_boundaries_gadm.geojson`, 21.95 MB, WGS 84 / `EPSG:4326`, SHA-256 verified).
2. **Point-in-Polygon (PIP) Ray-Casting:** Implemented an exact point-in-polygon verification engine across all 442 candidate regional records (368 accepted Northeast records + 74 excluded West Bengal corridor records).
3. **Verification Ledger Created:** Established `ai-service/data/processed/geographic_verification_ledger.csv`, establishing an auditable data ledger with explicit taxonomy (`SOURCE_LABEL_CONFIRMED`, `GEOGRAPHICALLY_VERIFIED`, `PENDING_GEOGRAPHIC_VERIFICATION`, `CONFLICTING_SOURCE_METADATA`).
4. **Investigation of Border Cases:** Thoroughly investigated Event 1111 (Melli / Teesta), Event 3619 (Birik / Mangan), and Event 9215 (Rangpo / NH10).
5. **Rigorous Handling of Uncertainty:** Preserved `PENDING_GEOGRAPHIC_VERIFICATION` for Event 241 and Event 3943 due to significant location uncertainty (10–50 km radius) near the Sikkim–West Bengal border. No assignments were forced.
6. **Reproducible Test Suite:** Implemented `ai-service/tests/test_phase_12_4_geographic_verification.py` (9 targeted tests); all 80 test suite cases pass cleanly across the repository.
7. **Strict Governance Preservation:** Preserved all model and dataset governance tags: `DEMO_NOT_VALIDATED`, `CALIBRATION_DEFERRED`, `UNCALIBRATED_HAZARD_SCORE`, and `PENDING_EXPERT_REVIEW`.

---

## 1. Authoritative Boundary Dataset Provenance

To eliminate reliance on bounding boxes, official administrative polygon data was acquired and inspected.

| Metadata Field | Specification |
|---|---|
| **Dataset Name** | GADM Level 1 India Administrative Boundaries (`ind_admin1`) |
| **Source Authority** | Database of Global Administrative Areas (GADM) v4.1 via official geo-distribution |
| **Licence** | GADM Open Academic and Research Non-Commercial Licence |
| **CRS / Datum** | Geographic Coordinate Reference System WGS 84 (`EPSG:4326`) |
| **File Location** | `ai-service/data/raw/india_state_boundaries_gadm.geojson` |
| **File Size** | 23,018,485 bytes (21.95 MB) |
| **Format** | GeoJSON FeatureCollection (MultiPolygon and Polygon geometries) |
| **Acquisition Date** | 2026-10-13 |
| **SHA-256 Checksum** | `48769e32911313a4e741ebcdfb1359bd73ba7be3123cfad1bd10b3edf6e3d4cb` |

### Coordinate Reference System (CRS) Alignment
The raw NASA Global Landslide Catalog coordinates (`latitude`, `longitude`) are published natively in WGS 84 geographic coordinates. The GADM Level 1 boundary geometries are natively defined in WGS 84 (`EPSG:4326`). Point-in-polygon operations were executed directly in native WGS 84 angular space, eliminating coordinate transformation distortion or re-projection errors.

---

## 2. Point-in-Polygon (PIP) Methodology

Verification was conducted using an exact ray-casting algorithm (even-odd crossing rule) supporting arbitrary Polygon and MultiPolygon geometries with ring holes:

1. **Bounding Box Pre-filtering:** For each state polygon feature, outer envelope bounds were computed for initial pruning.
2. **Ray-Casting Algorithm:** A horizontal ray extending from `(lon, lat)` eastward to positive infinity counts edge intersections across all polygon boundary segments. An odd number of intersections indicates interior placement.
3. **Multi-Part Geometries:** Holes and disjoint multi-polygons were correctly evaluated according to topological winding rules.
4. **Border Proximity Flagging:** Landslide points within a threshold of 0.02 degrees (~2.2 km) of state boundary lines were flagged for specialized border inspection, accounting for NASA catalog positional uncertainty (`location_accuracy` attribute: 1 km, 5 km, 10 km, 25 km, or 50 km).

---

## 3. Investigation of the 17 Geographically Uncertain Records

Prior audit phases identified 17 records in the 368-event inventory where `admin_division_name` in the NASA catalog was `NaN` / missing, yet all 17 were attributed to Sikkim.

### Detailed Audit Results
All 17 records fall geometrically inside the GADM Sikkim state polygon. However, accounting for positional accuracy and geographic border proximity, they are classified into three distinct categories:

1. **Geographically Verified Interior Records (14 events):**
   - **Event IDs:** 3624, 3625, 3626, 3627, 3628, 3631, 3632, 3633, 3634, 3635, 3636, 3637, 3638, 3639.
   - **Characteristics:** Located in interior Sikkim (Gangtok, Singtam, Mangan regions) well away from international or interstate borders (>10 km interior). Description and title references confirm Sikkim locations.
   - **Status Assigned:** `GEOGRAPHICALLY_VERIFIED`.

2. **Border-Proximate Uncertain Records Retained as Pending (2 events):**
   - **Event 241:** Lat: `27.2341`, Lon: `88.5085`. Location accuracy: `50km` (very coarse). Located in the lower Teesta basin near the Sikkim–West Bengal boundary. Because a 50 km uncertainty circle extensively covers Kalimpong and Darjeeling districts in West Bengal, falling inside the polygon border does not prove the actual landslide scar was in Sikkim.
     - **Status Retained:** `PENDING_GEOGRAPHIC_VERIFICATION`.
   - **Event 3943:** Lat: `27.1478`, Lon: `88.4988`. Location accuracy: `10km`. Situated less than 3 km from the southern Sikkim boundary along the Teesta/Melli corridor.
     - **Status Retained:** `PENDING_GEOGRAPHIC_VERIFICATION`.

3. **Conflicting Metadata Record (1 event):**
   - **Event 3619:** Coordinates point to Mangan centroid, but title references Birik (West Bengal). Detailed below.
     - **Status Assigned:** `CONFLICTING_SOURCE_METADATA`.

---

## 4. Deep-Dive Investigation of the Three Border Cases

| Case | Event ID | Raw Coordinates | Raw Admin Label | Title & Location Description | PIP State Result | Positional Accuracy | Audit Finding & Final Classification |
|---|---|---|---|---|---|---|---|
| **Case 1** | **1111** | `(27.1344, 88.4575)` | `Bengal` | *Melli Chalisey, Sikkim* | **Sikkim** | 5 km | **`CONFLICTING_SOURCE_METADATA`**<br>The raw administrative label is `Bengal`, but the title explicitly says *Sikkim*, and coordinates fall ~1.2 km inside Sikkim north of the Teesta bridge. Under the administrative-priority filtering rule, this record was excluded into the 74 corridor candidates. Retained as excluded; requires manual expert survey to determine whether the scar was on the West Bengal or Sikkim side of the Teesta. |
| **Case 2** | **3619** | `(27.4885, 88.4451)` | *None (NaN)* | *Birik (cut off Sikkim)* | **Sikkim** | 25 km | **`CONFLICTING_SOURCE_METADATA`**<br>Coordinates correspond to the regional centroid of Mangan (North Sikkim). However, the catalog title refers to *Birik Dara*, a notorious landslide sector along NH10 in Kalimpong District, West Bengal, which severed road access into Sikkim. Catalog geocoding conflated the destination ("cut off Sikkim") with the landslide origin. Retained in accepted 368 under coordinates, flagged as conflicting metadata. |
| **Case 3** | **9215** | `(27.1758, 88.5294)` | `West Bengal` | *NH10 in Rangpo* | **West Bengal** | 5 km | **`SOURCE_LABEL_CONFIRMED`**<br>The raw administrative label is `West Bengal`. Coordinates place the point south of the Rangpo River border checkpost inside West Bengal. The title reflects highway disruption along the border. Both PIP and source administrative labels agree on West Bengal. Confirmed as properly excluded under corridor filtering. |

---

## 5. Geographic Verification Ledger Summary

The complete ledger was compiled in `ai-service/data/processed/geographic_verification_ledger.csv`, covering all 442 candidate events.

### Verification Status Distribution (Total 442 Candidates)

```
========================================================================
Verification Status                  Accepted (368)  Excluded (74)  Total
========================================================================
SOURCE_LABEL_CONFIRMED                          313             72    385
CONFLICTING_SOURCE_METADATA                      39              2     41
GEOGRAPHICALLY_VERIFIED                          14              0     14
PENDING_GEOGRAPHIC_VERIFICATION                   2              0      2
------------------------------------------------------------------------
TOTAL                                           368             74    442
========================================================================
```

### Explanations of Status Taxonomies:
- **`SOURCE_LABEL_CONFIRMED` (385 records):** Both the raw catalog administrative division and the authoritative polygon PIP check agree on the administrative assignment.
- **`CONFLICTING_SOURCE_METADATA` (41 records):** The raw administrative label, title text, or coordinate polygon contradict one another (e.g., catalog label says Assam but coordinates fall slightly across Meghalaya border due to centroid approximations, or vice versa).
- **`GEOGRAPHICALLY_VERIFIED` (14 records):** Records with missing catalog administrative divisions whose coordinates firmly fall into interior state polygons without border ambiguity.
- **`PENDING_GEOGRAPHIC_VERIFICATION` (2 records):** Records with missing administrative divisions located close to state borders with large location accuracy circles (10–50 km), where spatial ambiguity cannot be resolved without field reports.

---

## 6. Recomputed State Counts and Regional Inventory

State totals were computed dynamically from data records:

| State | Accepted Count | Verification Breakdown |
|---|---|---|
| **Assam** | 82 | 76 Source Confirmed, 6 Conflicting Metadata |
| **Nagaland** | 78 | 70 Source Confirmed, 8 Conflicting Metadata |
| **Manipur** | 56 | 54 Source Confirmed, 2 Conflicting Metadata |
| **Sikkim** | 48 | 31 Source Confirmed, 14 Geographically Verified, 2 Pending Verification, 1 Conflicting Metadata |
| **Arunachal Pradesh** | 45 | 37 Source Confirmed, 8 Conflicting Metadata |
| **Meghalaya** | 29 | 19 Source Confirmed, 10 Conflicting Metadata |
| **Mizoram** | 27 | 23 Source Confirmed, 4 Conflicting Metadata |
| **Tripura** | 3 | 3 Source Confirmed |
| **Total Accepted NER** | **368** | **313 Confirmed, 14 Verified, 2 Pending, 39 Conflicting** |
| **Excluded West Bengal** | **74** | **72 Confirmed, 2 Conflicting** |
| **Total Inventory Pool** | **442** | **385 Confirmed, 14 Verified, 2 Pending, 41 Conflicting** |

---

## 7. Automated Test Suite Execution

A dedicated test suite `ai-service/tests/test_phase_12_4_geographic_verification.py` was authored and executed alongside all repository tests.

```text
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\sakth\OneDrive\Desktop\SlopeGuard
plugins: anyio-4.13.0
collected 80 items

ai-service\tests\test_api.py ......                                      [  7%]
ai-service\tests\test_api_governance.py ...                              [ 11%]
ai-service\tests\test_calibration_and_thresholds.py .....                [ 17%]
ai-service\tests\test_data_acquisition_pipeline.py ...........           [ 31%]
ai-service\tests\test_data_validation.py ......                          [ 38%]
ai-service\tests\test_historical_and_calibration.py ..                   [ 41%]
ai-service\tests\test_historical_readiness.py ......                     [ 48%]
ai-service\tests\test_leakage_and_evaluation.py ....                     [ 53%]
ai-service\tests\test_phase_12_1_audit.py ......                         [ 61%]
ai-service\tests\test_phase_12_2_reconciliation.py .......               [ 70%]
ai-service\tests\test_phase_12_3_independent_verification.py .........   [ 81%]
ai-service\tests\test_phase_12_4_geographic_verification.py .........    [ 92%]
ai-service\tests\test_predictor.py ...                                   [ 96%]
ai-service\tests\test_training_pipeline.py ...                           [100%]

============================= 80 passed in 6.58s ==============================
```

All 9 new tests in `test_phase_12_4_geographic_verification.py` passed:
1. `test_verification_ledger_coverage_and_schema`: Confirms ledger exists and covers 442 records.
2. `test_raw_catalog_fields_preserved`: Confirms raw NASA catalog coordinates and admin fields remain unmutated.
3. `test_evidence_source_and_method_documentation`: Confirms all rows cite GADM Level 1 boundaries and PIP method.
4. `test_verification_taxonomy_rigor`: Validates adherence to the 4 formal taxonomy categories.
5. `test_investigation_of_three_border_cases`: Confirms exact handling for Event 1111, 3619, and 9215.
6. `test_uncertain_and_conflicting_records_cannot_silently_verify`: Confirms events 241 and 3943 remain `PENDING_GEOGRAPHIC_VERIFICATION`.
7. `test_recomputed_state_totals_from_data`: Confirms 8-state counts computed from data, matching 368 total.
8. `test_accepted_and_excluded_counts_separation`: Confirms 368 accepted vs 74 excluded separation.
9. `test_software_test_distinction_governance`: Asserts mandatory governance tags.

---

## 8. Separation of Automated Checks from Scientific Validation

Passing automated tests confirms internal software consistency, referential integrity, and algorithmic point-in-polygon placement. **It does not constitute empirical geological ground-truth validation.**
- NASA Global Landslide Catalog coordinates often represent municipal or district centroids, news reporting locations, or road corridor markers rather than physical landslide crowns or scarp centers.
- A point falling inside an administrative polygon confirms geometric intersection with the provided coordinates, but does not validate the geographic accuracy of the catalog geocoder itself.
- Geological and operational validity requires manual field survey, satellite imagery photogrammetry (e.g., Sentinel-2 / PlanetScope pre- and post-event rupture mapping), and Geological Survey of India (GSI) validation.

---

## 9. AI Governance Flags Preserved

The following governance tags remain permanently active across all manifests and API configurations:
- `DEMO_NOT_VALIDATED`
- `CALIBRATION_DEFERRED`
- `UNCALIBRATED_HAZARD_SCORE`
- `PENDING_EXPERT_REVIEW`
