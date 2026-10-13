# SlopeGuard — Final Project Status & Demonstration Guide

**Project:** SlopeGuard AI-Based Landslide Risk Monitoring System  
**Version:** 1.0.0-rc1 (Demonstration Release)  
**Target Event:** College Hackathon / Smart India Hackathon (SIH) Showcase  
**Governance Designation:**  
- `DEMO_NOT_VALIDATED`  
- `CALIBRATION_DEFERRED`  
- `UNCALIBRATED_HAZARD_SCORE`  
- `PENDING_EXPERT_REVIEW`  
- `DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`

---

## 1. Executive Summary & Demonstration Readiness

SlopeGuard is a full-stack, AI-assisted landslide risk monitoring and citizen science platform tailored for the **Northeast India Region (NER)**. The project integrates satellite-derived terrain data (Copernicus DEM GLO-30), near real-time meteorological precipitation feeds (Open-Meteo API / ERA5-Land reanalysis), an interactive Leaflet GIS mapping interface, citizen incident reporting with photo verification, and an administrative decision-support dashboard.

### Operational vs. Demonstration Verdict
* **College Hackathon / SIH Demonstration:** **READY**  
  The end-to-end software pipeline is completely functional, verified by automated unit and integration tests across both the Python AI microservice (110/110 passed) and the Java Spring Boot backend (114/114 executed tests passed). The UI is responsive, interactive, and clearly communicates system status and hazards.
* **Real-World Operational Early Warning:** **NOT PERMITTED (Safeguarded by Governance Flags)**  
  The system must **not** be deployed as an authoritative life-safety early warning service. While the software architecture and GIS data pipelines are functional, the underlying training dataset consists of historical catalog records lacking intraday failure hours, containing coarse centroid spatial approximations, and lacking surveyed geotechnical negative controls. All hazard scores are explicitly designated as uncalibrated prototypes.

---

## 2. Architecture & Verified Stack Components

```
                          ┌─────────────────────────────────────┐
                          │         Web Frontend UI             │
                          │   Leaflet GIS Map + Dashboard +     │
                          │   Citizen Reporting + Admin Triage  │
                          └──────────────────┬──────────────────┘
                                             │ HTTP REST / JWT
                                             ▼
                          ┌─────────────────────────────────────┐
                          │    Spring Boot Backend (Port 8080)   │
                          │   • Auth & Role-Based Access        │
                          │   • Incident Reports & Photo Store  │
                          │   • Alert Deduplication & Dispatch  │
                          │   • Copernicus DEM Raster Engine    │
                          │   • Open-Meteo Live Rainfall Client │
                          └──────────┬────────────────┬─────────┘
                                     │                │
          Internal REST (/predict)   │                │ JPA / Hibernate
                                     ▼                ▼
┌──────────────────────────────────────┐    ┌───────────────────────────────────┐
│     Python AI Service (Port 8000)    │    │        Persistence Layer          │
│   • FastAPI Microservice             │    │   • MySQL (Production / Live)     │
│   • Random Forest Classifier         │    │   • H2 In-Memory (Test/Demo Mode) │
│   • Temporal Split Validation        │    │   • Local Photo Storage           │
│   • Strict Governance Enforcement    │    └───────────────────────────────────┘
└──────────────────────────────────────┘
```

### Component Details
1. **Frontend Client (`/index.html`, `/dashboard.html`, `/map.html`, `/report-incident.html`, `/admin/`):**
   - **Interactive GIS:** Leaflet 1.9 map with terrain/satellite layers, state boundary overlays, historical event popups, live sensor monitors, and custom risk color coding.
   - **Citizen Science Reporting:** Multi-step incident submission form with automatic GPS coordinate detection, image preview, client-side MIME/size validation, and offline caching.
   - **Admin Management Portal:** Dedicated administrative suite (`/admin/dashboard.html`, `alerts.html`, `assessments.html`, `audit-logs.html`, `users.html`) for incident triage, risk threshold override, and audit inspection.
   - **Unified API Client (`js/core/api.js`):** JWT bearer token injection, CSRF handling (`X-XSRF-TOKEN`), request timeout protection, and mock fallback for offline presentations.

2. **Java Spring Boot Backend (`/slopeguard-backend`):**
   - **Runtime:** Java 17 + Spring Boot 3.2.4.
   - **Security:** Stateless Spring Security with BCrypt password hashing, JWT authentication filter, and granular role enforcement (`ROLE_CITIZEN`, `ROLE_ADMIN`, `ROLE_ANALYST`).
   - **GIS Engine (`DefaultTerrainService`):** Loads high-resolution Copernicus DEM GLO-30 raster tiles (`.asc` format) directly to compute elevation, slope angle (degrees), and downslope aspect azimuth on-the-fly.
   - **Meteorological Engine (`DefaultOpenMeteoClient`):** Live REST client querying Open-Meteo hourly and accumulated precipitation for exact coordinate pairs.
   - **Alert Management (`JpaAlertService`):** Spatial and temporal deduplication of active alerts preventing notification storms.
   - **Audit Trail (`JpaAuditService`):** Immutable logging of all administrative actions, risk threshold adjustments, and citizen report reviews.

3. **Python AI Prediction Service (`/ai-service`):**
   - **Runtime:** Python 3.11 + FastAPI + Scikit-Learn.
   - **Endpoints:** `POST /predict`, `GET /model/status`, `GET /health`.
   - **Validation Architecture:** Trained on verified feature schema (`slope_deg`, `elevation_m`, `aspect_deg`, `rainfall_24h_mm`, `rainfall_72h_mm`, `soil_moisture_index`).
   - **Governance Safeguards:** Programmatically injects `model_status: "DEMO_NOT_VALIDATED"`, `data_readiness_status: "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"`, and `output_type: "UNCALIBRATED_HAZARD_SCORE"` into all prediction payloads.

---

## 3. Verified Features Matrix

| Feature Module | Verification Mechanism | Status | Notes |
| :--- | :--- | :---: | :--- |
| **User Authentication** | `AuthControllerTest` (Java) | **PASSED** | Citizen registration, Admin/Analyst login, JWT token generation & verification |
| **Citizen Incident Reporting** | `ReportIncidentControllerTest` | **PASSED** | Validates coordinates, severity, description, ownership enforcement |
| **Incident Photo Upload** | `PhotoUploadTest` | **PASSED** | JPEG/PNG validation, size limit checks, local disk storage, retrieval endpoint |
| **Admin Review & Triage** | `AdminReviewAndAuditTest` | **PASSED** | Incident status updates (VERIFIED, REJECTED, RESOLVED) + automated audit logging |
| **Copernicus DEM Processing** | `TerrainServiceTest`, `SlopeCalculatorTest` | **PASSED** | Real 540x540 DEM raster extraction, elevation, slope calculation |
| **Live Open-Meteo Weather** | `LiveOpenMeteoConnectivityTest` | **PASSED** | Connects to live weather API, retrieves real-time precipitation for Northeast coordinates |
| **Risk Engine & Alert Dispatch** | `RiskAssessmentAndAlertTest` | **PASSED** | Computes composite hazard index, creates alert records, deduplicates spatial alerts |
| **AI FastAPI Microservice** | `test_predictor.py`, `test_api_governance.py` | **PASSED** | Predicts hazard score, handles missing features gracefully, enforces governance flags |
| **Data Leakage Prevention** | `test_leakage_and_evaluation.py` | **PASSED** | Temporal split verification; strictly prior antecedent rainfall window enforcement |
| **Northeast Regional Boundary** | `test_phase_12_4_geographic_verification.py` | **PASSED** | GADM Level 1 administrative boundaries verified across all 8 NER states |
| **Frontend Map & UI** | Browser inspection & unit tests | **PASSED** | Leaflet rendering, dynamic layers, governance disclaimers displayed prominently |

---

## 4. Environment Configuration & Database Setup

### Service Ports & Default Endpoints
* **Frontend Web App:** Port `5500` (`http://localhost:5500`)
* **Spring Boot Backend:** Port `8080` (`http://localhost:8080/api`)
* **Python AI Microservice:** Port `8000` (`http://localhost:8000`)
* **MySQL Database:** Port `3306` (`localhost:3306`)

### Environment Variables & Secrets Reference
The backend runs with sensible developer defaults and can be customized via environment variables:
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Backend HTTP listening port |
| `SLOPEGUARD_DB_URL` | `jdbc:mysql://localhost:3306/slopeguard?...` | JDBC connection string |
| `SLOPEGUARD_DB_USERNAME` | `root` | Database username |
| `SLOPEGUARD_DB_PASSWORD` | *(empty)* | Database password |
| `JWT_SECRET` | *(32+ char dev secret)* | HMAC-SHA256 signing secret |
| `AI_SERVICE_BASE_URL` | `http://localhost:8000` | Target URL of Python FastAPI service |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com/v1/forecast` | Meteorological forecast endpoint |
| `UPLOAD_DIR` | `./data/uploads` | Path for citizen incident photo uploads |

### Database Setup: Two Execution Options
#### Option A: Production MySQL 8.x (Recommended for full persistence)
1. Start MySQL on port 3306.
2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS slopeguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. When Spring Boot starts, **Flyway** will automatically execute schema migrations from `classpath:db/migration` (`V1__init_schema.sql`, etc.), creating all tables (`users`, `incident_reports`, `incident_photos`, `risk_assessments`, `early_warning_alerts`, `audit_logs`).

#### Option B: Standalone Zero-Dependency H2 In-Memory Mode (Ideal for instant Hackathon / Offline Judging)
If MySQL is not installed on the judging machine, run the backend with H2 test configuration:
```powershell
.\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:slopeguard;DB_CLOSE_DELAY=-1;MODE=MySQL --spring.datasource.driverClassName=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
```

---

## 5. Exact Commands to Run and Demonstrate

### Step 1: Start the Python AI Service (Port 8000)
Open a terminal in the project root:
```powershell
cd c:\Users\sakth\OneDrive\Desktop\SlopeGuard\ai-service
python3.11 -m uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
```
*Verify:* Navigate to `http://localhost:8000/docs` to inspect the FastAPI Swagger documentation.

---

### Step 2: Start the Spring Boot Backend (Port 8080)
Open a second terminal in the project root:
```powershell
cd c:\Users\sakth\OneDrive\Desktop\SlopeGuard\slopeguard-backend
.\mvnw.cmd spring-boot:run
```
*Verify:* Navigate to `http://localhost:8080/actuator/health` (returns `{"status":"UP"}`).

---

### Step 3: Launch the Frontend Web Application (Port 5500)
Open a third terminal in the project root:
```powershell
cd c:\Users\sakth\OneDrive\Desktop\SlopeGuard
python3.11 -m http.server 5500
```
Open your browser and navigate to:
```
http://localhost:5500/index.html
```

---

## 6. Demonstration Walkthrough Script (for SIH / Hackathon Jury)

1. **Landing Page & System Mission (`/index.html`):**
   - Present the project motivation: Northeast India's complex terrain and monsoonal vulnerability.
   - Point out the institutional governance banner acknowledging experimental status.
2. **Interactive Risk Map (`/map.html`):**
   - Demonstrate the Leaflet GIS interface centered on Northeast India (`[25.75, 92.80]`).
   - Show terrain contours, sensor station overlays, and historical landslide footprints.
   - Highlight the **Model Status Banner**: `DEMO_NOT_VALIDATED • Calibration Deferred • Candidate v1.0.0`.
3. **Citizen Reporting Workflow (`/report-incident.html`):**
   - Log in or register as a citizen user.
   - Submit a new incident report: select location on the map, input incident details, and attach a photo.
   - Demonstrate client-side file validation and submission confirmation.
4. **Admin Triage & Audit Dashboard (`/admin/dashboard.html`):**
   - Log in as administrative officer (`admin@slopeguard.org`).
   - Review incoming citizen reports, approve/verify the submitted report.
   - Inspect the immutable audit log (`/admin/audit-logs.html`) showing timestamps, user ID, and administrative action.
5. **AI Risk Assessment & Environmental Fusion:**
   - Demonstrate backend integration where Copernicus DEM raster data and live Open-Meteo precipitation feeds are fed into the Python AI microservice.
   - Show how the API computes a composite hazard score while honestly flagging it as uncalibrated.

---

## 7. Remaining Blockers for Operational Deployment

To advance SlopeGuard from a successful hackathon demonstration prototype to an officially certified operational early warning system, the following external dependencies must be resolved:
1. **Intraday Failure Timestamps:** Access official state disaster management logs (ASDMA/SSDMA) or GSI field event registers with minute/hour resolution to eliminate antecedent rainfall window uncertainty.
2. **High-Accuracy Scar Coordinates:** Replace approximate 1-25 km centroid geocodes with differential GPS or surveyed crown/scar boundary coordinates to prevent valley-bottom slope distortion.
3. **True Negative Slope Controls:** Conduct geotechnical surveys of non-failing slopes under identical precipitation conditions to eliminate presence-only machine learning bias.
4. **Institutional Review & Endorsement:** Formal review and calibration by GSI (Geological Survey of India) and NDMA domain experts.
