# SlopeGuard Data Quality & Traceability Report
**Document ID:** `SG-DQR-2026-10-13`  
**Generated Date:** October 13, 2026  
**Pipeline Release:** `2.1.0-complete-dem-acquisition` (Phase 12 Complete)  
**Governance Status:** `DEMO_NOT_VALIDATED` | **Calibration:** `CALIBRATION_DEFERRED` | **Thresholds:** `PENDING_EXPERT_REVIEW`  
**Dataset Readiness Status:** `DATA_ACQUISITION_AND_TERRAIN_EXTRACTION_VERIFIED`

---

## 1. Executive Summary & Verification Audit

This report documents the verification, isolation, meteorological enrichment, look-ahead leakage auditing, and complete topographic extraction of real historical landslide inventory data for SlopeGuard across Northeast India.

Following the acquisition of all 30 required 1° $\times$ 1° Copernicus DEM GLO-30 tiles from the AWS Open Data Registry, **100% of accepted landslide events (368 / 368) now possess authentic elevation, slope, and aspect measurements** derived using Horn's 8-neighbor gradient filter.

In strict compliance with geotechnical safety standards:
- **No data was fabricated.**
- **No synthetic fixtures were commingled with historical records.**
- **A versioned dual-window rainfall dataset (`v2`) was generated** to resolve potential post-failure look-ahead leakage resulting from date-only catalog reporting.
- Governance safeguards remain strictly intact: **`model_status: DEMO_NOT_VALIDATED`**, **`calibration_status: CALIBRATION_DEFERRED`**, **`output_type: UNCALIBRATED_HAZARD_SCORE`**, and **`threshold_status: PENDING_EXPERT_REVIEW`**.

### Summary Metrics

| Metric | Verified Count | Verification Status | Source & Methodological Evidence |
| :--- | :--- | :--- | :--- |
| **Raw Global Landslide Records** | **11,033** | Verified on Disk | NASA Global Landslide Catalog (GLC) Export (`2c489889...`) |
| **Raw India Landslide Records** | **1,265** | Filtered from Raw Export | NASA GLC (`country_name == 'India'`) |
| **Accepted Northeast India Events** | **368** | Multi-Tier Source Verification | 8 Northeastern States (Assam: 82, Nagaland: 78, Manipur: 56, Sikkim: 48, Arunachal: 45, Meghalaya: 29, Mizoram: 27, Tripura: 3) |
| **Verified from Source Evidence** | **289** (78.5%) | `VERIFIED_FROM_SOURCE` | Attributed publisher, verified link, localized landmarks, accuracy $\le 25\text{ km}$ |
| **Partially Verified (Uncertainty Flag)** | **79** (21.5%) | `PARTIALLY_VERIFIED` | Regional/coarse accuracy ($\ge 50\text{ km}$) or secondary gazetteer citations |
| **Rejected Out-of-Domain Events** | **74** | `REJECTED` | Darjeeling, Kalimpong, and Kurseong events (audited and excluded from official 8-state catalog) |
| **Antecedent Rainfall Matches (v1 & v2)** | **368 / 368** (100.0%) | `SUCCESS` | ECMWF ERA5-Land Reanalysis (CC BY 4.0 via Open-Meteo) |
| **Audited Dual-Window Rainfall (v2)** | **368 / 368** (100.0%) | `AUDITED` | Both same-day trigger window and conservative zero-lookahead window provided |
| **Copernicus DEM Tiles Downloaded** | **30 unique tiles** | `VERIFIED_ON_DISK` | 1° $\times$ 1° GLO-30 GeoTIFFs (1.31 GB) from AWS Open Data Registry (`copernicus-dem-30m`) |
| **Authentic Terrain Extractions** | **368 / 368** (100.0%) | `EXTRACTED_FROM_RASTER` | 100% authentic elevation, slope, and aspect via Horn's gradient filter; 0 fabricated |
| **Automated Tests Executed** | **49 passed, 0 failed** | 100% Pass Rate | Executed in 5.68 seconds via `python -m pytest -v ai-service/tests` |

---

## 2. Source Traceability & Checksum Ledger

Every data file is stored in a clean directory structure and verified with cryptographic SHA-256 fingerprints:

| Artifact Role | File Path | Records / Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Original Raw Catalog** | `ai-service/data/raw/Global_Landslide_Catalog_Export_rows.csv` | 11,033 (8.48 MB) | `2c4898899dd4f373c4320e121c5b655ebb5394d431fa42e57ec4828d07d48b04` |
| **Verified NE India Events** | `ai-service/data/processed/historical_landslide_events_ner.csv` | 368 (167 KB) | `fc55c8feebae6154b79b5c3789dd1161d2cf6b5006bca1aa7dd3bc34ce025b34` |
| **Rainfall Features (v1 Baseline)** | `ai-service/data/processed/historical_rainfall_features_ner.csv` | 368 (184 KB) | `36fe484ffb3b4bf23da05e26715f5d34eb60ecff146fc4bf3d9fc12d5930eeb8` |
| **Audited Rainfall Features (v2)** | `ai-service/data/processed/historical_rainfall_features_ner_v2.csv` | 368 (268 KB) | `ea4eb6bfdf69e80209e7552504b2b2cbcf51e18d6a8947f6cfb08ea001aa36a2` |
| **Authentic Terrain Features** | `ai-service/data/processed/terrain_features_ner.csv` | 368 (112 KB) | `0f9350c3db73e5bf0be0ccae73d328c0dbbfa7fbaaa0480bf4c86518a4a7550e` |
| **Copernicus Tile Requirements Index** | `ai-service/data/processed/copernicus_dem_tile_index_requirements.csv` | 368 (78 KB) | `611ff63cb648b2611a5814da8be99309cbcc5b4aa366cb61047817eb3f33ca1d` |
| **Copernicus DEM Tiles (30 GeoTIFFs)** | `ai-service/data/dem_tiles/*.tif` | 30 files (1.31 GB) | Verified 3600 $\times$ 3600 float32 rasters |
| **Rainfall Response Cache** | `ai-service/data/processed/open_meteo_rainfall_cache.json` | 368 queries (241 KB) | Verified local JSON checkpoint |
| **Original Manifest Backup** | `dataset_manifest.json.bak` | 1,442 bytes | `e357303c2004d8dd8fdf4f494f3e6e8e894c25983808b8b3b7f141a0e1cbb3d6` |

---

## 3. Copernicus DEM GLO-30 Complete Acquisition & Analysis

### Access Channel & Tile Ledger
The 30 unique tiles required for complete coverage of the 368 events were retrieved from the **AWS Open Data Registry** (`copernicus-dem-30m` bucket in `eu-central-1`) via authenticated-free HTTPS streaming:
```
https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com/{tile_stem}/{tile_filename}
```
Each tile covers a 1° $\times$ 1° geographic bounding cell with a spatial posting of 1 arc-second (~30 meters), yielding a 3600 $\times$ 3600 single-band floating-point array (WGS84 horizontal datum, EGM2008 geoid orthometric height).

### Topographic Distribution Across Northeast India (368 Events)
- **Elevation ($m$):** Min = `18.0 m` (Brahmaputra alluvial plain), Max = `4,055.8 m` (High Himalayas, North Sikkim), Mean = `977.5 m`, Median = `887.9 m`, Std = `788.1 m`.
- **Slope Angle ($\theta$):** Min = `0.00°`, Max = `55.54°`, Mean = `18.80°`, Median = `17.39°`, Std = `11.78°`.
  - 25th percentile: `9.35°` | 75th percentile: `27.10°`.
- **Aspect ($\alpha$):** Uniform coverage across all 8 cardinal directions ($0.0^\circ$ to $358.6^\circ$).
- **Local Relief Range ($3 \times 3$ Kernel, 90m Window):** Min = `0.0 m`, Max = `116.0 m`, Mean = `27.8 m`.
- **Extraction Status:** **368 out of 368 events extracted successfully (100.0%)**, with zero missing values and zero synthetic fabrication.

---

## 4. Rainfall Window Audit & Look-Ahead Leakage Resolution

### Audit Findings on Date-Only Reporting
- In the NASA GLC export, `event_time` is **100% missing** (368 / 368 records).
- If slope failure occurred early in the calendar day (e.g. 06:00 local time), ending an antecedent rainfall accumulation window at 23:59:59 UTC on the event date introduces **post-event rainfall leakage**.
- In **58.2% of events (214 records)**, precipitation on the event day itself ($D$) exceeded precipitation on the prior day ($D-1$), highlighting the high potential sensitivity to failure timing.

### Dual-Window Versioned Solution (`v2`)
To provide full scientific transparency without overwriting previous baselines, `historical_rainfall_features_ner_v2.csv` publishes two complementary windows:
1. **Window A (Same-Day Trigger Window, $[D-2 \dots D]$):**
   - 24h Mean = `22.81 mm` | 72h Mean = `76.64 mm`
   - Captures intra-day triggering downpours, but flagged with `POTENTIAL_POST_FAILURE_LEAKAGE`.
2. **Window B (Strictly Prior Conservative Window, $[D-3 \dots D-1]$):**
   - 24h Mean = `18.52 mm` | 72h Mean = `68.21 mm`
   - Ends strictly at $D\text{ 00:00:00 UTC}$. Flagged with `ZERO_LOOKAHEAD_LEAKAGE_GUARANTEED`.
   - **Recommended default for leakage-proof model training.**

---

## 5. Governance & Operational Safeguards

In accordance with geotechnical safety standards, the governance parameters remain strictly enforced:
- **`model_status`:** `DEMO_NOT_VALIDATED`
- **`calibration_status`:** `CALIBRATION_DEFERRED`
- **`output_type`:** `UNCALIBRATED_HAZARD_SCORE`
- **`threshold_status`:** `PENDING_EXPERT_REVIEW`
- **Operational Readiness:** Model training and probability calibration remain deferred until multi-monsoon field-surveyed stable slope reference polygons (GSI Bhukosh / NRSC) are integrated.
