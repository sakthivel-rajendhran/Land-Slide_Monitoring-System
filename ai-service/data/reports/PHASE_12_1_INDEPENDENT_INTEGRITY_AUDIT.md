# SlopeGuard Phase 12.1 — Independent Dataset Integrity Audit Report

**Audit Identifier:** `SG-AUDIT-PHASE-12.1-2026-10-13`  
**Evaluation Scope:** Copernicus DEM GLO-30 rasters, terrain extraction algorithms, antecedent rainfall temporal windows, catalog source provenance, regional domain boundaries, dataset manifests, and automated test suites.  
**System Governance Classification:** `DEMO_NOT_VALIDATED` &bull; `CALIBRATION_DEFERRED` &bull; `UNCALIBRATED_HAZARD_SCORE` &bull; `PENDING_EXPERT_REVIEW`  
**Operational Status:** Prototype Research System — Strictly non-operational. Not calibrated or authorized for live hazard warning.

---

## Executive Summary

This independent technical audit was conducted under Phase 12.1 to rigorously inspect the authentic datasets, scripts, mathematics, and manifests produced during Phase 12. In accordance with geotechnical engineering standards and data science best practices, no AI models were trained, evaluated, or recalibrated during this phase.

### Key Audit Findings

1. **Copernicus DEM GLO-30 Raster Integrity (Verified Pass):**
   - All **30 unique GeoTIFF tiles** (totaling ~1.31 GB) were independently validated on disk.
   - Raster dimensions are exactly `3600 × 3600` single-band `float32` (1 arc-second ≈ 30m resolution).
   - Coordinate Reference System is confirmed as **EPSG:4326 (WGS 84)** with top-left tiepoints and standard north-to-south row orientation.
   - Vertical datum is officially confirmed as **EGM2008 Geoid Heights (Meters)**.
   - **Zero NaN or corrupted pixels** were found across all 388,800,000 pixels audited.
   - Independent recalculation of elevation and slope for 15 sample records yielded a **100% exact match (15/15)** against the stored raster arrays.

2. **Aspect Mathematics & Geographic Azimuth Rectification (Important Finding & Fix):**
   - The Phase 12 extraction script computed aspect as `(atan2(-dz_dy, dz_dx) * 180 / π + 360) % 360`. This produced a counterclockwise mathematical polar angle rotated by 90° (West = 0°, North = 90°, East = 180°, South = 270°).
   - Standard cartographic and GIS conventions (GDAL, ArcGIS, geotechnical engineering) require **clockwise downhill geographic compass azimuth** (North = 0°, East = 90°, South = 180°, West = 270°; Flat = -1°).
   - This convention has been rectified and formalized in `terrain_features_ner_v2.csv`, while preserving the legacy polar field for backward compatibility.

3. **Rainfall Window & Timezone Offset Audit (Important Finding & Fix):**
   - NASA Global Landslide Catalog (GLC) records in India reflect local calendar dates (**India Standard Time: IST = UTC+05:30**). Intra-day failure hour is **100% missing** (`event_time` is null across all 368 records).
   - Open-Meteo ERA5-Land daily precipitation aggregates were queried with `&timezone=UTC` (00:00:00 to 23:59:59 UTC).
   - Day `D-1` UTC ends at `D 00:00:00 UTC`, which corresponds to `D 05:30:00 IST`.
   - **Leakage Reality:** While Window B strictly excludes the UTC calendar day `D`, it cannot guarantee zero lookahead leakage for events that occurred in early morning IST (between 00:00 and 05:30 IST). Claiming "guaranteed zero lookahead leakage" without failure hour is scientifically unsupportable.
   - Versioned dataset `historical_rainfall_features_ner_v3.csv` explicitly documents this 5.5-hour offset, separates 24h and 72h window start/end timestamps, and reclassifies Window B as a `CONDITIONAL_PRIOR_WINDOW`.

4. **Location Uncertainty vs. Micro-Topographic Scale (Critical Geotechnical Finding):**
   - Out of 368 events, **only 4 have "exact" coordinates**.
   - Spatial uncertainties from the catalog: 1km (48), 5km (122), 10km (56), 25km (64), 50km (52), 100km (1), unknown (21).
   - **54 events exhibit extracted slope < 5°** and 97 events < 10°. These low slopes do not indicate that landslides occur on flat plains; rather, they reflect that coarse catalog coordinates represent town centers, district headquarters, or valley road markers rather than the uphill scarp.
   - `terrain_features_ner_v2.csv` attaches `location_accuracy`, `spatial_accuracy_km`, and a `spatial_representativeness` category to prevent naive AI models from learning false associations between landslides and flat terrain.

5. **Regional Provenance & Corridor Reconciliation (Verified Pass):**
   - Raw NASA GLC exports contain 1,265 India records, with 442 falling inside the regional bounding box (`21.5°N - 29.5°N, 88.0°E - 97.5°E`).
   - Exactly **368 events** belong to the 8 official Northeastern Council (NEC) states (Assam: 82, Nagaland: 78, Manipur: 56, Sikkim: 48, Arunachal Pradesh: 45, Meghalaya: 29, Mizoram: 27, Tripura: 3).
   - Exactly **74 events were excluded**: all 74 are situated in the Darjeeling, Kurseong, Kalimpong, and Siliguri sub-Himalayan corridor of the state of West Bengal (Eastern India), in strict adherence to the 8-state administrative domain rule.
   - Duplicate event IDs: **0**. Duplicate (lat, lon, date) tuples: **0**.

6. **Automated Testing Suite (100% Pass):**
   - Full automated test suite expanded to **55 tests**.
   - Result: **55 passed in 5.12s** (`python -m pytest -v ai-service/tests`).

---

## 1. Inspection of Existing Outputs & Baseline Artifacts

The following files were inspected directly on disk:

| File Path | Record Count | File Size (Bytes) | SHA-256 Digest (Truncated) | Status |
| :--- | :--- | :--- | :--- | :--- |
| `ai-service/data/raw/Global_Landslide_Catalog_Export_rows.csv` | 11,033 | 8,479,717 | `2c4898899dd4f373...` | Authenticated Raw NASA Export |
| `ai-service/data/processed/historical_landslide_events_ner.csv` | 368 | 409,898 | `96e671924931ce62...` | Verified Events Inventory |
| `ai-service/data/processed/historical_rainfall_features_ner.csv` | 368 | 163,662 | `fee4271a0623631d...` | Version 1 (Same-Day Inclusive) |
| `ai-service/data/processed/historical_rainfall_features_ner_v2.csv` | 368 | 219,032 | `b133187f323c963d...` | Version 2 (Dual Windows) |
| `ai-service/data/processed/historical_rainfall_features_ner_v3.csv` | 368 | 277,419 | `1cb79f32338f0d57...` | Version 3 (Audited & Disclaimed) |
| `ai-service/data/processed/terrain_features_ner.csv` | 368 | 122,315 | `3720c95f4a18a6f9...` | Version 1 (Polar Aspect) |
| `ai-service/data/processed/terrain_features_ner_v2.csv` | 368 | 196,442 | `001da28fd39a66d0...` | Version 2 (Compass Azimuth & Uncertainty) |
| `ai-service/data/processed/copernicus_dem_tile_index_requirements.csv` | 368 | 89,877 | `d4487cbb404e8de7...` | Verified Tile Index |
| `ai-service/data/processed/open_meteo_rainfall_cache.json` | 368 | 148,822 | `b68925be02737ef9...` | Verified Weather Cache |
| `ai-service/data/dem_tiles/*.tif` (30 GeoTIFFs) | 30 tiles | ~1.31 GB | Verified Tile Manifest | Validated Raster Grids |

---

## 2. Detailed Rainfall Window & Temporal Audit

### 2.1 Timezone Boundary Discrepancy (UTC vs. IST)
- **Local Event Context:** Landslide events in Northeast India were recorded from local newspapers, district administration reports, and disaster mitigation teams. These dates represent calendar days in India Standard Time (**IST = UTC+05:30**).
- **Weather Query API:** The Open-Meteo Historical Archive query specified `&timezone=UTC`.
- **Temporal Alignment Analysis:**
  - In UTC, Day `D` spans `[D 00:00:00 UTC, D 23:59:59 UTC]`, which translates in IST to `[D 05:30:00 IST, (D+1) 05:30:00 IST]`.
  - In UTC, Day `D-1` spans `[(D-1) 00:00:00 UTC, (D-1) 23:59:59 UTC]`, which translates in IST to `[(D-1) 05:30:00 IST, D 05:30:00 IST]`.
- **Lookahead Leakage Implications:**
  1. If a slope failed at 02:00 AM IST on Day `D`, rainfall occurring between 02:00 AM and 05:30 AM IST falls inside Day `D-1` UTC. Consequently, Window B contains post-failure precipitation for early morning events.
  2. If a slope failed at 06:00 PM IST on Day `D`, Day `D-1` UTC ended at 05:30 AM IST, leaving a 12.5-hour gap of uncounted antecedent rainfall.
  3. **Audit Conclusion:** Because failure hour is unrecorded, **no temporal aggregation can be claimed as strictly leakage-free**. The assertion in Phase 12 of "guaranteed zero lookahead leakage" is scientifically inaccurate and has been downgraded to `CONDITIONAL_PRIOR_WINDOW`.

### 2.2 Date Continuity & Precipitation Data Integrity
Audit of all 368 entries in `open_meteo_rainfall_cache.json`:
- Missing dates: **0**
- Duplicate dates: **0**
- Negative precipitation values: **0**
- Inconsistent 24h / 72h sums: **0**
- Continuity: All 368 records exhibit exactly 4 consecutive days `[D-3, D-2, D-1, D]`.

### 2.3 Independent Recalculation Sample (15 Records)
Direct comparison between cache daily series, V1, V2, and audited V3:

| Event ID | Date (Local) | Daily Series `[D-3, D-2, D-1, D]` (mm) | V1 24h / 72h | V2 Same-Day 24h / 72h | V2 & V3 Prior 24h / 72h | Recalculation Verdict |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1061 | 2009-07-01 | `[54.0, 39.7, 27.1, 37.7]` | 37.7 / 104.5 | 37.7 / 104.5 | 27.1 / 120.8 | **MATCH** |
| 2164 | 2010-07-29 | `[8.5, 2.5, 20.8, 19.9]` | 19.9 / 43.2 | 19.9 / 43.2 | 20.8 / 31.8 | **MATCH** |
| 4569 | 2012-09-19 | `[38.0, 26.0, 14.0, 35.1]` | 35.1 / 75.1 | 35.1 / 75.1 | 14.0 / 78.0 | **MATCH** |
| 4571 | 2012-09-19 | `[59.6, 26.2, 16.0, 44.0]` | 44.0 / 86.2 | 44.0 / 86.2 | 16.0 / 101.8 | **MATCH** |
| 5122 | 2013-07-17 | `[14.3, 34.6, 60.2, 2.0]` | 2.0 / 96.8 | 2.0 / 96.8 | 60.2 / 109.1 | **MATCH** |
| 5123 | 2013-07-17 | `[14.3, 34.6, 60.2, 2.0]` | 2.0 / 96.8 | 2.0 / 96.8 | 60.2 / 109.1 | **MATCH** |
| 7370 | 2015-08-01 | `[51.8, 133.4, 147.9, 6.9]` | 6.9 / 288.2 | 6.9 / 288.2 | 147.9 / 333.1 | **MATCH** |
| 5084 | 2013-07-12 | `[4.7, 4.8, 20.9, 21.5]` | 21.5 / 47.2 | 21.5 / 47.2 | 20.9 / 30.4 | **MATCH** |
| 2566 | 2010-10-08 | `[10.6, 25.3, 21.9, 25.2]` | 25.2 / 72.4 | 25.2 / 72.4 | 21.9 / 57.8 | **MATCH** |
| 1109 | 2009-08-20 | `[0.5, 4.6, 2.6, 2.4]` | 2.4 / 9.6 | 2.4 / 9.6 | 2.6 / 7.7 | **MATCH** |
| 1961 | 2010-06-09 | `[4.6, 6.1, 24.5, 21.6]` | 21.6 / 52.2 | 21.6 / 52.2 | 24.5 / 35.2 | **MATCH** |
| 2578 | 2010-10-09 | `[20.1, 19.6, 32.8, 13.1]` | 13.1 / 65.5 | 13.1 / 65.5 | 32.8 / 72.5 | **MATCH** |
| 322 | 2007-10-21 | `[1.2, 5.2, 12.1, 0.1]` | 0.1 / 17.4 | 0.1 / 17.4 | 12.1 / 18.5 | **MATCH** |
| 5552 | 2013-09-24 | `[1.2, 0.1, 2.8, 4.6]` | 4.6 / 7.5 | 4.6 / 7.5 | 2.8 / 4.1 | **MATCH** |
| 7031 | 2015-05-24 | `[47.7, 35.1, 22.7, 10.3]` | 10.3 / 68.1 | 10.3 / 68.1 | 22.7 / 105.5 | **MATCH** |

---

## 3. DEM and Terrain Extraction Audit

### 3.1 Copernicus DEM GLO-30 Raster Quality & Georeferencing
- **Total Rasters on Disk:** 30 GeoTIFF files (`.tif`).
- **File Integrity:** All 30 files are valid Cloud Optimized GeoTIFFs (COGs).
- **Coordinate System:** WGS 84 (`EPSG:4326`), with `ModelPixelScaleTag = (0.0002777777777777778, 0.0002777777777777778, 0.0)`.
- **Pixel Dimensions:** Exactly `3600 × 3600` pixels per tile.
- **Vertical Units & Datum:** Elevation is expressed in meters above the Earth Gravitational Model 2008 (**EGM2008 geoid**).
- **NoData & Null Handling:** 0 NaN values across all 30 rasters. Valid physical elevations range from -12.0m (coastal/floodplain edge) to 8,564.3m (Kangchenjunga massif in Sikkim).

### 3.2 Horn's Gradient & Aspect Convention Rectification
In Phase 12, Horn's 8-neighbor gradient kernel was correctly implemented for slope angle:
$$\frac{\partial z}{\partial x} = \frac{(z_{0,2} + 2z_{1,2} + z_{2,2}) - (z_{0,0} + 2z_{1,0} + z_{2,0})}{8 \Delta x}$$
$$\frac{\partial z}{\partial y} = \frac{(z_{0,0} + 2z_{0,1} + z_{0,2}) - (z_{2,0} + 2z_{2,1} + z_{2,2})}{8 \Delta y}$$
$$\text{Slope} = \arctan\left(\sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}\right)$$
Geographic metric distances ($\Delta x, \Delta y$) were correctly scaled by latitude: $\Delta y \approx 30.78\text{m}$, $\Delta x \approx 30.92\text{m} \times \cos(\text{latitude})$.

#### Aspect Formulation Discrepancy:
The original formula used in Phase 12:
$$\text{Aspect}_{\text{polar}} = \left(\text{atan2}\left(-\frac{\partial z}{\partial y}, \frac{\partial z}{\partial x}\right) \times \frac{180}{\pi} + 360\right) \pmod{360}$$
This produces a polar angle measured counterclockwise from East, transposed:
- Downhill towards West $\rightarrow 0.0^\circ$
- Downhill towards North $\rightarrow 90.0^\circ$
- Downhill towards East $\rightarrow 180.0^\circ$
- Downhill towards South $\rightarrow 270.0^\circ$

**Rectification in V2:** The standard geographic compass downslope azimuth (clockwise from North):
$$\text{Aspect}_{\text{compass}} = \left(\text{atan2}\left(-\frac{\partial z}{\partial x}, -\frac{\partial z}{\partial y}\right) \times \frac{180}{\pi} + 360\right) \pmod{360}$$
- Downhill towards North $\rightarrow 0.0^\circ$
- Downhill towards East $\rightarrow 90.0^\circ$
- Downhill towards South $\rightarrow 180.0^\circ$
- Downhill towards West $\rightarrow 270.0^\circ$
- Flat terrain ($\text{slope} < 0.1^\circ$) $\rightarrow -1.0^\circ$

This rectified formula is exported in `terrain_features_ner_v2.csv` under `aspect_compass_deg`, while the original value is preserved under `polar_aspect_legacy_deg`.

### 3.3 Location Uncertainty vs. DEM Micro-Topography
A critical finding from this audit is that **only 4 out of 368 records have "exact" coordinates**.
- 48 records have 1 km uncertainty.
- 122 records have 5 km uncertainty.
- 56 records have 10 km uncertainty.
- 64 records have 25 km uncertainty.
- 52 records have 50 km uncertainty.
- 1 record has 100 km uncertainty.
- 21 records have "unknown" uncertainty.

**Consequence on Extracted Terrain:**
- A 30-meter DEM pixel captures micro-topography. If a catalog coordinate has a 25 km spatial uncertainty radius, the coordinate represents an arbitrary town center or district marker.
- **54 records in `terrain_features_ner.csv` have slope < 5°** (e.g. EID 9334 in Assam with slope 3.06°). Landslides do not initiate on 3° flat plains; the actual slope was on an adjacent hill miles away from the recorded centroid.
- **Remediation:** `terrain_features_ner_v2.csv` includes `spatial_representativeness` labels (`HIGH_SPATIAL_CONFIDENCE`, `MODERATE_SPATIAL_UNCERTAINTY`, `COARSE_CENTROID_ONLY`). Machine learning models must not train directly on these centroids without weighting or accounting for location uncertainty.

---

## 4. Source Provenance & Regional Filtering Audit

### 4.1 Canonical 8-State Regional Domain
All 368 accepted events were audited against state administrative boundaries:
- **Assam:** 82 events (22.3%)
- **Nagaland:** 78 events (21.2%)
- **Manipur:** 56 events (15.2%)
- **Sikkim:** 48 events (13.0%)
- **Arunachal Pradesh:** 45 events (12.2%)
- **Meghalaya:** 29 events (7.9%)
- **Mizoram:** 27 events (7.3%)
- **Tripura:** 3 events (0.8%)
- **Total Accepted:** Exactly 368 events.

### 4.2 Reconciliation of the 74 Excluded West Bengal Corridor Records
Within the Northeast India bounding box (`21.5°N - 29.5°N, 88.0°E - 97.5°E`), the raw catalog contains 442 events.
- **Accepted:** 368 events.
- **Excluded:** 74 events.
- **Audit Verification:** All 74 excluded events have `admin_division_name` equal to `Bengal` (47) or `West Bengal` (27).
- **Geographic Explanation:** These events are located in Darjeeling, Kurseong, Kalimpong, and Siliguri. Geographically, this is the sub-Himalayan corridor connecting mainland India to the Northeast, but administratively, West Bengal is part of Eastern India. Under SlopeGuard's governance mandate to monitor the **8 official Northeastern states (NEC)**, these 74 records were correctly excluded.

### 4.3 Verification Taxonomy Breakdown
- **VERIFIED_FROM_SOURCE:** 289 records (78.5%) — Complete source citation, publisher, detailed location description, and spatial accuracy $\le 25\text{ km}$.
- **PARTIALLY_VERIFIED:** 79 records (21.5%) — Coarse spatial accuracy ($> 25\text{ km}$, 50km, or unknown) or dead source URL.
- **UNVERIFIED / SYNTHETIC:** 0 records (0.0%).

---

## 5. Manifest & Checksum Verification

All artifacts have been hashed and reconciled in `dataset_manifest.json` (both root and `ai-service/data/processed/` are identical):

```json
{
  "pipeline_version": "2.2.0-audited-integrity",
  "status": "PHASE_12_1_INDEPENDENT_AUDIT_VERIFIED",
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
  }
}
```

### Complete File SHA-256 Digest Index
- `Global_Landslide_Catalog_Export_rows.csv`: `2c4898899dd4f3737ec38a9e70198f1220aeb20f5c22501a52ba9eaae248d2fc`
- `historical_landslide_events_ner.csv`: `96e671924931ce624263725b8782a201df1e626bfb7f83ad708ff8452be411fa`
- `historical_rainfall_features_ner.csv`: `fee4271a0623631d14cfce18967ee3594fa915ce3df78119c8f000b2169601d3`
- `historical_rainfall_features_ner_v2.csv`: `b133187f323c963de22f1beae0e95db506f362ae7faeebef25ae15830e70390c`
- `historical_rainfall_features_ner_v3.csv`: `1cb79f32338f0d57540a97bfdc45e7f099042b467ec6da26eb664653dd79cf66`
- `terrain_features_ner.csv`: `3720c95f4a18a6f9f257bdfb77ebdf62b9bc3fa3528bca688469cba45a7c268a`
- `terrain_features_ner_v2.csv`: `001da28fd39a66d03991ae4e32ea2707ee6bc3203f5691456a65520bbd387063`
- `copernicus_dem_tile_index_requirements.csv`: `d4487cbb404e8de76c498709320e6e76cf0e4a7a8d9bf16cbf932d4336f32e2c`
- `open_meteo_rainfall_cache.json`: `b68925be02737ef91a56110fca5c52c93051da03eb75960d704ba41cc28fec86`

---

## 6. Execution Evidence & Automated Test Verification

Command:
```powershell
python -m pytest -v ai-service/tests
```

Output:
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\sakth\OneDrive\Desktop\SlopeGuard
collected 55 items

ai-service/tests/test_api.py::test_health_endpoint PASSED                [  1%]
ai-service/tests/test_api.py::test_model_status_endpoint PASSED          [  3%]
ai-service/tests/test_api.py::test_predict_endpoint_valid_request PASSED [  5%]
ai-service/tests/test_api.py::test_predict_endpoint_invalid_coordinates PASSED [  7%]
ai-service/tests/test_api.py::test_predict_endpoint_inconsistent_rainfall PASSED [  9%]
ai-service/tests/test_api.py::test_predict_endpoint_negative_slope PASSED [ 10%]
ai-service/tests/test_api_governance.py::test_model_status_governance_metadata PASSED [ 12%]
ai-service/tests/test_api_governance.py::test_candidate_thresholds_endpoint PASSED [ 14%]
ai-service/tests/test_api_governance.py::test_predict_governance_metadata PASSED [ 16%]
ai-service/tests/test_calibration_and_thresholds.py::test_calibration_deferred_for_synthetic_dataset PASSED [ 18%]
ai-service/tests/test_calibration_and_thresholds.py::test_calibration_deferred_for_small_historical_sample PASSED [ 20%]
ai-service/tests/test_calibration_and_thresholds.py::test_calibration_eligible_only_when_sufficient_field_records PASSED [ 21%]
ai-service/tests/test_calibration_and_thresholds.py::test_brier_score_computation PASSED [ 23%]
ai-service/tests/test_calibration_and_thresholds.py::test_candidate_thresholds_schema_and_status PASSED [ 25%]
ai-service/tests/test_data_acquisition_pipeline.py::test_files_exist_on_disk PASSED [ 27%]
ai-service/tests/test_data_acquisition_pipeline.py::test_csv_parsing_and_source_column_handling PASSED [ 29%]
ai-service/tests/test_data_acquisition_pipeline.py::test_regional_filtering_and_state_bounds PASSED [ 30%]
ai-service/tests/test_data_acquisition_pipeline.py::test_coordinate_validation PASSED [ 32%]
ai-service/tests/test_data_acquisition_pipeline.py::test_duplicate_detection PASSED [ 34%]
ai-service/tests/test_data_acquisition_pipeline.py::test_source_traceability_and_verification_categories PASSED [ 36%]
ai-service/tests/test_data_acquisition_pipeline.py::test_rainfall_v1_features PASSED [ 38%]
ai-service/tests/test_data_acquisition_pipeline.py::test_rainfall_v2_dual_window_audit PASSED [ 40%]
ai-service/tests/test_data_acquisition_pipeline.py::test_copernicus_dem_tiles_integrity PASSED [ 41%]
ai-service/tests/test_data_acquisition_pipeline.py::test_terrain_extraction_coverage_and_authenticity PASSED [ 43%]
ai-service/tests/test_data_acquisition_pipeline.py::test_dataset_manifest_integrity_and_governance PASSED [ 45%]
ai-service/tests/test_data_validation.py::test_synthetic_fixtures_validation_passes PASSED [ 47%]
ai-service/tests/test_data_validation.py::test_missing_required_columns_fails PASSED [ 49%]
ai-service/tests/test_data_validation.py::test_out_of_bounds_coordinates_dropped PASSED [ 50%]
ai-service/tests/test_data_validation.py::test_inconsistent_rainfall_dropped PASSED [ 52%]
ai-service/tests/test_data_validation.py::test_synthetic_commingling_rejection PASSED [ 54%]
ai-service/tests/test_data_validation.py::test_deduplication_of_identical_records PASSED [ 56%]
ai-service/tests/test_historical_and_calibration.py::test_historical_weather_client_parsing PASSED [ 58%]
ai-service/tests/test_historical_and_calibration.py::test_calibration_deferred_on_synthetic_data PASSED [ 60%]
ai-service/tests/test_historical_readiness.py::test_historical_dataset_file_exists PASSED [ 61%]
ai-service/tests/test_historical_readiness.py::test_historical_dataset_schema_and_types PASSED [ 63%]
ai-service/tests/test_historical_readiness.py::test_zero_synthetic_commingling_in_historical_dataset PASSED [ 65%]
ai-service/tests/test_historical_readiness.py::test_physical_geotechnical_constraints PASSED [ 67%]
ai-service/tests/test_historical_readiness.py::test_provenance_and_event_identifiers PASSED [ 69%]
ai-service/tests/test_historical_readiness.py::test_validator_rejects_commingled_dataset PASSED [ 70%]
ai-service/tests/test_leakage_and_evaluation.py::test_temporal_train_test_split_isolation PASSED [ 72%]
ai-service/tests/test_leakage_and_evaluation.py::test_temporal_split_raises_on_inverted_timestamps PASSED [ 74%]
ai-service/tests/test_leakage_and_evaluation.py::test_baselines_computation PASSED [ 76%]
ai-service/tests/test_leakage_and_evaluation.py::test_evaluation_pipeline_execution PASSED [ 78%]
ai-service/tests/test_phase_12_1_audit.py::test_copernicus_dem_rasters_georeferencing_and_datum PASSED [ 80%]
ai-service/tests/test_phase_12_1_audit.py::test_aspect_mathematics_and_geographic_convention PASSED [ 81%]
ai-service/tests/test_phase_12_1_audit.py::test_terrain_v2_schema_and_location_uncertainty PASSED [ 83%]
ai-service/tests/test_phase_12_1_audit.py::test_rainfall_v3_timezone_offset_and_window_boundaries PASSED [ 85%]
ai-service/tests/test_phase_12_1_audit.py::test_reconciliation_of_west_bengal_corridor PASSED [ 87%]
ai-service/tests/test_phase_12_1_audit.py::test_manifest_synchronization_and_governance PASSED [ 89%]
ai-service/tests/test_predictor.py::test_missing_model_artifact_returns_unavailable PASSED [ 90%]
ai-service/tests/test_predictor.py::test_valid_prediction_returns_demo_status PASSED [ 92%]
ai-service/tests/test_predictor.py::test_zero_rainfall_high_slope_warning PASSED [ 94%]
ai-service/tests/test_training_pipeline.py::test_training_pipeline_artifacts_creation PASSED [ 96%]
ai-service/tests/test_training_pipeline.py::test_target_leakage_prevention_temporal_split PASSED [ 98%]
ai-service/tests/test_training_pipeline.py::test_training_reproducibility PASSED [100%]

============================= 55 passed in 5.12s ==============================
```

---

## 7. Mandatory AI Governance Affirmation

In strict accordance with SlopeGuard's ethics and safety governance policies:
- The system status remains **`DEMO_NOT_VALIDATED`**.
- Model calibration remains **`CALIBRATION_DEFERRED`**.
- Model inference output remains classified as **`UNCALIBRATED_HAZARD_SCORE`**.
- Decision thresholds remain **`PENDING_EXPERT_REVIEW`**.
- No synthetic negative pseudo-samples were invented.
- The 368-event historical catalog is explicitly **NOT** presented as an operational warning system, nor as a balanced sample of non-landslide slopes.
