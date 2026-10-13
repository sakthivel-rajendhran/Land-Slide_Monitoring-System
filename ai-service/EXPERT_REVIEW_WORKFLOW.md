# SlopeGuard AI — Expert Review Workflow & Audit Trail Specification

**Module:** `ai-service`  
**Phase:** 11 — Historical Model Validation, Probability Calibration & Threshold Review  
**Document Version:** 1.0.0  
**Status:** **OPERATIONAL STANDARD OPERATING PROCEDURE (SOP)**  

---

## 1. Purpose & Governance Scope

Thresholds that map mathematical scores into actionable risk categories (`LOW`, `MODERATE`, `HIGH`, `SEVERE`) directly influence disaster management preparedness. 

**Core Directives:**
1. **No Artificial Endorsement:** No threshold set may be marked as `EXPERT_APPROVED` without an auditable review completed by certified domain experts.
2. **Provisional State:** All candidate thresholds remain in status **`PENDING_EXPERT_REVIEW`** until formal panel sign-off.
3. **No Automatic Public Warnings:** Experimental thresholds must never trigger public sirens, mandatory evacuations, or automated emergency text alerts. Official disaster warnings are the sole constitutional prerogative of State Disaster Management Authorities (SDMA / NDMA).

---

## 2. Multi-Stakeholder Review Panel Requirements

A valid expert review panel must consist of at least three independent reviewers satisfying the following minimum qualifications:

| Role | Required Qualifications | Primary Review Focus |
| :--- | :--- | :--- |
| **Lead Geotechnical Engineer** | M.Tech / Ph.D. in Geotechnical Engineering with $\ge 10$ years experience in slope stability analysis. | Shear strength parameters, factor of safety correlation, kinematic failure modes. |
| **Engineering Geologist** | Certified Geologist with $\ge 8$ years field experience in Himalayan / Northeast India terrain (GSI or academic faculty). | Lithological boundaries, joint orientations, structural discontinuities, weathering grades. |
| **Disaster Management Specialist** | Technical officer from NDMA, SDMA, or State Emergency Operation Centre (SEOC). | False alarm tolerance, warning fatigue trade-offs, emergency response standard operating protocols. |

---

## 3. Four-Stage Review & Adjudication Lifecycle

```
[ Stage 1: Submission ]
  Candidate threshold configuration drafted (e.g., candidate_thresholds_v1.json)
  Status: PENDING_EXPERT_REVIEW
        │
        ▼
[ Stage 2: Technical Evaluation ]
  Panel evaluates ROC curves, Confusion Matrix, False Alarm Rate, and Missed Event Rate.
  Field site inspections conducted on representative highway slopes.
        │
        ▼
[ Stage 3: Formal Adjudication ]
  Panel votes: APPROVED / MODIFICATIONS_REQUIRED / REJECTED
  Written technical review consensus report signed.
        │
        ▼
[ Stage 4: Cryptographic Audit Logging ]
  Digital signatures recorded in audit history.
  Threshold configuration promoted to EXPERT_APPROVED.
```

---

## 4. Audit Trail Schema

When a threshold review is executed, the following immutable audit record must be recorded in the system audit log and appended to the threshold configuration:

```json
{
  "audit_event_id": "THRESHOLD_REVIEW_20261013_001",
  "threshold_set_id": "TH-NE-INDIA-V1-CANDIDATE",
  "threshold_version": "1.0.0-candidate",
  "review_timestamp": "2026-10-13T10:00:00Z",
  "reviewer_info": {
    "name": "Dr. A. K. Sharma",
    "designation": "Chief Geotechnical Consultant",
    "organization": "Northeast Institute of Science and Technology (CSIR-NEIST)",
    "credentials_verified": true,
    "years_experience": 18
  },
  "decision": "PENDING_ADDITIONAL_MONSOON_DATA",
  "technical_rationale": "Threshold cutoffs (0.30, 0.60, 0.80) are theoretically sound as conservative engineering guidelines, but require empirical validation across the 2024-2025 monsoon cycle before operational endorsement.",
  "recommended_modifications": [
    "Incorporate 7-day cumulative antecedent rainfall into high-elevation granitic slopes.",
    "Perform separate calibration for debris flow vs. rockfall mechanisms."
  ],
  "configuration_hash": "a8f3b2c...sha256"
}
```

---

## 5. Distinction Between Susceptibility, Trigger & Alert

To prevent operational ambiguity, SlopeGuard enforces strict semantic separation:

1. **Terrain Susceptibility (Static):** The intrinsic likelihood of slope failure determined by topography, slope angle, aspect, and bedrock geology. Does not change daily.
2. **Environmental Conditions (Dynamic):** Observed and forecast hydrometeorological stress (24h/72h rainfall from Open-Meteo or IMD).
3. **AI Hazard Estimate (Experimental):** Mathematical prototype projection combining static and dynamic factors. Flagged as `DEMO_NOT_VALIDATED` with `PENDING_EXPERT_REVIEW` thresholds.
4. **Official Emergency Alerts (Civil Protection):** Formal public notices issued exclusively by SDMA/NDMA government incident command systems. SlopeGuard outputs must never simulate or substitute for official notices.
