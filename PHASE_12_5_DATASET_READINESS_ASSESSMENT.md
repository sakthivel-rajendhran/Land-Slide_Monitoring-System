# SlopeGuard Phase 12.5 — Historical Dataset Readiness and Evidence Audit Report

**Date:** 2026-10-13  
**Auditor / Engineering Subsystem:** SlopeGuard AI Data Quality, Integrity & Governance Subsystem  
**Pipeline Version:** `2.5.0-dataset-readiness-audit`  
**Dataset Audit Status:** `PHASE_12_5_DATASET_READINESS_AUDITED`  
**Governance Invariants:** `DEMO_NOT_VALIDATED` | `CALIBRATION_DEFERRED` | `UNCALIBRATED_HAZARD_SCORE` | `PENDING_EXPERT_REVIEW`  

---

## 1. Concise Readiness Verdict

> [!WARNING]
> ### READINESS VERDICT: NOT SUITABLE FOR SCIENTIFIC MODEL EVALUATION
> **Current Status:** `DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`  
> 
> The current 368-event historical dataset represents a major advancement in data acquisition, schema standardization, terrain extraction (Copernicus DEM GLO-30), rainfall feature assembly (ERA5-Land reanalysis), and geographic ledger tracking. **However, it is NOT scientifically suitable for training, evaluating, or calibrating an operational landslide early-warning model.**
> 
> **Primary Blocking Deficiencies:**
> 1. **Complete Absence of Intraday Event Timestamps:** 100% (368/368) of events lack time of day (`event_time` is null in the NASA catalog). As a result, genuine pre-failure antecedent rainfall cannot be isolated without potential lookahead leakage.
> 2. **Pervasive Centroid & Valley Geocoding:** 98.91% (364/368) of events have coarse spatial accuracy (1 km to 100 km). Only 4 events (1.09%) have exact coordinates. 26.36% of coordinates exhibit DEM slopes < 10° (and 14.67% < 5°), reflecting municipal, road, or valley-floor geocoding rather than actual landslide scarps.
> 3. **Presence-Only (Zero Negatives) Sampling Bias:** The dataset consists solely of positive landslide occurrences (368 positives, 0 verified negatives). Training classification models or computing ROC-AUC, precision, recall, or calibrated probabilities is mathematically and epidemiologically invalid without verified non-landslide controls.
> 4. **Boundary Dataset Provenance Limitation:** Point-in-polygon verification utilized GADM v4.1 (a third-party academic resource), which provides polygon intersection checks but does not constitute constitutional boundary adjudication from the Survey of India.

---

## 2. Evidence-Backed Inventory & Provenance Counts

Direct analysis of repository assets (`ai-service/data/processed/`, `ai-service/data/raw/`, and manifests) yields the following evidence-backed findings:

### 2.1 File & Record Traceability
| Dataset Asset | Workspace File Path | Records | Unique Event IDs | Integrity / Traceability Status |
|---|---|---|---|---|
| **Raw NASA Export** | `ai-service/data/raw/Global_Landslide_Catalog_Export_rows.csv` | 11,033 | 11,033 | 100% traceable raw catalog export |
| **Processed NER Events** | `ai-service/data/processed/historical_landslide_events_ner.csv` | 368 | 368 | 100% trace to raw catalog IDs |
| **Rainfall Features v3** | `ai-service/data/processed/historical_rainfall_features_ner_v3.csv` | 368 | 368 | 100% 1-to-1 join with NER events |
| **Terrain Features v2** | `ai-service/data/processed/terrain_features_ner_v2.csv` | 368 | 368 | 100% 1-to-1 join with NER events |
| **Geographic Ledger** | `ai-service/data/processed/geographic_verification_ledger.csv` | 442 | 442 | Covers 368 accepted + 74 excluded candidates |
| **GADM Boundary File** | `ai-service/data/raw/india_state_boundaries_gadm.geojson` | 36 features | N/A | GADM Level 1 India (WGS 84, SHA-256 verified) |

### 2.2 Geographic Ledger Verification Status Summary
Direct recalculation across all 442 candidate records:

```
========================================================================================
Verification Status              Accepted (NER 368)   Excluded (Corridor 74)   Total 442
========================================================================================
SOURCE_LABEL_CONFIRMED                          313                       72         385
CONFLICTING_SOURCE_METADATA                      39                        2          41
GEOGRAPHICALLY_VERIFIED                          14                        0          14
PENDING_GEOGRAPHIC_VERIFICATION                   2                        0           2
----------------------------------------------------------------------------------------
TOTAL CANDIDATES                                368                       74         442
========================================================================================
```

### 2.3 Unresolved Discrepancies and Border Cases
1. **Event 241 (Sikkim):** Coordinates `(27.2341, 88.5085)` fall within the Sikkim polygon, but the location accuracy is **50 km**. A 50 km circle around this point covers Kalimpong and Darjeeling districts in West Bengal. Retained as `PENDING_GEOGRAPHIC_VERIFICATION`.
2. **Event 3943 (Sikkim):** Coordinates `(27.1478, 88.4988)` with **10 km** accuracy lie within 3 km of the southern boundary in the Teesta corridor. Retained as `PENDING_GEOGRAPHIC_VERIFICATION`.
3. **Event 1111 (West Bengal Excluded):** Catalog title reads *"Melli Chalisey, Sikkim"*, coordinates fall in Sikkim, but the raw administrative label is `Bengal`. Retained as `CONFLICTING_SOURCE_METADATA` in the excluded corridor list.
4. **Event 3619 (Sikkim Accepted):** Catalog title reads *"Birik (cut off Sikkim)"*, but Birik Dara is physically located in Kalimpong district (West Bengal). Coordinates point to Mangan centroid (North Sikkim). Retained as `CONFLICTING_SOURCE_METADATA` in accepted NER 368.

---

## 3. Rainfall Validity and Leakage Assessment

### 3.1 Intraday Timestamp Analysis
- **Total retained events:** 368
- **Events with non-null `event_time` in catalog:** **0 (0.00%)**
- **Events with only calendar date (`event_date`):** **368 (100.00%)**
- **Catalog time precision:** `DATE_ONLY`

### 3.2 Dual Rainfall Window Comparison

| Window Parameter | Window A: Same-Day Inclusive | Window B: Strictly Prior UTC |
|---|---|---|
| **Definition** | Includes all rainfall on the calendar event date (Day $D$ $00:00$ to $23:59$ UTC) | Ends at $00:00$ UTC on Day $D$ ($05:30$ IST morning of event date) |
| **Duration** | 24-hour and 72-hour cumulative | 24-hour and 72-hour cumulative |
| **Rainfall Source** | ECMWF ERA5-Land Reanalysis (via Open-Meteo) | ECMWF ERA5-Land Reanalysis (via Open-Meteo) |
| **Units & Missingness** | Millimeters (mm), 0 missing values | Millimeters (mm), 0 missing values |
| **Leakage Status** | **`POTENTIAL_LOOKAHEAD_LEAKAGE`** (368 / 368 records) | **`CONDITIONAL_PRIOR_WINDOW`** (368 / 368 records) |
| **Scientific Assessment** | Severe target leakage. If a landslide occurred at 10:00 AM, heavy downpours occurring at 3:00 PM or 9:00 PM on the same day are included, falsely predicting an event with post-event rain. | Conditional heuristic. Because 00:00 UTC corresponds to 05:30 AM IST, lookahead cannot be ruled out if the failure occurred in early morning hours (00:00 to 05:30 IST). Conversely, for afternoon events, 10–12 hours of trigger rainfall are lost. |

> [!IMPORTANT]
> **Scientific Finding:** Window B cannot be declared "leakage-free." Without intraday timestamps (hourly failure times), true antecedent trigger rainfall cannot be disentangled from post-failure precipitation.

---

## 4. Geographic and Terrain Uncertainty Assessment

### 4.1 Positional Accuracy Quantification
Positional accuracy distribution across the 368 retained historical events from raw NASA metadata:

```
========================================================================
Location Accuracy Category     Count    Percentage   Characterization
========================================================================
exact                              4         1.09%   GPS / precise point
1km                               48        13.04%   Local village / road
5km                              122        33.15%   Town / valley centroid
10km                              56        15.22%   Block / sub-district
25km                              64        17.39%   District centroid
50km                              52        14.13%   Broad regional centroid
100km                              1         0.27%   Coarse regional marker
unknown                           21         5.71%   Unspecified coordinates
------------------------------------------------------------------------
TOTAL                            368       100.00%   
========================================================================
```

- **Exact coordinates:** Only 4 of 368 records (1.09%).
- **Approximate or coarse coordinates (≥ 1 km):** 364 of 368 records (98.91%).

### 4.2 Low-Slope Anomaly in Copernicus GLO-30 DEM
Extracting 30m resolution terrain parameters at the catalog coordinates reveals a significant physical anomaly:

- **Mean slope across dataset:** 18.80°
- **Maximum slope:** 55.54°
- **Events with slope < 10.0°:** **97 records (26.36%)**
- **Events with slope < 5.0°:** **54 records (14.67%)**
- **Events with slope = 0.0°:** **2 records (0.54%)**

### 4.3 Why Low Slopes Do NOT Mean False Landslides
In mountainous Northeast India, news reporters and administrative officers typically geocode landslides to the nearest named settlement, administrative office, police station, or highway milestone in the valley bottom. 
- A point placed in the valley floor of Shillong, Guwahati, or Gangtok has an authentic 30m DEM slope of 2°–5°.
- The actual landslide scarp was located 1 km to 5 km uphill on a 35°–45° mountain slope.
- Therefore, **the 30m DEM slope at the catalog coordinates misrepresents the physical failure surface.**
- Critical scientific rule: **Do not discard low-slope records as "false" landslides, and do not fabricate flat-slope negative samples based on them.**

---

## 5. Label Quality and Sampling Bias

### 5.1 Presence-Only Nature of Inventory
The dataset is exclusively a **presence-only inventory** ($y = 1$ for all 368 events):
- The NASA Global Landslide Catalog records landslides from media reports, disaster management agencies, and humanitarian organizations.
- It does **not** record negative instances (slopes that did not fail during heavy rainfall events).
- There are **0 verified negative non-landslide samples** in the repository.

### 5.2 Methodological Consequences for Machine Learning
Attempting to train a supervised binary classifier (e.g., Random Forest, Logistic Regression, XGBoost) directly on presence-only data introduces severe mathematical and operational hazards:

1. **Ill-Posed Classification Objective:** Without true negative instances, a binary loss function cannot be minimized without generating synthetic/pseudo-negatives.
2. **Pseudo-Negative Contamination:** Generating "random background points" or selecting non-event dates risks sampling unrecorded landslides or slopes that were on the verge of failure, contaminating training with false negatives.
3. **Invalid Discriminative Metrics:** Metrics such as ROC-AUC, Precision, Recall, F1-score, and Brier Score depend strictly on true negative rates and prevalence. On presence-only or synthetic-negative data, these metrics are illusions of performance.
4. **Uncalibrated Probabilities:** A model trained on arbitrary positive-to-negative sampling ratios produces uncalibrated output scores that cannot be interpreted as real-world occurrence probabilities.

---

## 6. Boundary Dataset Documentation & Authority Distinction

| Attribute | Specification |
|---|---|
| **Boundary Source** | GADM (Database of Global Administrative Areas) Level 1 India (`ind_admin1`) |
| **Version & Release** | GADM v4.1 (released 2022) |
| **Licence** | GADM Open Academic and Research Non-Commercial Licence |
| **Coordinate Reference System** | WGS 84 (`EPSG:4326`), angular coordinates |
| **Local File Location** | `ai-service/data/raw/india_state_boundaries_gadm.geojson` (21.95 MB) |
| **SHA-256 Checksum** | `48769e32911313a4e741ebcdfb1359bd73ba7be3123cfad1bd10b3edf6e3d4cb` |

### Distinction Between Third-Party and Official Boundaries
- **Third-Party Research Data (GADM):** Suitable for preliminary geospatial filtering, regional bounding, and spatial data science checks.
- **Constitutional Authority (Survey of India):** Under the National Map Policy and Government of India regulations, the Survey of India (SOI) is the sole constitutional authority for official state and national boundaries. GADM boundaries do not represent legally binding or officially recognized administrative demarcations.

---

## 7. Prioritized Roadmap Before Model Evaluation

Before any AI model can be trained or evaluated for operational landslide early-warning in Northeast India, the following prioritized evidence must be gathered:

```
+---------------------------------------------------------------------------------------+
| PRIORITY 1: INTRADAY EVENT TIMESTAMPS                                                  |
| Source GSI, NDMA, and local state disaster management (SDMA) incident logs with       |
| exact hour of failure to eliminate rainfall lookahead leakage.                        |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PRIORITY 2: SCAR-LEVEL SPATIAL PRECISION                                               |
| Cross-reference coarse catalog coordinates with high-resolution satellite imagery     |
| (Sentinel-2, PlanetScope) and GSI landslide inventory maps to pinpoint rupture crowns.|
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PRIORITY 3: SYSTEMATIC NON-LANDSLIDE (NEGATIVE) SAMPLING                              |
| Establish geotechnical control slopes (slopes that did not fail during identical      |
| monsoon rainfall events) using slope units or catchments, not random points.          |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PRIORITY 4: GEOTECHNICAL & LITHOLOGICAL COVARIATES                                    |
| Integrate official GSI Geological Quadrangle Maps (lithology, shear strength) and      |
| soil depth models rather than relying solely on precipitation and elevation.          |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| PRIORITY 5: INDEPENDENT TEMPORAL & SPATIAL EVALUATION DESIGN                           |
| Design spatial-block and temporal cross-validation schemes that test generalizability  |
| across unobserved catchments and future monsoon seasons without data leakage.         |
+---------------------------------------------------------------------------------------+
```

---

## 8. Separation of Automated Checks from Scientific Validation

- **Automated Integrity Checks (Pytest 89/89 passing):**
  - Verify file presence, schema conformity, primary key uniqueness, foreign key consistency, and manifest checksum alignment.
  - Confirm algorithmic execution of ray-casting point-in-polygon assignment.
- **Scientific Validation (NOT ACHIEVED):**
  - Requires empirical ground-truth scarp identification, validated antecedent hydro-meteorological triggering conditions, unbiased negative sampling, and peer-reviewed geotechnical validation.
  - A passing software test suite demonstrates reproducible code execution, **not geological or operational warning readiness.**

---

## 9. AI Governance Flags Preserved

The prototype remains strictly governed by the four mandatory safety banners:
- `DEMO_NOT_VALIDATED`
- `CALIBRATION_DEFERRED`
- `UNCALIBRATED_HAZARD_SCORE`
- `PENDING_EXPERT_REVIEW`
