# SlopeGuard Phase 12.3 — Independent Reconciliation Verification & Data Lineage Audit

**Audit Identifier:** `SG-AUDIT-PHASE-12.3-2026-10-13`  
**Evaluation Scope:** Primary source provenance, diacritic normalization lineage, point-in-polygon boundary methods, 74 excluded corridor records, multi-table join uniqueness, temporal rainfall semantics, DEM sampling representativeness, and manifest integrity.  
**System Governance Classification:** `DEMO_NOT_VALIDATED` &bull; `CALIBRATION_DEFERRED` &bull; `UNCALIBRATED_HAZARD_SCORE` &bull; `PENDING_EXPERT_REVIEW`  
**Operational Status:** Prototype Research System — Strictly non-operational. Passing automated tests demonstrates software integrity only; it does not constitute scientific or operational hazard validation.

---

## 1. Executive Summary & Verification Taxonomy

This Phase 12.3 audit independently re-evaluated the Phase 12.2 dataset reconciliation by executing fresh, un-hardcoded programmatic checks directly against the primary raw catalog export (`Global_Landslide_Catalog_Export_rows.csv`), the processed event inventory (`historical_landslide_events_ner.csv`), the versioned feature tables, and the raster grids.

In strict accordance with audit guidelines, findings are segregated into five explicit categories:
1. **Independently Verified Results:** Assertions proven by direct recalculation from source bytes.
2. **Reproduced Script Results:** Pipeline behaviors verified by tracing executed logic.
3. **Unresolved Discrepancies:** Ambiguities identified in source metadata or border records.
4. **Data Limitations:** Inherent constraints of catalog resolution, timing, and boundary definitions.
5. **Required Future Evidence:** Empirical field and GIS assets needed before operational readiness.

---

## 2. Independent Verification of State Counts & Boundary Attribution

### 2.1 Recomputed State Census (Un-hardcoded Verification)
Direct aggregation of `normalized_state` across all rows of `historical_landslide_events_ner.csv` and cross-referencing with the raw NASA catalog export confirms the true distribution:

```
+===================================================================================================+
| State             | Raw Catalog Variants               | Processed Events | Share (%) | Verified  |
+===================================================================================================+
| Assam             | Assam (82)                         |               82 |     22.3% | PASS      |
| Nagaland          | Nāgāland (64) + Nagaland (14)      |               78 |     21.2% | PASS      |
| Manipur           | Manipur (56)                       |               56 |     15.2% | PASS      |
| Sikkim            | Sikkim (31) + Heuristic Nulls (17) |               48 |     13.0% | CONDITIONAL|
| Arunachal Pradesh | Arunāchal (25) + Arunachal (20)    |               45 |     12.2% | PASS      |
| Meghalaya         | Meghalaya (18) + Meghālaya (11)    |               29 |      7.9% | PASS      |
| Mizoram           | Mizoram (27)                       |               27 |      7.3% | PASS      |
| Tripura           | Tripura (3)                        |                3 |      0.8% | PASS      |
+===================================================================================================+
| Total Accepted    | 351 Labeled + 17 Attributed        |              368 |    100.0% | PASS      |
+===================================================================================================+
```

### 2.2 Diacritic Normalization Lineage
Inspection of `process_landslide_catalog.py` confirms that diacritics were stripped using Unicode NFKD normalization (`unicodedata.normalize('NFD', text)`):
- `Nāgāland` (64 records) $\rightarrow$ `Nagaland` + 14 pre-normalized = **78 records**.
- `Arunāchal Pradesh` (25 records) $\rightarrow$ `Arunachal Pradesh` + 20 pre-normalized = **45 records**.
- `Meghālaya` (11 records) $\rightarrow$ `Meghalaya` + 18 pre-normalized = **29 records**.
The lineage is traceable directly from raw catalog strings to processed records.

### 2.3 The 17 Null-Admin Sikkim Records — Boundary Status
The 17 records with `admin_division_name = NaN` in the raw NASA catalog were analyzed:
- **Assignment Method Used:** The pipeline used an axis-aligned bounding box ($27.0^\circ\text{N} \le \text{lat} \le 28.2^\circ\text{N}$ and $88.0^\circ\text{E} \le \text{lon} \le 88.9^\circ\text{E}$) combined with string keyword matching (`sikkim`, `gangtok`, `mangan`, `chungthang`, `singtam`, `rangpo`).
- **Authoritative Boundary Audit:** **No authoritative GIS state-boundary polygon dataset** (such as Survey of India administrative boundary shapefiles, GADM Level 1 GeoJSON, or OpenStreetMap admin boundaries) was used. No point-in-polygon algorithm (e.g. Shapely `contains` or PostGIS `ST_Within`) was executed.
- **Formal Status Classification:** In accordance with Phase 12.3 requirements, these 17 records are formally classified as:
  $$\mathbf{PENDING\_GEOGRAPHIC\_VERIFICATION}$$
  They are supported by strong textual evidence in event titles, but cannot be described as boundary-verified until checked against an official Survey of India boundary polygon.

---

## 3. Audit of the 74 Excluded Records & Border Ambiguities

### 3.1 Reconciliation Totals
- Raw NASA GLC India records: **1,265**.
- Regional Bounding Box ($21.5^\circ - 29.5^\circ\text{N}, 88.0^\circ - 97.5^\circ\text{E}$): **442**.
- Retained Northeast India events: **368**.
- Excluded events: Exactly **74**.
- Administrative label breakdown: `Bengal` (47 records), `West Bengal` (27 records).

### 3.2 Distinguishing Confirmed West Bengal from Border-Ambiguous Cases
Detailed geographic inspection of all 74 excluded records reveals:
- **41 Confirmed West Bengal Interior Records:** Located deep within Darjeeling Sadar, Kurseong, Ghum, Lava, Tindharia, Mirik, and Siliguri.
- **33 Border-Proximate or Conflicting Records:** Located along the Teesta River boundary corridor, the National Highway 10/31A axis, or containing cross-border references:

#### Specific Conflicting & Ambiguous Border Cases:
1. **Event ID 1111 (Conflicting Metadata):**
   - Coordinates: `27.1344°N, 88.4575°E`
   - Raw `admin_division_name`: `Bengal`
   - Raw `event_title`: `Melli Chalisey, Sikkim`
   - Raw `location_description`: `Melli Chalisey, Sikkim`
   - *Conflict:* The event title explicitly claims Sikkim, but the catalog compiler tagged the admin division as Bengal. Because `process_landslide_catalog.py` checked `admin_division_name` first, this event was rejected as West Bengal despite its Sikkim title.
2. **Event ID 9215 (Border Gateway):**
   - Coordinates: `27.1758°N, 88.5294°E`
   - Raw `admin_division_name`: `West Bengal`
   - Raw `event_title`: `NH10 in Rangpo`
   - *Context:* Rangpo is the primary border crossing between Kalimpong district (West Bengal) and Pakyong district (Sikkim).
3. **Event ID 3619 (Retained Ambiguity in Processed Dataset):**
   - Coordinates: `27.4885°N, 88.4451°E` (near Mangan, North Sikkim)
   - Raw `event_title`: `National HWY 31A, Birik (cut off Sikkim)`
   - Raw `admin_division_name`: `NaN`
   - *Conflict:* "Birik Dara" physically lies in Kalimpong district (West Bengal). However, because the compiler recorded coordinates near Mangan and the title contained "Sikkim", the pipeline accepted it into Sikkim as one of the 17 heuristic records.

**Audit Conclusion:** Relying strictly on raw catalog administrative division strings creates boundary edge-case artifacts along the Teesta River gorge. The exclusion of all 74 records is procedurally consistent with the rule `admin_division_name in ['Bengal', 'West Bengal']`, but contains unresolved geographic border ambiguity for records like Event 1111.

---

## 4. Multi-Table Join Integrity, Fan-out Prevention & Lineage

### 4.1 Join Verification Matrix
Independent multi-table joins were executed across all 6 datasets:

```
====================================================================================================
Dataset Table      Rows    Unique IDs   Missing   Extra   Duplicates   Join Fan-out   Max Coord Dev
====================================================================================================
events (baseline)   368       368          0        0         0          368 rows       0.000000
terrain_v1          368       368          0        0         0          368 rows       0.000000
terrain_v2          368       368          0        0         0          368 rows       0.000000
rainfall_v1         368       368          0        0         0          368 rows       0.000000
rainfall_v2         368       368          0        0         0          368 rows       0.000000
rainfall_v3         368       368          0        0         0          368 rows       0.000000
====================================================================================================
Integrity Result: ZERO FAN-OUT, ZERO DUPLICATE ROWS, EXACT FLOATING-POINT COORDINATE CONVERGENCE
```

### 4.2 Dynamic SHA-256 Digest Recomputation
All 9 tracked files were hashed directly from disk bytes:

| File Logical Key | Physical Path | Computed SHA-256 (Truncated) | Manifest SHA-256 | Status |
| :--- | :--- | :--- | :--- | :--- |
| `raw_nasa_glc_export` | `ai-service/data/raw/Global_Landslide_Catalog_Export_rows.csv` | `2c4898899dd4...` | `2c4898899dd4...` | **MATCH** |
| `historical_landslide_events_ner` | `ai-service/data/processed/historical_landslide_events_ner.csv` | `96e671924931...` | `96e671924931...` | **MATCH** |
| `historical_rainfall_features_ner_v1` | `ai-service/data/processed/historical_rainfall_features_ner.csv` | `fee4271a0623...` | `fee4271a0623...` | **MATCH** |
| `historical_rainfall_features_ner_v2` | `ai-service/data/processed/historical_rainfall_features_ner_v2.csv` | `b133187f323c...` | `b133187f323c...` | **MATCH** |
| `historical_rainfall_features_ner_v3` | `ai-service/data/processed/historical_rainfall_features_ner_v3.csv` | `1d0f26aad374...` | `1d0f26aad374...` | **MATCH** |
| `terrain_features_ner_v1` | `ai-service/data/processed/terrain_features_ner.csv` | `3720c95f4a18...` | `3720c95f4a18...` | **MATCH** |
| `terrain_features_ner_v2` | `ai-service/data/processed/terrain_features_ner_v2.csv` | `52fdf9f9aff3...` | `52fdf9f9aff3...` | **MATCH** |
| `copernicus_dem_tile_index` | `ai-service/data/processed/copernicus_dem_tile_index_requirements.csv` | `d4487cbb404e...` | `d4487cbb404e...` | **MATCH** |
| `open_meteo_rainfall_cache` | `ai-service/data/processed/open_meteo_rainfall_cache.json` | `a08d5a762063...` | `a08d5a762063...` | **MATCH** |

---

## 5. Review of Rainfall & Terrain Feature Validity

### 5.1 Rainfall V3: Temporal Offset & Lookahead Analysis
- **Missing Event Times:** Across all 368 records, failure time is completely missing (`event_time` is 100% null). Events represent calendar dates only.
- **Timezone Boundary Gap:** Open-Meteo aggregated precipitation over UTC calendar days ($00:00:00 - 23:59:59\text{ UTC}$). Local dates in India represent India Standard Time (**IST = UTC+05:30**).
  - Day $D-1$ UTC ends at $D\text{ 00:00:00 UTC}$ = $D\text{ 05:30:00 IST}$.
  - Any landslide that occurred between midnight ($00:00\text{ IST}$) and dawn ($05:30\text{ IST}$) on calendar day $D$ has up to 5.5 hours of post-failure rainfall counted in Window B.
  - Conversely, any landslide that occurred in late afternoon has a 10-12 hour gap of antecedent triggering rainfall excluded.
- **Audit Mandate:** Window B must **NEVER** be described as "guaranteed zero lookahead leakage". Its classification as `CONDITIONAL_PRIOR_WINDOW` is verified.

### 5.2 Terrain V2: Compass Aspect & Sampling Representativeness
- **Azimuth Formulation:** Standard clockwise downslope geographic azimuth ($0^\circ=\text{North}, 90^\circ=\text{East}, 180^\circ=\text{South}, 270^\circ=\text{West}$) is verified in `aspect_compass_deg`.
- **Flat Slope Encoding:** Exactly 1 event has slope $< 0.1^\circ$; its aspect is encoded as `-1.0`.
- **Raster Boundary Checking:** Row indices span 5 to 3596; column indices span 0 to 3590. All 368 sampling points sit safely within the 3600x3600 raster margins.
- **Sampling Plausibility:**
  - 138 events have location uncertainty $> 10\text{ km}$ (`COARSE_CENTROID_ONLY`).
  - 178 events have location uncertainty $\le 10\text{ km}$ (`MODERATE_SPATIAL_UNCERTAINTY`).
  - 52 events have location uncertainty $\le 1\text{ km}$ (`HIGH_SPATIAL_CONFIDENCE`).
  - **Critical Geotechnical Limitation:** 54 events have extracted 30m DEM slope $< 5^\circ$ because coarse catalog coordinates sit in flat valley centers or village road junctions, not on the initiating scarp. The presence of uncertainty annotations documents this discrepancy but **does not correct the underlying coordinates**.

---

## 6. Execution Evidence & Automated Test Results

Command:
```powershell
python -m pytest -v ai-service/tests
```

Output:
```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\sakth\OneDrive\Desktop\SlopeGuard
collected 71 items

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
ai-service/tests/test_phase_12_3_independent_verification.py (9 passed)
ai-service/tests/test_predictor.py (3 passed)
ai-service/tests/test_training_pipeline.py (3 passed)

============================= 71 passed in 6.27s ==============================
```

---

## 7. Mandatory Future Evidence Required for Scientific Validation

Passing 71 automated software tests demonstrates that data ingestion, joining, hashing, and mathematical transformations executed without errors. It **does not** prove that the system can predict landslides or that the catalog records are accurate. 

Before any operational claim or model training can occur, the following empirical evidence is required:

1. **Official Survey of India GIS Administrative Boundaries:** Ingestion of Survey of India Level-1 state boundary shapefiles to perform formal point-in-polygon verification on the 17 heuristic Sikkim records and resolve Teesta River border ambiguities (e.g. Event 1111 at Melli).
2. **Ground-Truth Scarp GPS Coordinates:** High-precision field RTK-GPS measurements of actual landslide initiation crowns to replace gazetteer centroid coordinates that currently land on flat valley floors.
3. **Hourly Rain Gauge Telemetry:** High-frequency physical tipping-bucket rain gauge network data to capture triggering precipitation bursts relative to exact failure hours, replacing smoothed reanalysis grids.
4. **Authoritative Non-Landslide Slope Inventory:** Geotechnically surveyed stable slopes during monsoon seasons to establish legitimate negative training samples without inventing synthetic points.

---

## 8. Governance Affirmation

The system governance classification remains immutable:
- **`DEMO_NOT_VALIDATED`**
- **`CALIBRATION_DEFERRED`**
- **`UNCALIBRATED_HAZARD_SCORE`**
- **`PENDING_EXPERT_REVIEW`**
