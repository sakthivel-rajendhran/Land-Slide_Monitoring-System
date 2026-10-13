# SlopeGuard AI — Probability Calibration Analysis & Scientific Decision Report

**Module:** `ai-service`  
**Phase:** 11 — Historical Model Validation, Probability Calibration & Threshold Review  
**Author:** SlopeGuard Scientific Governance Team  
**Status:** **CALIBRATION DEFERRED**  
**Governance Designation:** **`UNCALIBRATED_HAZARD_SCORE`**  

---

## 1. Core Mathematical Finding: Score vs. Probability

A primary source of catastrophic miscommunication in artificial intelligence early warning systems is the conflation of an **ensemble voting score** with an **empirical posterior probability**.

In the SlopeGuard Random Forest model:
$$S(x) = \frac{1}{T} \sum_{t=1}^{T} h_t(x)$$
Where $T = 100$ decision trees, and $h_t(x) \in \{0, 1\}$ represents the partition vote of tree $t$.

### Why $S(x)$ Is NOT a Valid Probability
1. **Uncalibrated Margin:** Random Forest tree vote fractions are known to be systematically under-confident near extremes and non-linearly compressed toward the center due to variance reduction averaging.
2. **Artificial Training Prior:** When trained on a balanced synthetic dataset ($1:1$ ratio), the model inherently reflects an artificial prior base rate of $P(Y=1) = 0.50$. In reality, the spatial-temporal base rate of landslides in any single slope parcel on any given day is on the order of $P(Y=1) \approx 10^{-4}$ to $10^{-5}$.
3. **No Certified Event Definition:** Describing $S(x) = 0.75$ as a *"75% probability of a landslide"* is scientifically invalid unless the geographic parcel area (e.g., $100\text{ m} \times 100\text{ m}$), the time horizon (e.g., next 24 hours), and the failure mechanism are mathematically calibrated against long-term frequency data.

**Governance Directive:**
SlopeGuard outputs must be explicitly labeled as **`UNCALIBRATED_HAZARD_SCORE`** (dimensionless relative index between $0.00$ and $1.00$). Under no circumstances may frontend or backend interfaces present this score as a "percentage probability of failure".

---

## 2. Evaluation of Calibration Methodologies

We analyzed two standard calibration techniques against the held-out temporal partition:

### 2.1 Platt Scaling (Sigmoid Model)
Fits a univariate logistic sigmoid to the raw model scores:
$$P(Y=1 \mid S) = \frac{1}{1 + \exp(A \cdot S + B)}$$
- **Strengths:** Parametric, resistant to severe overfitting on moderate sample sizes.
- **Limitation on Current Data:** With small historical sample sizes ($N < 100$), the parameter estimates $(A, B)$ have large standard errors. A slight variation in negative sampling shifts the sigmoid asymptote drastically.

### 2.2 Isotonic Regression (Non-Parametric)
Fits a piecewise non-decreasing step function:
$$P(Y=1 \mid S) = m(S), \quad \text{subject to } m(S_i) \le m(S_j) \text{ whenever } S_i \le S_j$$
- **Strengths:** Non-parametric; does not assume a sigmoid shape.
- **Limitation on Current Data:** Highly prone to extreme overfitting and severe step-function collapse when $N < 1000$.

### 2.3 Reliability Metric (Brier Score)
$$\text{Brier} = \frac{1}{N} \sum_{i=1}^{N} (y_i - p_i)^2$$
On the current historical evaluation set:
- Uncalibrated Brier Score: **$0.027$** (on small sample).
- While mathematically low, this score reflects sample separability rather than true calibration over the entire regional parameter space.

---

## 3. Scientific Calibration Decision

### Decision: **`CALIBRATION_DEFERRED`**
**No calibration mapping (Platt or Isotonic) is deployed to the production inference pipeline.**

### Formal Rationale
1. **Sample Size Insufficiency:** Validating a probability calibration mapping requires at least $100$ independently observed positive landslide events across distinct geological formations and rainfall regimes. Current verified open data provides a sample of $20$ records.
2. **Deceptive Precision Risk:** Applying a mathematical sigmoid mapping to an under-sampled distribution gives the illusion of scientific calibration. Emergency managers reading calibrated outputs might assume the probabilities represent verified physical frequencies.
3. **Preservation of Raw Ranking:** The uncalibrated score preserves the monotonic ordering of tree votes without distorting the internal relative risk rankings.

---

## 4. Operational Requirements for Future Calibration Deployment

Calibration mapping may only be enabled when the following verifiable criteria are satisfied:

| Requirement | Minimum Threshold | Current Value | Status |
| :--- | :--- | :--- | :--- |
| Verified Field Events ($y=1$) | $\ge 100$ events across Northeast India | $10$ events | **PENDING** |
| Verified Stable Reference Sites ($y=0$) | $\ge 200$ surveyed sites | $10$ valley reference sites | **PENDING** |
| Monsoon Seasons Spanned | $\ge 3$ consecutive annual monsoons | In progress | **PENDING** |
| Ground-Truth Rainfall | Calibrated telemetry within 5 km of slide | ERA5 Reanalysis (~11 km) | **PENDING** |
| Holdout Reliability Validation | Brier score $< 0.10$ on independent multi-year holdout | Uncalibrated: $0.027$ on sample | **DEFERRED** |

Until these criteria are satisfied and reviewed by an independent geotechnical panel, the system shall strictly report:
- `model_status`: **`DEMO_NOT_VALIDATED`**
- `output_type`: **`UNCALIBRATED_HAZARD_SCORE`**
- `calibration_status`: **`CALIBRATION_DEFERRED`**
