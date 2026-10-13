# SlopeGuard Phase 12.6 — Evidence Acquisition and Data Enrichment Plan

**Date:** 2026-10-13  
**Auditor / Engineering Subsystem:** SlopeGuard AI Data Quality, Integrity & Governance Subsystem  
**Pipeline Version:** `2.6.0-evidence-acquisition-planning`  
**Dataset Audit Status:** `PHASE_12_6_EVIDENCE_PLANNING_COMPLETED`  
**Governance Invariants:** `DEMO_NOT_VALIDATED` | `CALIBRATION_DEFERRED` | `UNCALIBRATED_HAZARD_SCORE` | `PENDING_EXPERT_REVIEW`  

---

## Executive Summary

Phase 12.5 established that while SlopeGuard's 368-event historical landslide dataset and geospatial pipelines function properly from a software perspective, **the dataset is not yet suitable for scientific model evaluation, operational probability calibration, or official early-warning deployment**.

The primary scientific blockers are:
1. **0 of 368 events possess an intraday failure timestamp** (100% are calendar-date only).
2. **364 of 368 events (98.91%) rely on approximate town or district centroid coordinates** (only 4 are exact GPS points).
3. **97 events (26.36%) exhibit DEM slope < 10° (and 54 < 5°)** due to valley-bottom geocoding.
4. **0 verified non-landslide (negative control) samples exist** (the inventory is presence-only).
5. **Border and administrative metadata ambiguities remain** for Events 241, 3943, 1111, and 3619.

**Phase 12.6 establishes an evidence-backed roadmap to acquire the necessary empirical data to resolve these gaps without mutating raw catalog records, fabricating synthetic negatives, or modifying the prototype AI model.**

---

## 1. Audit of Existing Data Gaps

| Data Dimension | Current Inventory Status | Root Cause & Scientific Impact |
|---|---|---|
| **Event Failure Times** | 0 / 368 non-null (`event_time` is 100% NaN) | NASA GLC extracted only calendar dates. Pre-failure triggering rainfall cannot be distinguished from post-failure storm accumulation. |
| **Coordinate Precision** | 4 exact (1.09%), 48 at 1 km, 122 at 5 km, 56 at 10 km, 64 at 25 km, 52 at 50 km, 22 coarse/unknown | Geocoded to regional towns or highway milestones. Coordinates do not locate the physical failure crown or scarp. |
| **Terrain Representativeness** | Mean slope = 18.80°; 54 events < 5.0°; 97 events < 10.0° | Valley-floor geocoding smooths mountainous topography. Copernicus DEM 30m pixel slope at town centroid underestimates scarp slope (typically 35°–45°). |
| **Rainfall Temporal Window** | Window A (Same-Day) has lookahead leakage; Window B (ends 00:00 UTC) is a conditional heuristic | Without event hour, Window B includes post-event rain for early morning slides (00:00–05:30 IST) and omits pre-event rain for afternoon slides. |
| **Outcome Labels & Controls** | 368 positives ($y=1$), 0 verified negatives ($y=0$) | Presence-only dataset. Binary classifiers cannot be trained without arbitrary pseudo-negatives; ROC-AUC and precision metrics are ungrounded. |
| **Administrative Boundaries** | 385 source confirmed, 41 conflicting metadata, 14 verified, 2 pending | Point-in-polygon assignment used GADM Level 1 (third-party academic data). Events 241, 3943, 1111, and 3619 remain disputed near state borders. |

---

## 2. Evidence Source Investigation & Source Register

The full source assessment is compiled in [PHASE_12_6_SOURCE_REGISTER.csv](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/PHASE_12_6_SOURCE_REGISTER.csv). Sources are strictly partitioned into those **actually accessed and verified in the repository** versus those **proposed for future investigation**:

```
========================================================================================
Source Name                            Access Status       Licence / Legal Terms
========================================================================================
NASA Global Landslide Catalog (GLC)    ACTUALLY ACCESSED   NASA Open Data (Public Domain)
GADM Level 1 India Boundaries v4.1     ACTUALLY ACCESSED   GADM Open Academic Licence
Copernicus DEM GLO-30 (30m DSM)        ACTUALLY ACCESSED   Copernicus Open Access Licence
Open-Meteo ERA5-Land Reanalysis        ACTUALLY ACCESSED   ECMWF CC BY 4.0 via Open-Meteo
----------------------------------------------------------------------------------------
GSI Bhukosh & NLSM Portal              PROPOSED (FUTURE)   Govt. of India NDSAP / GSI Terms
Survey of India Online Maps Portal     PROPOSED (FUTURE)   Govt. of India National Map Policy
Assam SDMA (ASDMA) DRIMS / Bulletins   PROPOSED (FUTURE)   Govt. of Assam Public Bulletins
Sikkim SDMA (SSDMA) Incident Logs      PROPOSED (FUTURE)   Govt. of Sikkim Public Records
Copernicus Sentinel-1 SAR & Sentinel-2 PROPOSED (FUTURE)   Copernicus Open Access Policy
Internet Archive Wayback Machine (GLC) PROPOSED (FUTURE)   Public Web Archive / Fair Use
========================================================================================
```

### Detailed Investigation of Proposed Sources:

1. **Geological Survey of India (GSI) Bhukosh & NLSM (`https://bhukosh.gsi.gov.in/Bhukosh/Public`):**
   - *Feasibility:* High. GSI is the nodal agency for landslide studies in India. Its National Landslide Susceptibility Mapping (NLSM) program covers 4.3 lakh sq. km across 1:50,000 scale maps.
   - *Expected Evidence:* Field-mapped landslide polygons, lithological formation boundaries, geotechnical parameters, and scarp locations.
   - *Access Conditions & Limitations:* Web viewer is public, but downloading GIS shapefiles requires Indian registration. Post-monsoon field reports vary in temporal detail.

2. **State Disaster Management Authorities (ASDMA & SSDMA):**
   - *Feasibility:* Moderate. ASDMA operates DRIMS (`drims.veldev.com`) and publishes daily monsoon incident bulletins. SSDMA coordinates disaster logs along the NH10 corridor.
   - *Expected Evidence:* Daily incident logs frequently record whether road blockages occurred in early morning, afternoon, or evening, and reference highway mile markers (chainage).
   - *Limitations:* Historical records (2007–2014) are often in unstructured PDF bulletins requiring manual document review.

3. **Internet Archive Wayback Machine for Original GLC News Links:**
   - *Feasibility:* High. 366 of the 368 retained events have documented source URLs in the raw catalog (e.g., E-Pao, Morung Express, Assam Tribune, Telegraph India).
   - *Expected Evidence:* News articles frequently state: *"A massive landslide occurred at 4:30 AM today, blocking NH-39 near Zubza."* Recovering the original text can resolve exact failure times and road milestones without field surveys.
   - *Limitations:* Some hyper-local websites may have experienced link-rot or were omitted from web crawlers.

4. **Copernicus Sentinel-1 (SAR) and Sentinel-2 (Multispectral Optical):**
   - *Feasibility:* Moderate to High for post-2015 events.
   - *Expected Evidence:* 10m–20m optical change detection (Normalized Difference Vegetation Index drop) and SAR coherence change for scarp delineation and unfailed slope verification.
   - *Limitations:* Sentinel-1 was launched in April 2014; Sentinel-2 in June 2015. Pre-2014 events cannot be audited with Sentinel data. Optical scenes during monsoon months suffer heavy cloud cover.

5. **Survey of India (SOI) Online Maps Portal (`https://onlinemaps.surveyofindia.gov.in/`):**
   - *Feasibility:* High. The constitutional mapping authority for India.
   - *Expected Evidence:* Legally binding state and district boundaries, 1:50,000 Open Series Maps (OSM), and official topographical contours.
   - *Limitations:* Bulk automated downloads are restricted; requires citizen registration with Indian credentials.

---

## 3. Event Evidence Priority List

All 368 accepted events have been prioritized in [PHASE_12_6_EVENT_PRIORITY.csv](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/PHASE_12_6_EVENT_PRIORITY.csv). Events are stratified into four evidence tiers:

```
========================================================================================
Priority Tier                          Event Count   Confidence   Dominant Action
========================================================================================
TIER 1: High Recovery Potential                 52   HIGH         Wayback Machine / local news
TIER 2: Moderate Recovery Potential            177   MEDIUM       GSI Bhukosh / Sentinel-2
TIER 3: Coarse Regional Centroid               136   LOW          Preserve coarse; do not train
TIER 4: Border Unresolved Cases                  3   LOW          SDMA / inter-state corridor
----------------------------------------------------------------------------------------
TOTAL ACCEPTED NER INVENTORY                   368   --           
========================================================================================
```

### Strategic Tier Actions:
- **Tier 1 (52 events):** Records with exact GPS or 1 km coordinates and active media links (e.g., E-Pao in Manipur, Morung Express in Nagaland). Priority: Query archived news articles to extract failure hour and local road milestone.
- **Tier 2 (177 events):** Records with 5 km to 10 km town/block coordinates. Priority: Match against GSI Bhukosh 1:50K inventory and evaluate Sentinel-2 optical change detection.
- **Tier 3 (136 events):** Records with 25 km to 50 km district centroid coordinates. Priority: Retain for regional inventory tracking; **strictly exclude from pixel-level slope or antecedent rainfall model training**.
- **Tier 4 (3 events — Events 241, 3943, 3619):** Explicitly disputed border edge cases. Retain existing caution statuses (`PENDING_GEOGRAPHIC_VERIFICATION` and `CONFLICTING_SOURCE_METADATA`). Do not force state assignments.

---

## 4. Defensible Negative-Control Research Plan

> [!CAUTION]
> **No negative samples should be created at this time.** Creating arbitrary random background points or sampling flat valley pixels will introduce severe sampling bias, artificially inflating model accuracy metrics.

A future study must adopt a geomorphologically grounded negative-control protocol:

### 4.1 Definition of a Non-Landslide Observation
A valid negative sample is **not** simply an absence of news coverage. A valid negative must satisfy:
1. **Physical Geomorphological Feasibility:** Located on a hilly or mountainous slope ($> 15^\circ$) with susceptible lithology and soil mantle.
2. **Comparable Meteorological Exposure:** Exposed to the identical monsoon rainfall event (triggering threshold) as nearby confirmed landslides in the same hydrological catchment.
3. **Verified Absence of Failure:** Documented via remote sensing (e.g., cloud-free pre/post Sentinel-2 NDVI difference $\approx 0$, or Sentinel-1 InSAR coherence retention) or GSI post-monsoon field inventory confirming no mass movement occurred.

### 4.2 Spatial & Temporal Unit
- **Slope Units (Not Pixels):** Partition terrain into hydrologically and topographically bounded **slope units** (derived from watershed sub-basins) rather than arbitrary 30m grid pixels.
- **Defined Observation Period:** Evaluate slope units across discrete, defined monsoon seasons (e.g., June 1 to September 30 of a specific year), pairing each slope unit's cumulative rainfall with its stability outcome.

### 4.3 Preventing Sampling Bias and Spatial Leakage
- **Spatial Buffering:** Negative slope units must be separated from positive landslide scars by a minimum buffer (e.g., 2 km) to avoid transitional slide margins.
- **Spatial Block Cross-Validation:** Training and test folds must be divided into geographically isolated spatial blocks (e.g., 50 km $\times$ 50 km tiles or distinct river basins) to prevent spatial autocorrelation leakage.
- **Balanced Class Weighting:** If the natural prevalence of landslides per slope unit is low (e.g., 1:50), use appropriate cost-sensitive losses or PR-AUC metrics rather than uncalibrated 50/50 synthetic balance.

---

## 5. Data Readiness Gates

A separate AI model evaluation phase cannot begin until the dataset passes all six evidence gates:

```
+---------------------------------------------------------------------------------------+
| GATE 1: SCAR-LEVEL SPATIAL PRECISION                                                  |
| >= 80% of evaluation events must possess verified scarp-level coordinates             |
| (uncertainty <= 100 meters) confirmed via GPS, GSI atlas, or satellite imagery.       |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| GATE 2: VERIFIED TEMPORAL ALIGNMENT                                                    |
| >= 80% of evaluation events must possess confirmed intraday failure times             |
| (precision <= 3 hours), ensuring antecedent rainfall is strictly pre-failure.         |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| GATE 3: TOPOGRAPHIC FIDELITY                                                          |
| All evaluation points must possess slope and aspect extracted from the physical scarp |
| crown / rupture surface (eliminating valley-floor centroid slope distortions).        |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| GATE 4: INDEPENDENT NEGATIVE CONTROLS                                                 |
| A set of verified non-landslide slope units exposed to comparable rainfall must be   |
| assembled and peer-reviewed by an engineering geologist.                              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| GATE 5: SPATIALLY & TEMPORALLY INDEPENDENT EVALUATION SPLIT                           |
| Evaluation must use spatial-block or temporal holdout folds (e.g., evaluating on a    |
| subsequent monsoon season or unobserved basin) with zero test-set leakage.            |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| GATE 6: EXPERT REVIEW SIGN-OFF                                                        |
| Data lineage, feature engineering, and labeling protocols must receive formal written |
| sign-off from domain experts (GSI / geotechnical engineering reviewers).              |
+---------------------------------------------------------------------------------------+
```

---

## 6. Deliverables Summary

1. [PHASE_12_6_EVIDENCE_ACQUISITION_PLAN.md](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/PHASE_12_6_EVIDENCE_ACQUISITION_PLAN.md): Root plan report.
2. [PHASE_12_6_EVIDENCE_ACQUISITION_PLAN.md (reports dir)](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/ai-service/data/reports/PHASE_12_6_EVIDENCE_ACQUISITION_PLAN.md): Identical archive copy.
3. [PHASE_12_6_SOURCE_REGISTER.csv](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/PHASE_12_6_SOURCE_REGISTER.csv): 10-row register with URLs, licences, access status, coverage, and limitations.
4. [PHASE_12_6_EVENT_PRIORITY.csv](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/PHASE_12_6_EVENT_PRIORITY.csv): 368-row event prioritization table with 4 evidence tiers.
5. [test_phase_12_6_planning.py](file:///c:/Users/sakth/OneDrive/Desktop/SlopeGuard/ai-service/tests/test_phase_12_6_planning.py): Automated test suite verifying schema, joins, tiers, border cases, and governance constraints.

---

## 7. Automated Integrity Checks vs. Scientific Validation

- **Automated Integrity Checks (Pytest 96/96 passing):** Confirm that files exist, schemas match, primary keys are unique, joins are referentially sound, and manifests are cryptographically verified.
- **Scientific Validation (NOT ACHIEVED):** Requires empirical ground truth: field-verified rupture crowns, hourly failure records, geomorphological slope units, and unbiased negative sampling. Software correctness is a necessary prerequisite, not a substitute for scientific validity.

---

## 8. Safety Governance Invariants Preserved

All four governance flags remain permanently active across manifests, backend DTOs, and API responses:
- `DEMO_NOT_VALIDATED`
- `CALIBRATION_DEFERRED`
- `UNCALIBRATED_HAZARD_SCORE`
- `PENDING_EXPERT_REVIEW`
- `DATA_READINESS_STATUS`: `DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`
