# SlopeGuard AI Feature Store — Data Dictionary

**Module:** `ai-service` (Phase 6: AI Model Development)  
**Status:** **PROVISIONAL SPECIFICATION / SYNTHETIC TEST FIXTURES ONLY**  
**Classification:** Experimental Prototype (Not certified for real-world disaster warnings)

---

## 1. Overview & Data Philosophy

Landslide initiation is a coupled geotechnical and hydrometeorological process. A machine learning model requires two broad classes of features:
1. **Static Susceptibility Features:** Intrinsic terrain factors that dictate slope vulnerability (e.g., gradient, lithology, elevation).
2. **Dynamic Trigger Features:** Transient hydrometeorological stresses (e.g., cumulative antecedent precipitation over 24h, 72h, or 10-day windows).

> [!CAUTION]
> **Scientific Integrity Directives:**
> - **Zero Fabrication:** Synthetic fixtures must never be commingled with real observations or presented as historical fact.
> - **Absence of Record != Absence of Landslide:** Remote hill tracts often lack field survey coverage. An unrecorded slope is *not* guaranteed to have experienced zero deformation.
> - **No Temporal Leakage:** Training sets must strictly precede test sets chronologically, or be partitioned by distinct non-overlapping geographic watersheds (spatial holdout).

---

## 2. Feature Schema & Column Definitions

| Column Name | Data Type | Requirement Level | Unit | Valid Range | Description & Semantics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `record_id` | String | Required | Identifier | Alphanumeric | Unique record identifier (e.g., `SYNTH-0001` or `GSI-NE-2023-0104`). |
| `latitude` | Float | Required | Degrees North | `[-90.0, 90.0]` (Regional: `[21.0, 30.0]`) | WGS84 decimal latitude coordinates. |
| `longitude` | Float | Required | Degrees East | `[-180.0, 180.0]` (Regional: `[88.0, 98.0]`) | WGS84 decimal longitude coordinates. |
| `observation_timestamp` | String (ISO-8601) | Required | UTC Timestamp | `YYYY-MM-DDTHH:MM:SSZ` | Date and time of landslide occurrence or non-event baseline observation. |
| `rainfall_24h_mm` | Float | Required | Millimetres (mm) | `[0.0, 1500.0]` | Cumulative precipitation observed in preceding 24 hours. |
| `rainfall_72h_mm` | Float | Required | Millimetres (mm) | `[0.0, 3000.0]` | Cumulative precipitation observed in preceding 72 hours (antecedent moisture trigger). |
| `elevation_m` | Float | Required | Metres (m) | `[-500.0, 9000.0]` | Elevation above mean sea level from digital elevation models (DEM). |
| `slope_deg` | Float | Required | Degrees (°) | `[0.0, 90.0]` | Topographic slope angle calculated from high-resolution DEM. |
| `lithology` | String (Categorical) | Optional | Category | `Sedimentary`, `Metamorphic`, `Igneous`, `Unconsolidated_Debris`, `Unknown` | Dominant rock and geological substrate type. |
| `soil_type` | String (Categorical) | Optional | Category | `Clay_Loam`, `Sandy_Loam`, `Silty_Clay`, `Gravelly_Soil`, `Unknown` | Predominant soil texture class influencing hydraulic conductivity. |
| `vegetation_ndvi` | Float | Optional | Index ratio | `[-1.0, 1.0]` | Normalized Difference Vegetation Index from satellite multispectral imaging. |
| `aspect_deg` | Float | Optional | Degrees (°) | `[0.0, 360.0]` | Compass direction the slope faces (topographic aspect). |
| `landslide_occurred` | Integer (Binary) | Required | Binary flag | `0` or `1` | **Target label**: `1` = Confirmed landslide/debris flow occurrence; `0` = Stable/non-occurrence baseline observation. |
| `is_synthetic` | Boolean | Required | Boolean | `true` or `false` | Distinguishes whether the row is a synthetic engineering fixture (`true`) or verified real field observation (`false`). |
| `data_source` | String | Required | Attribution | String | Provenance entity (e.g., `SYNTHETIC_PIPELINE_FIXTURE_V1`, `GSI_BHUKOSH_ARCHIVE`, `NASA_GLC`). |

---

## 3. Data Integrity & Validation Rules

Any dataset submitted to the training pipeline must satisfy the following assertions:

1. **Coordinate Bounds**:
   - Latitude must be between `-90.0` and `90.0`.
   - Longitude must be between `-180.0` and `180.0`.
   - Out-of-bounds coordinates cause validation rejection.
2. **Physical Feasibility**:
   - `rainfall_24h_mm` and `rainfall_72h_mm` must be `>= 0.0`.
   - `rainfall_72h_mm` must be `>= rainfall_24h_mm`. Any row violating this physical inequality is flagged as corrupt.
   - `slope_deg` must be in `[0.0, 90.0]`. Slopes `< 0.0` or `> 90.0` are physically invalid.
   - `vegetation_ndvi` if present must be within `[-1.0, 1.0]`.
3. **Missing Value Strategy**:
   - `record_id`, `latitude`, `longitude`, `observation_timestamp`, `rainfall_24h_mm`, `slope_deg`, and `landslide_occurred` are **strictly mandatory**. Rows with null values in mandatory columns are rejected.
   - Optional numerical features (`elevation_m`, `rainfall_72h_mm`, `vegetation_ndvi`) are imputed using **median** strategy learned strictly from the training partition.
   - Optional categorical features (`lithology`, `soil_type`) are imputed with the label `'Unknown'` and one-hot encoded.
4. **Duplicate Removal**:
   - Records with identical `(latitude, longitude, observation_timestamp)` are considered duplicates. The first record is retained and subsequent duplicates logged and dropped.
5. **Commingling Prohibition**:
   - Datasets containing both `is_synthetic = true` and `is_synthetic = false` cannot be used for production training without an explicit configuration override (`allow_synthetic_mixture=True`), preventing accidental leakage of test fixtures into real model weights.

---

## 4. Real Data Acquisition Roadmap for Production Phases

To elevate this model from `DEMO_NOT_VALIDATED` to `VALIDATED`, the following genuine regional datasets must be procured and preprocessed:

1. **Historical Landslide Inventories:**
   - **Source:** Geological Survey of India (GSI) Bhukosh portal (1:50,000 scale national landslide inventory).
   - **Coverage:** Northeast India (Assam, Meghalaya, Sikkim, Nagaland, Arunachal Pradesh, Mizoram, Manipur, Tripura) and Western Ghats.
   - **Attributes Required:** Verified slide polygon/point, date of initiation, failure mechanism (debris flow, rockfall, rotational slump).
2. **Digital Elevation Models (DEM):**
   - **Source:** Copernicus DEM GLO-30 (30m spatial resolution) or ALOS World 3D (AW3D30).
   - **Derived Layers:** Slope angle, aspect, plan curvature, topographic wetness index (TWI).
3. **Historical Rainfall Reanalysis / Gauge Records:**
   - **Source:** India Meteorological Department (IMD) gridded rainfall data (0.25° x 0.25°) or Open-Meteo Historical Weather API.
   - **Window Aggregations:** 24-hour peak intensity, 72-hour antecedent rainfall, 7-day cumulative rainfall.
4. **Lithological and Structural Geology:**
   - **Source:** GSI 1:50,000 scale geological maps.
