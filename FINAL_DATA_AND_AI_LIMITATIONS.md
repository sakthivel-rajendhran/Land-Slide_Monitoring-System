# SlopeGuard — Final Data Provenance, AI Limitations & Scientific Readiness Report

**System Governance Classification:** `DEMO_NOT_VALIDATED` • `CALIBRATION_DEFERRED` • `UNCALIBRATED_HAZARD_SCORE` • `PENDING_EXPERT_REVIEW`  
**Dataset Pipeline Release:** 2.8.0-final  
**Target Coverage:** Northeast India Region (NER) — 8 States  

---

## 1. Executive Summary: Scientific Readiness Appraisal

SlopeGuard has achieved a complete, automated, and reproducible data pipeline integrating satellite-derived elevation data (Copernicus DEM GLO-30) and atmospheric precipitation reanalysis (Open-Meteo / ERA5-Land) across 368 historical landslide events in Northeast India.

However, an exhaustive multi-phase data integrity audit (Phases 12.1 through 12.8) confirms that **the current dataset is not scientifically ready for training or evaluating an operational landslide early-warning system**. The system is appropriately maintained as an exploratory research prototype with strict governance safeguards.

This document transparently records the source provenance, geotechnical and temporal data gaps, modeling biases, and institutional access requirements necessary for real-world validation.

---

## 2. Dataset Lineage & Provenance

### 2.1 Filtering and Regional Attribution
The historical event dataset originates from the NASA Global Landslide Catalog (GLC) export:
* **Global Inventory:** 11,033 records (`Global_Landslide_Catalog_Export_rows.csv`, SHA-256: `2c4898899...`)
* **All-India Records:** 1,265 records
* **Accepted Northeast India Records:** **368 events** spanning the 8 official NER states:
  - **Assam:** 82 events (22.28%)
  - **Nagaland:** 78 events (21.20%)
  - **Manipur:** 56 events (15.22%)
  - **Sikkim:** 48 events (13.04%)
  - **Arunachal Pradesh:** 45 events (12.23%)
  - **Meghalaya:** 29 events (7.88%)
  - **Mizoram:** 27 events (7.34%)
  - **Tripura:** 3 events (0.82%)
* **Excluded Border Corridor Records:** **74 events** located in the Darjeeling-Jalpaiguri corridor (West Bengal), strictly segregated from the NER 8-state administrative domain.

### 2.2 Feature Enrichment Datasets
* **Copernicus DEM GLO-30:** 30 georeferenced raster tiles covering 100% of NER event coordinates in EPSG:4326 (WGS 84, EGM2008 vertical datum). Features extracted: `elevation_m`, `slope_deg`, `aspect_deg` (standard downslope compass azimuth $0^\circ \le \theta < 360^\circ$).
* **ERA5-Land / Open-Meteo Rainfall Features (Version 3):** Hourly precipitation reanalysis aggregated across strictly prior 24-hour and 72-hour windows, preventing the inclusion of post-failure rainfall.

---

## 3. Critical Scientific & Geotechnical Limitations

### 3.1 Total Absence of Intraday Failure Times (0 / 368 Events)
* **Status:** 368 out of 368 historical catalog events record only a calendar date (`event_date`), with 0 records providing an exact failure hour or minute.
* **Scientific Impact:** Without an intraday failure timestamp, calculating antecedent precipitation requires choosing an arbitrary cutoff (e.g. UTC 00:00 or IST 00:00). If a landslide occurred at 06:00 AM, using the entire day's rainfall introduces post-event rainfall into the predictor (target leakage). If only the previous day's rainfall is used, the triggering monsoonal cloudburst that occurred between midnight and 05:00 AM is omitted.

### 3.2 Coarse Spatial Resolution & Valley-Bottom Geocoding Bias (98.91% Centroid Approximations)
* **Status:**
  - Exact GPS / Surveyed Crown Scar: **4 / 368 events (1.09%)**
  - Approximate 1 km to 25 km Centroid: **364 / 368 events (98.91%)**
* **Terrain Distortion:** 
  - Because media reports typically cite town centers, highway junctions, or valley settlements rather than the steep failure scarp on the mountainside, centroid coordinates often fall on river valley floors or flatter terrain.
  - **Low-Slope Anomaly:** In Copernicus DEM (30m resolution), **54 out of 368 events (14.67%)** exhibit a sampled slope angle **under 5.0 degrees**, with 18 events under 2.0 degrees. Landslides do not initiate on 2° slopes; this is an artifact of valley-bottom geocoding. Training an unconstrained ML model on these points would teach it that flat ground carries high landslide risk.

### 3.3 Absence of Verified Non-Landslide Controls (Presence-Only Sampling Bias)
* **Status:** The NASA GLC and media-derived registers record only failure occurrences (positive samples). There are **0 verified negative samples** (stable slopes that received intense rainfall without failing).
* **Scientific Impact:** Supervised classification requires both positive and negative classes. Training on randomly sampled negative pseudo-points introduces false negatives (sampling an undetected landslide or an inherently unstable slope that merely hasn't failed yet). The prototype model operates on controlled synthetic fixtures for architectural demonstration only.

### 3.4 Media Publication Lag vs Event Occurrence
* **Evidence Audit (Phase 12.7):** An audit of 52 prioritized events with source news links revealed that in 37 cases (71.15%), URLs were dead (404/DNS expired) or contained generalized monsoonal casualty summaries published days or weeks after the triggering event. Publication dates cannot substitute for geotechnical occurrence dates.

---

## 4. Susceptibility Mapping vs Dynamic Early Warning

It is scientifically essential to distinguish between two distinct modeling objectives:
1. **Landslide Susceptibility Mapping (LSM):** Static spatial probability mapping based on slope, lithology, lineaments, curvature, and land use (e.g., GSI 1:50k NLSM maps). LSM indicates *where* landslides are prone to occur over multi-year scales.
2. **Dynamic Early Warning Systems (LEWS):** Real-time temporal threshold forecasting indicating *when* an active slope will fail based on antecedent soil moisture, infiltration kinetics, and rainfall intensity-duration ($I-D$) thresholds.

**Current SlopeGuard Prototype Role:** SlopeGuard demonstrates the software architecture and dynamic data fusion required for a LEWS, but operates as an uncalibrated hybrid prototype until empirical $I-D$ curves and geotechnical sensors are calibrated against regional telemetry.

---

## 5. Status of Institutional Data Sourcing (Phase 12.8 Assessment)

To resolve the data gaps identified above, SlopeGuard evaluated six official institutional repositories:

| Institutional Authority | Repository / System | Data Assets Offered | Access Constraints / Status |
| :--- | :--- | :--- | :--- |
| **Geological Survey of India (GSI)** | Bhukosh Geospatial Portal | National Landslide Susceptibility Mapping (NLSM) 1:50k shapefiles | Interactive WMS/WFS map viewer available; bulk vector downloads require formal institutional credentialing |
| **Assam State Disaster Management (ASDMA)** | DRIMS (Disaster Reporting & Info Management) | Verified block and revenue-circle incident registers with GPS coordinates | Closed portal restricted to circle officers; public daily situation bulletins provide district-level aggregates |
| **Sikkim State Disaster Management (SSDMA)** | SEOC Incident Logs | Real-time landslide registers for NH-10 and North Sikkim axis | Published via social media / police advisories; raw database accessible via formal state department MoU |
| **Copernicus Data Space (CDSE)** | Sentinel-1 SAR & Sentinel-2 MSI | Pre/post event radar amplitude change and optical imagery | **Open Access** via STAC API and Copernicus OAuth client credentials |
| **Survey of India (SOI)** | NGP Geospatial Portal | 1:50k Topographic Contours and Village Boundary Cadastres | Open Data policy for registered Indian academic institutions |
| **India Meteorological Dept (IMD)** | IMD Pune Hydro-Met Division | Gridded 0.25° x 0.25° daily rainfall & Automatic Weather Stations (AWS) | AWS hourly data available for academic research via formal request to National Data Centre |

*Note: In accordance with project integrity standards, SlopeGuard documents these repositories and access requirements without falsely claiming datasets were downloaded or that unverified institutional agreements were finalized.*

---

## 6. Model Governance Safeguards

Until authoritative event scars and verified non-failing slopes are integrated, the following four governance invariants remain strictly enforced across all code, tests, and user interfaces:

1. **`DEMO_NOT_VALIDATED`**: The model artifact is explicitly labeled as an unvalidated prototype in all API responses (`AiPredictionResponse.java`, `predictor.py`, and `risk-map.js`).
2. **`CALIBRATION_DEFERRED`**: Hazard probability scaling is deferred; no unverified Platt scaling or isotonic calibration is applied.
3. **`UNCALIBRATED_HAZARD_SCORE`**: Hazard metrics are presented as relative risk indicators rather than calibrated empirical probabilities.
4. **`PENDING_EXPERT_REVIEW`**: Warning thresholds (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) carry candidate status and require sign-off by qualified geotechnical and disaster management authorities.
5. **`DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`**: Retained across system configurations (`AiModelStatusResponse.java`, `ai-service/src/config.py`, `schema.py`) to formally indicate that readiness requirements for real-world life-safety operations are not yet satisfied.

