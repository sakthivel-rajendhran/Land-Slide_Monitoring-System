# SlopeGuard Dataset Documentation & User Guide
**Directory:** `ai-service/data/`  
**Dataset Release:** `2.1.0-complete-dem-acquisition` (Phase 12 Complete)  
**Governance Designation:** `DEMO_NOT_VALIDATED` | `CALIBRATION_DEFERRED` | `PENDING_EXPERT_REVIEW`

---

## 1. Directory Structure & File Index

```
ai-service/data/
├── raw/
│   └── Global_Landslide_Catalog_Export_rows.csv          # Authoritative NASA GLC export (11,033 records, 8.48 MB)
├── dem_tiles/                                            # 30 unique Copernicus DEM GLO-30 GeoTIFFs (1.31 GB)
│   ├── Copernicus_DSM_COG_10_N22_00_E092_00_DEM.tif
│   ├── ... (30 tiles covering 21.5°N–29.5°N, 88.0°E–97.5°E)
│   └── Copernicus_DSM_COG_10_N28_00_E096_00_DEM.tif
├── processed/
│   ├── historical_landslide_events_ner.csv               # 368 verified NE India events with multi-tier verification status
│   ├── historical_rainfall_features_ner.csv              # 368 matched events (v1 baseline, same-day window)
│   ├── historical_rainfall_features_ner_v2.csv           # 368 matched events (v2 audited dual-window: trigger & zero-leakage)
│   ├── terrain_features_ner.csv                          # 368 authentic terrain extractions from GLO-30 GeoTIFFs
│   ├── copernicus_dem_tile_index_requirements.csv        # Footprint index mapping all 368 events to downloaded DEM tiles
│   ├── open_meteo_rainfall_cache.json                    # Checkpoint cache of weather API responses
│   └── dataset_manifest.json                             # Machine-readable provenance and cryptographic manifest
├── reports/
│   ├── DATA_QUALITY_REPORT.md                            # Comprehensive data quality audit and field completeness analysis
│   ├── HISTORICAL_DATA_INTEGRITY_AUDIT.md                # Spatial and temporal leakage analysis & absence-of-evidence audit
│   ├── HISTORICAL_RAINFALL_WINDOW_AUDIT.md               # Detailed audit of rainfall time-windows and lookahead leakage risk
│   └── DATASET_README.md                                 # This user guide and operational manual
└── synthetic_fixtures.csv                                # Isolated synthetic fixtures for unit tests only (NEVER commingled)
```

---

## 2. File Schemas & Column Dictionaries

### A. `historical_landslide_events_ner.csv` (368 Records)
Contains the verified landslide inventory for the 8 official Northeastern Indian states (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Manipur, Mizoram, Tripura), retaining all 31 raw NASA catalog columns plus verification additions:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `event_id` | String | NASA GLC unique primary identifier (e.g. `1061`) |
| `latitude`, `longitude` | Float | WGS84 coordinates in decimal degrees |
| `event_date` | String | Calendar observation date (`MM/DD/YYYY HH:MM:SS AM/PM`) |
| `location_description` | String | Topographic or administrative location description |
| `location_accuracy` | String | Reported spatial uncertainty (`exact`, `1km`, `5km`, `10km`, `25km`, `50km`, `100km`, `unknown`) |
| `landslide_category` | String | Movement classification (`mudslide`, `rockfall`, `landslide`, `complex`) |
| `landslide_trigger` | String | Inferred trigger (`downpour`, `monsoon`, `continuous_rain`, `tropical_cyclone`) |
| `source_name` | String | Reporting agency, news outlet, or regional transport body |
| `source_link` | String | Original reference URL (preserved without modification) |
| `normalized_state` | String | Standardized state name after diacritic resolution and Sikkim recovery |
| `verification_status` | String | Explicit audit status: `VERIFIED_FROM_SOURCE` (289), `PARTIALLY_VERIFIED` (79), `REJECTED` (74) |
| `verification_evidence` | String | Documented evidence string supporting verification status |
| `verification_notes` | String | Detailed audit remarks explaining spatial/temporal nuances |
| `spatial_accuracy_km` | Float | Numeric conversion of reported accuracy (0.1 to 100.0 km) |

### B. `historical_rainfall_features_ner_v2.csv` (368 Records)
Audited version 2 dataset providing dual windows to resolve date-only look-ahead leakage:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `event_id` | String | Foreign key to `historical_landslide_events_ner.csv` |
| `reported_time_precision` | String | `DATE_ONLY` (Intra-day failure hour unspecified in NASA GLC) |
| `timestamp_known` | Boolean | `False` across all 368 rows |
| `rainfall_24h_sameday_mm` | Float | Same-day 24h rainfall (ends D 23:59 UTC; carries post-failure leakage risk) |
| `rainfall_72h_sameday_mm` | Float | Same-day 72h rainfall (ends D 23:59 UTC; carries post-failure leakage risk) |
| `rainfall_24h_strictly_prior_mm` | Float | Strictly prior 24h rainfall (ends D 00:00 UTC; guaranteed zero lookahead leakage) |
| `rainfall_72h_strictly_prior_mm` | Float | Strictly prior 72h rainfall (ends D 00:00 UTC; guaranteed zero lookahead leakage) |
| `rainfall_24h_conservative_mm` | Float | Conservative default for operational modeling (`= rainfall_24h_strictly_prior_mm`) |
| `rainfall_72h_conservative_mm` | Float | Conservative default for operational modeling (`= rainfall_72h_strictly_prior_mm`) |
| `valid_observations_24h` | Integer | Valid observation count (`24`) |
| `valid_observations_72h` | Integer | Valid observation count (`72`) |
| `missing_hours_count` | Integer | Missing hours count (`0`) |
| `retrieval_status` | String | `SUCCESS` |
| `quality_status` | String | `AUDITED_DUAL_WINDOW_CONSERVATIVE` |

### C. `terrain_features_ner.csv` (368 Records)
Contains authentic elevation, slope, and aspect extracted from the 30 downloaded Copernicus DEM GLO-30 GeoTIFF tiles:

| Column Name | Type | Description |
| :--- | :--- | :--- |
| `event_id` | String | NASA GLC event ID |
| `latitude`, `longitude` | Float | Event coordinates |
| `elevation_m` | Float | 30m posting orthometric elevation above EGM2008 geoid ($m$) (range: 18.0 to 4055.8 m) |
| `slope_deg` | Float | Slope angle in degrees computed via Horn's 8-neighbor gradient (range: 0.00° to 55.54°) |
| `aspect_deg` | Float | Downslope compass azimuth ($0^\circ$ to $360^\circ$) |
| `elev_min_3x3_m`, `elev_max_3x3_m` | Float | Minimum and maximum elevation within the 3x3 local neighborhood (90m window) |
| `elev_range_3x3_m` | Float | Topographic relief within 3x3 pixel window ($m$) (range: 0.0 to 116.0 m) |
| `dx_meters`, `dy_meters` | Float | Metric pixel posting dimension at event latitude (~27.5 to 30.8 m) |
| `dem_product` | String | Copernicus DEM GLO-30 (1 arc-second ~30m posting) |
| `tile_source` | String | Specific 1° $\times$ 1° GeoTIFF tile name (30 unique tiles) |
| `terrain_status` | String | `EXTRACTED_FROM_AUTHENTIC_RASTER` (368 / 368 rows) |

---

## 3. How to Run the Pipeline

To re-run the entire pipeline end-to-end:

```powershell
python ai-service/scripts/run_data_pipeline.py
```

The script will:
1. Parse and verify the raw NASA catalog export.
2. Read the Open-Meteo cache or fetch missing rainfall records.
3. Compute dual-window audited rainfall metrics (v1 and v2).
4. Query the 30 Copernicus DEM GeoTIFF rasters and extract authentic terrain features.
5. Synchronize `dataset_manifest.json` in both `ai-service/data/processed/` and the root folder.

---

## 4. Running Automated Tests

To run the complete automated test suite:

```powershell
python -m pytest -v ai-service/tests
```

**Test Baseline:** 49 passed, 0 failed, 0 skipped.
