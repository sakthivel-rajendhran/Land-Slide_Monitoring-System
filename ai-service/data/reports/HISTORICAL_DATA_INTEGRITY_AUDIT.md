# SlopeGuard Historical Data Integrity & Leakage Audit
**Document ID:** `SG-AUDIT-2026-10-13`  
**Evaluation Release:** Phase 12 Complete (`2.1.0-complete-dem-acquisition`)  
**Framework Standard:** Operational Geotechnical AI Safety Protocol (DRL-3)  
**Governance Status:** `DEMO_NOT_VALIDATED` | `CALIBRATION_DEFERRED` | `PENDING_EXPERT_REVIEW`

---

## 1. Executive Summary & Verification Ledger

This audit validates the data hygiene, spatial consistency, temporal boundary isolation, and leakage protection of the real-world historical dataset acquired for SlopeGuard across Northeast India. The inventory is compiled from the authoritative NASA Global Landslide Catalog (GLC), enriched with ECMWF ERA5-Land reanalysis via Open-Meteo, and extracted across 30 authentic Copernicus DEM GLO-30 GeoTIFF tiles acquired from AWS Open Data.

| Integrity Domain | Audit Finding | Methodological Control |
| :--- | :--- | :--- |
| **Total Global Records** | 11,033 rows inspected | Cryptographic SHA-256 verification of raw source file on disk |
| **India Sub-inventory** | 1,265 rows | Filtered by `country_name == 'India'` |
| **Regional Bounding Box** | 442 candidate rows | Bounding box: $21.5^\circ\text{N} \le \text{Lat} \le 29.5^\circ\text{N}$, $88.0^\circ\text{E} \le \text{Lon} \le 97.5^\circ\text{E}$ |
| **Accepted Northeast States** | **368 events** | 8 canonical states (Assam: 82, Nagaland: 78, Manipur: 56, Sikkim: 48, Arunachal: 45, Meghalaya: 29, Mizoram: 27, Tripura: 3) |
| **Out-of-Domain Corridor** | 74 events rejected | Darjeeling/Kalimpong/Kurseong events screened and isolated into audit ledger |
| **Duplicate Event IDs** | **0 duplicates (0.0%)** | Strict primary key uniqueness check on `event_id` |
| **Duplicate Spatiotemporal Rows** | **0 duplicates (0.0%)** | Strict tuple uniqueness check on `(latitude, longitude, event_date)` |
| **Invalid/Out-of-Bounds Coords** | **0 invalid (0.0%)** | 100% within valid range $[-90, 90]$ and $[-180, 180]$ |
| **Rainfall Window Matches (v1 & v2)** | **368 / 368 (100.0%)** | Hourly reanalysis antecedent aggregation; zero missing hours |
| **Look-Ahead Leakage Audit** | **Dual Windows Created** | Version 2 dataset (`historical_rainfall_features_ner_v2.csv`) provides both trigger and zero-leakage windows |
| **Copernicus DEM Coverage** | **30 / 30 tiles downloaded** | 100% of required 1° $\times$ 1° GLO-30 rasters verified on disk (1.31 GB) |
| **Authentic Terrain Extractions** | **368 / 368 (100.0%)** | Zero fabrication policy; 100% elevation, slope, and aspect extracted |

---

## 2. Spatial Integrity & Geographic Verification

### Coordinate Boundary Check
All 368 accepted events were validated against the geodetic bounding polygon for Northeast India:
- Minimum Latitude: `21.9000° N` | Maximum Latitude: `28.2000° N`
- Minimum Longitude: `88.1365° E` | Maximum Longitude: `96.0500° E`
- No inverted coordinates (latitude/longitude swap) were detected.

### Administrative Division & Gazetteer Normalization
1. **Diacritic Inconsistency Resolution:**  
   NASA GLC catalog exports include diacritic variations from GeoNames (e.g., *Nāgāland*, *Arunāchal Pradesh*, *Meghālaya*). An NFKD unicode stripping procedure normalizes these entries to canonical administrative division strings without altering the underlying raw file.
2. **Missing Admin Recovery (Sikkim):**  
   17 records contained null administrative division names (`NaN`). Systematic textual inspection of `location_description` and `event_title` corroborated that all 17 were located in Sikkim (e.g. *Chungthang*, *Mangan*, *North Sikkim Highway*, *Singtam*, *Rangpo*), with coordinates falling strictly within the Sikkim state boundary ($27.0^\circ\text{N} - 28.2^\circ\text{N}$, $88.0^\circ\text{E} - 88.9^\circ\text{E}$). These were correctly assigned to Sikkim.
3. **Border Discrepancy Auditing:**  
   Only 1 record (Event 3794: *West Bengal-Sikkim at highway Rambi*, Lat 26.9920, Lon 88.4228) was situated immediately on the southern frontier of Sikkim. Its spatial location was audited and retained with boundary caveat notes.

---

## 3. Source Traceability & Multi-Tier Verification Breakdown

Every candidate event was evaluated against multi-factor verification criteria:
- **`VERIFIED_FROM_SOURCE` (289 records, 78.5%):**  
  Active or documented publisher attribution (`source_name`), verifiable source URL link, coherent localized topographic description (road name, mile marker, or village), and spatial accuracy $\le 25\text{ km}$.
- **`PARTIALLY_VERIFIED` (79 records, 21.5%):**  
  Authentic NASA GLC catalog event with verified reporting, but subject to coarse spatial uncertainty ($\ge 50\text{ km}$, e.g. 52 events at 50 km, 1 event at 100 km, 21 events with unknown accuracy) or missing original source URL (2 events). Retained with documented uncertainty; requires field georeferencing.
- **`UNVERIFIED` (0 records):**  
  No candidate records lacked both attribution and geographic anchoring.
- **`REJECTED` (74 records):**  
  Eastern Himalayan events situated in the Darjeeling and Kalimpong districts of West Bengal. While hydrologically and geologically contiguous with Sikkim, these were excluded from the official 8-state catalog to maintain strict administrative provenance.

---

## 4. Temporal Integrity & Look-Ahead Leakage Controls

### The Date-Only Lookahead Leakage Dilemma
In the NASA GLC catalog, `event_time` is **100% missing** (368 out of 368 records) for Northeast India. Only the calendar date is known.
- **The Vulnerability in V1 Windows:**  
  When an antecedent window ends at `23:59:59 UTC` on the event date $D$, if the landslide occurred at 06:00 AM local time, all rainfall falling between 06:00 AM and 23:59 occurred **after the landslide**. In predictive modeling, this constitutes **future-weather look-ahead leakage**.
- **The Truncation Tradeoff in Strictly Prior Windows:**  
  Ending the window strictly at $D\text{ 00:00:00Z}$ (day $D-1$) guarantees **zero post-event leakage**, but risks truncating the same-day morning downpour that physically triggered the slope failure.

### Dual-Window Statistical Comparison
- In **58.2% of events (214 records)**, substantial precipitation was recorded on the event day itself ($D$).
- In **7.6% of events (28 records)**, strictly prior 24h rainfall was zero, indicating failure was either driven by longer-term cumulative saturation or an intense same-day storm.
- `historical_rainfall_features_ner_v2.csv` provides both windows with explicit risk flags (`POTENTIAL_POST_FAILURE_LEAKAGE` for Window A, `ZERO_LOOKAHEAD_LEAKAGE_GUARANTEED` for Window B).

---

## 5. Topographic Extraction & Zero-Fabrication Audit

All 30 unique 1° $\times$ 1° Copernicus DEM GLO-30 tiles covering the 368 events were downloaded from AWS Open Data (`copernicus-dem-30m`) and verified via `tifffile` (3600 $\times$ 3600 float32 single-band arrays).
- **Elevation ($m$):** Extracted via bilinear pixel posting; range: `18.0 m` to `4055.8 m`.
- **Slope Angle ($\theta$):** Derived using Horn's 8-neighbor gradient algorithm; range: `0.00°` to `55.54°` (mean: `18.80°`).
- **Aspect ($\alpha$):** Downslope compass azimuth; range: `0.0°` to `358.6°`.
- **Zero Fabrication:** 100% of values are derived from authentic GLO-30 GeoTIFFs on disk.

---

## 6. Target Leakage & The "Absence of Evidence" Fallacy

### Scientific Warning on Pseudo-Negatives
A critical defect in naive machine learning for environmental hazards is treating unmonitored or unpopulated terrain as "stable non-landslide" ground truth:
1. **Reporting Bias:**  
   NASA GLC events are derived from news media, transport dispatches, and emergency relief agencies. They are heavily concentrated along national highways (NH-29, NH-37, NH-31A/10) and inhabited settlements.
2. **Dense Montane Forests:**  
   Unreported forested valleys in Arunachal Pradesh or Nagaland frequently experience unrecorded slope movements. Automatically assigning `landslide_occurred = 0` to unpopulated slopes would introduce severe false-negative label contamination.
3. **Current Recommendation:**  
   Maintain this inventory as an **event-only occurrence catalog**. Operational model training and probability calibration must be deferred until a multi-monsoon inventory containing field-surveyed stable polygons (such as from GSI Bhukosh or NRSC National Landslide Susceptibility Mapping) is integrated.

---

## 7. Audit Conclusion & Compliance Certification

- **Cryptographic Traceability:** Verified across all files.
- **Duplicate Prevention:** Verified (0 duplicates).
- **Temporal Leakage Prevention:** Audited; dual windows provided in v2 dataset.
- **Terrain Zero-Fabrication Policy:** 100% compliant with authentic GLO-30 raster coverage.
- **Governance Status:** Confirmed as `DEMO_NOT_VALIDATED`, `CALIBRATION_DEFERRED`, and `PENDING_EXPERT_REVIEW`.
