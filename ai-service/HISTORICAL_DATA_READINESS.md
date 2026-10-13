# SlopeGuard AI — Historical Dataset Inventory & Data Readiness Report

**Module:** `ai-service`  
**Phase:** 11 — Historical AI Model Validation & Calibration  
**Document Version:** 1.0.0  
**Status:** **DATASET INSUFFICIENT FOR OPERATIONAL VALIDATION**  
**Governance Designation:** **`DEMO_NOT_VALIDATED`**  

---

## 1. Executive Summary

A machine-learning model deployed for geotechnical hazard estimation cannot be scientifically validated without extensive, high-quality, field-verified historical data. 

This report documents the inventory of permitted historical landslide, hydrometeorological, and topographic datasets relevant to **Northeast India** (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Mizoram, Manipur, and Tripura).

### Key Findings
1. **Inventory Completeness Gap:** Field-verified landslide catalogs for Northeast India are sparse, geographically biased toward major transit corridors (e.g., NH-40, NH-44), and lack verified negative observations in remote hill tracts.
2. **Temporal Fuzziness:** Many public media-reported landslide events lack exact trigger timestamps, recording only day or multi-day intervals. This limits exact matching with sub-daily precipitation peaks.
3. **Absence of Negative Ground Truth:** The absence of a recorded landslide in remote hill tracts does **not** signify slope stability ("absence of record $\neq$ absence of landslide"). Generating random negative points in unmonitored forests introduces label contamination.
4. **Readiness Verdict:** Available open historical data is insufficient to certify the model for operational or life-safety use. In accordance with scientific integrity guidelines, the model remains **`DEMO_NOT_VALIDATED`**, probability calibration is **`DEFERRED`**, and candidate risk thresholds remain **`PENDING_EXPERT_REVIEW`**.

---

## 2. Permitted Data Source Inventory

| Data Source | Managing Agency / Origin | License / Access Terms | Geographic & Temporal Coverage | Spatial Resolution | Key Limitations |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NASA Global Landslide Catalog (GLC)** | NASA Goddard Space Flight Center | Open Data (Public Domain / CC0) | Global (Northeast India subset: ~2007–2020) | Point coordinates (estimated radius 1–25 km) | Biased toward populated corridors and English news media; trigger timestamps often approximate to the day. |
| **GSI Bhukosh Landslide Inventory** | Geological Survey of India (GSI), Ministry of Mines | Government Open Access (View-only / Research request required for bulk download) | National India (1:50,000 scale); comprehensive in Sikkim, Western Ghats, Meghalaya | Polyline / Polygon / Point | Raw bulk GIS layers require formal institutional access request; not licensed for open commercial redistribution. |
| **NRSC Landslide Atlas of India** | National Remote Sensing Centre (NRSC / ISRO), Dept. of Space | View-only via Bhuvan Geo-portal; published atlas (2023) | 147 landslide-affected districts across India (1998–2022) | District-level risk ranking; selected event polygons | Aggregated index data; raw time-series event coordinates require institutional authorization. |
| **Open-Meteo Historical Weather API (ERA5 Reanalysis)** | ECMWF / Open-Meteo GmbH | Creative Commons Attribution 4.0 (CC BY 4.0) | Global coverage from 1940 to present | ~0.1° (~11 km) gridded reanalysis | Modeled atmospheric reanalysis, not direct on-site physical rain gauge telemetry; complex mountain topography can smooth localized convective cells. |
| **Copernicus DEM GLO-30** | European Space Agency (ESA) / Airbus | Open Access under Copernicus Open Data Policy | Global; Northeast India tile coverage | 30-meter grid cell | Topographic representation captured at satellite pass; does not capture recent anthropogenic slope excavation or road-widening cuts. |

---

## 3. Data Integrity & Validation Pipeline

To ensure reproducibility, any ingested dataset must pass through the `DatasetValidator` pipeline:

```
[ Raw Event Records ]
        │
        ▼
[ 1. Schema & Column Check ] ──> Must contain record_id, lat, lon, timestamp, target, etc.
        │
        ▼
[ 2. Coordinate Validation ] ──> WGS84 bounds check; regional bounds [20°N–30°N, 88°E–98°E].
        │
        ▼
[ 3. Physical Feasibility ]  ──> rainfall_24h >= 0.0, slope in [0°, 90°], rainfall_72h >= rainfall_24h.
        │
        ▼
[ 4. Deduplication ]         ──> Unique (latitude, longitude, observation_timestamp).
        │
        ▼
[ 5. Anti-Commingling ]      ──> Strict separation between real observations and synthetic fixtures.
        │
        ▼
[ 6. Non-Leakage Weather ]   ──> Historical antecedent precipitation matched strictly BEFORE event_timestamp.
        │
        ▼
[ Validated Dataset Artifact & SHA-256 Fingerprint ]
```

---

## 4. Methodological Challenges & Ethical Directives

### 4.1 The Negative Sampling Dilemma
Supervised classification requires both positive examples ($y = 1$) and negative examples ($y = 0$).
- In medical or credit scoring, negatives are directly observed non-events.
- In geohazards, an inventory catalogs **where failures occurred**. It rarely catalogs surveyed, instrumented slopes that remained completely stable under identical heavy rain.
- **DANGER:** Sampling random coordinates in dense forest tracts as $y=0$ creates false negatives because unmonitored slopes frequently suffer undetected slides.
- **Strategy:** Stable reference sites must be explicitly verified or paired with low-slope valley terrains where landslides are physically impossible, and clear uncertainty bounds must be reported.

### 4.2 Look-Ahead Leakage Prevention
When matching historical weather:
- Cumulative 24-hour and 72-hour rainfall must be calculated strictly from the hours $[T - 72\text{h}, T)$ and $[T - 24\text{h}, T)$, where $T$ is the recorded failure time.
- Any observation after $T$ is strictly excluded.

### 4.3 Orographic Rainfall Resolution
Satellite reanalysis (ERA5 at ~11 km grid) smooths localized microclimatic precipitation spikes. In the Khasi Hills (e.g., Cherrapunji / Mawsynram), rainfall can exceed 300 mm in a narrow valley while a station 10 km away records 60 mm. The pipeline explicitly attaches an attribution note documenting this spatial limitation.

---

## 5. Current Data Readiness Level (DRL)

SlopeGuard adopts NASA/NOAA Data Readiness Levels:

| Readiness Level | Definition | Current Status |
| :--- | :--- | :--- |
| **DRL 1** (Conceptual) | Feature schema and data dictionary designed. | **ACHIEVED** |
| **DRL 2** (Pipeline Tested) | Reproducible ingestion, validation, and anti-leakage splitting code verified. | **ACHIEVED** |
| **DRL 3** (Curated Prototype) | Open historical catalog sample with matched ERA5 rainfall ingested. | **ACHIEVED** (Demonstration scale) |
| **DRL 4** (Benchmarked) | Multi-year verified regional inventory (>500 events) across full monsoon cycles. | **BLOCKED** (Awaiting official GSI/NRSC agency partnership) |
| **DRL 5** (Operational Readiness)| Real-time calibrated sensor networks + field telemetry. | **FUTURE WORK** |

---

## 6. Scientific Governance Directive

Because DRL 4 has not been satisfied:
1. **Model Status:** Must remain **`DEMO_NOT_VALIDATED`**.
2. **Output Type:** Must be clearly described as an **`UNCALIBRATED_HAZARD_SCORE`** ($0.00$ to $1.00$).
3. **Probability Calibration:** Must remain **`DEFERRED`**.
4. **Risk Thresholds:** Must remain **`PENDING_EXPERT_REVIEW`**.
5. **No Automatic Emergency Alerts:** The system must never trigger civil-protection evacuations or public emergency sirens.
