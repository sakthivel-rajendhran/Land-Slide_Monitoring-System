# SlopeGuard Historical Rainfall Window & Leakage Audit Report
**Document ID:** `SG-RAIN-AUDIT-2026-10-13`  
**Dataset Reference:** `historical_rainfall_features_ner_v2.csv` (Version 2)  
**Baseline Reference:** `historical_rainfall_features_ner.csv` (Version 1 preserved)  
**Governance Status:** `DEMO_NOT_VALIDATED` | `CALIBRATION_DEFERRED` | `PENDING_EXPERT_REVIEW`

---

## 1. Executive Summary & Audit Motivation

In accordance with geotechnical safety guidelines, this audit addresses temporal look-ahead leakage in antecedent precipitation calculation for historical landslide inventories.

### The Date-Only Lookahead Leakage Dilemma
In the NASA Global Landslide Catalog (GLC), `event_time` is **100% missing** (368 out of 368 records) for Northeast India. Only the calendar date is known.
- **The Vulnerability in V1 Windows:**  
  When an antecedent window ends at `23:59:59 UTC` on the event date D, if the landslide occurred at 06:00 AM local time, all rainfall falling between 06:00 AM and 23:59 occurred **after the landslide**. In predictive modeling, this constitutes **future-weather look-ahead leakage**.
- **The Truncation Tradeoff in Strictly Prior Windows:**  
  Ending the window strictly at D 00:00:00 UTC (day D-1) guarantees **zero post-event leakage**, but risks truncating the same-day morning downpour that physically triggered the slope failure.

---

## 2. Statistical Findings & Dual-Window Comparison

| Metric | Window A (Same-Day Inclusive [D-2 to D]) | Window B (Strictly Prior Conservative [D-3 to D-1]) |
| :--- | :--- | :--- |
| **Window End Timestamp** | Event Date D 23:59:59 UTC | Event Date D 00:00:00 UTC |
| **Look-Ahead Leakage Risk** | **HIGH** (Potential post-failure rain) | **ZERO** (Guaranteed strictly prior) |
| **Mean 24h Rainfall (mm)** | `22.81` | `18.52` |
| **Median 24h Rainfall (mm)** | `14.50` | `10.80` |
| **Max 24h Rainfall (mm)** | `159.20` | `154.20` |
| **Mean 72h Rainfall (mm)** | `76.64` | `68.21` |
| **Max 72h Rainfall (mm)** | `406.60` | `378.40` |
| **Events with R_24h(SameDay) > R_24h(Prior)** | **214 / 368** (58.2%) | Baseline reference |
| **Events with R_24h(Prior) == 0.0 mm** | `14 / 368` (3.8%) | `28 / 368` (7.6%) |

### Key Observations:
1. In 58.2% of events (214 records), substantial precipitation was recorded on the event day itself (D). If the landslide occurred early in the day, portions of this rainfall occurred after the slide.
2. In 7.6% of events (28 records), strictly prior 24h rainfall was zero, indicating failure was either driven by longer-term cumulative monsoonal saturation or an intense intra-day morning storm on day D.
3. Physical inequality Rainfall_72h >= Rainfall_24h >= 0.0 mm was validated and verified across 100% of rows for both windows.

---

## 3. Versioned Dataset Architecture (v2)

To avoid silently overwriting previous experimental baselines, the original file `historical_rainfall_features_ner.csv` is preserved unchanged. The audited dual-window dataset is published as:
`ai-service/data/processed/historical_rainfall_features_ner_v2.csv`

### Dual-Window Column Dictionary
- `rainfall_24h_sameday_mm` / `rainfall_72h_sameday_mm`: Same-day inclusive values with documented leakage risk flag.
- `rainfall_24h_strictly_prior_mm` / `rainfall_72h_strictly_prior_mm`: Strictly prior zero-leakage conservative values.
- `rainfall_24h_conservative_mm` / `rainfall_72h_conservative_mm`: Recommended default for operational inference and leakage-proof training.
- `reported_time_precision`: `DATE_ONLY` across all 368 rows.
- `timestamp_known`: `False`.
- `valid_observations_24h`: `24` valid hourly reanalysis observations.
- `valid_observations_72h`: `72` valid hourly reanalysis observations.
- `missing_hours_count`: `0`.

---

## 4. Governance & Safety Decision

- **Model Training Policy:** Any future training of machine learning models MUST use the conservative strictly prior window (`rainfall_24h_conservative_mm`) or document the dual-window sensitivity bounds.
- **Model Status:** Must remain **`DEMO_NOT_VALIDATED`**.
- **Calibration Status:** Must remain **`CALIBRATION_DEFERRED`**.
