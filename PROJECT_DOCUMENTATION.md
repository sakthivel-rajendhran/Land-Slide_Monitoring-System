# SlopeGuard — Complete Project Documentation

**Full Project Title:** AI-Based Landslide Risk Monitoring and Early Warning Support System for Northeast India  
**Project Context:** Smart India Hackathon (SIH) 2026 / National Disaster Management & Community Safety  
**Project Lead & Repository:** [https://github.com/sakthivel-rajendhran/Land-Slide_Monitoring-System.git](https://github.com/sakthivel-rajendhran/Land-Slide_Monitoring-System.git)  
**Target Development Branch:** `dev`  
**System Governance Classification:**  
`DEMO_NOT_VALIDATED` • `CALIBRATION_DEFERRED` • `UNCALIBRATED_HAZARD_SCORE` • `PENDING_EXPERT_REVIEW` • `DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`

---

## 1. Project Identity

* **Project Name:** SlopeGuard
* **Full Title:** SlopeGuard: AI-Based Landslide Risk Monitoring and Early Warning Support System for Northeast India
* **Domain:** Disaster Management, Remote Sensing (GIS), Environmental Monitoring, Geotechnical AI, Citizen Science
* **Competition / Event Context:** Smart India Hackathon (SIH) 2026, Hardware/Software Hybrid & Cloud GIS Edition
* **Target Geographical Domain:** The 8 States of the Northeast Region (NER) of India:
  * Assam, Nagaland, Manipur, Sikkim, Arunachal Pradesh, Meghalaya, Mizoram, Tripura
  * Explicitly excluding the 74 Darjeeling-Jalpaiguri corridor records (West Bengal) from the administrative NER domain
* **Target User Groups:**
  1. *Citizens & Commuters:* Public community members living along vulnerable slope corridors, drivers on mountain arterial highways (e.g., NH-10, NH-29, NH-2), and tourists.
  2. *Field Response Officers / Volunteers:* First-line emergency volunteers, district revenue circle officers, and state disaster personnel verifying ground incidents.
  3. *State Disaster Management Authorities (SDMA / SEOC):* Administrative and emergency operations analysts in Assam (ASDMA), Sikkim (SSDMA), etc., monitoring early-warning alerts, overriding thresholds, and tracking immutable audit logs.
  4. *Scientific & Geotechnical Reviewers:* Geological Survey of India (GSI) specialists evaluating regional susceptibility models and empirical rainfall thresholds.

---

## 2. Abstract

Landslides triggered by severe monsoonal precipitation represent one of the most destructive natural hazards in Northeast India, causing significant loss of life, recurring highway blockages, and community isolation across rugged mountainous corridors. SlopeGuard provides a full-stack, AI-assisted decision-support platform designed to monitor landslide hazards, aggregate citizen ground observations, and deliver early-warning alerts.

The platform combines 30-meter satellite elevation data (Copernicus DEM GLO-30), near real-time meteorological precipitation feeds (Open-Meteo REST API & ERA5-Land reanalysis), a Java Spring Boot enterprise backend, an interactive Leaflet GIS interface, and a Python FastAPI machine-learning microservice. SlopeGuard bridges the gap between top-down meteorological estimates and bottom-up citizen reporting with photo uploads, while maintaining an immutable administrative audit log.

**Governance & Integrity Notice:** While the software architecture, GIS extraction, and database persistence are fully operational and verified, the current underlying machine learning model is maintained as an exploratory research prototype. Because historical catalog records lack intraday failure hours, rely on coarse centroid coordinates, and contain no verified non-failing slope controls, all hazard scores are strictly labeled with governance invariant flags (`DEMO_NOT_VALIDATED`, `UNCALIBRATED_HAZARD_SCORE`). The system serves as a demonstrable prototype and decision-support framework, not an authorized operational emergency alert trigger.

---

## 3. Problem Statement

Northeast India comprises over 262,000 square kilometers characterized by fragile geological structures, steep tectonic slopes, and severe monsoonal rainfall regimes. The region suffers hundreds of rainfall-triggered debris flows, rockfalls, and mudslides annually. Developing a real-time landslide monitoring and early warning system in this environment presents critical challenges:

1. **Complex Terrain & Microclimates:** Mountainous ridges cause rapid spatial variation in rainfall, where a valley weather station may record moderate rain while adjacent steep scarps experience localized cloudbursts.
2. **Coarse Spatial Geocoding Bias:** Historical disaster reports geocode landslides using village centers or highway mileposts. Consequently, 98.9% of catalog records are centroid approximations (1–25 km radius), causing 14.7% of failure points to sample artificially low slopes ($< 5^\circ$) located on valley floors rather than the steep failure crowns.
3. **Temporal Uncertainty & Rainfall Look-Ahead Leakage:** Catalog inventories record calendar dates but omit intraday failure hours (0 out of 368 records have hourly timestamps). Using standard daily rainfall records risks incorporating rainfall that occurred *after* the slide had already failed, leading to target leakage in machine learning models.
4. **Information Asymmetry in Remote Communities:** Citizens on isolated mountain roads often discover slope collapses hours before state authorities. Existing disaster management portals lack accessible, responsive mobile citizen interfaces with client-side offline caching, photo verification, and transparent status feedback.
5. **Absence of Negative Controls:** Landslide inventories record occurrences (presence-only data). Without geotechnically verified negative samples (stable slopes under identical rainfall), conventional supervised classification suffers severe sampling bias.

---

## 4. Proposed Solution

SlopeGuard addresses these challenges through a multi-tier, full-stack architecture that unites automated environmental telemetry, satellite terrain analysis, supervised AI hazard estimation, and citizen science:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Citizen & Community Tier                           │
│   • Leaflet Interactive GIS Map with Terrain, Satellite & Sensor Overlays   │
│   • Geocoded Incident Reporting with Multi-photo Upload & Client Validation │
│   • Offline Progressive Web App Caching & Realtime Bell Notifications       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / JWT / Multipart
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   SlopeGuard Backend Core (Spring Boot 3)                   │
│   • Stateless JWT Auth (Citizen, Field Officer, Admin Roles)                │
│   • Copernicus DEM GLO-30 Raster Engine (30m Elevation, Slope, Aspect)      │
│   • Open-Meteo REST Client (Live Current & Hourly Precipitation Feeds)       │
│   • Spatial/Temporal Early-Warning Alert Deduplication & Lifecycle Dispatch │
│   • Append-Only Administrative Audit Logging (JpaAuditService)              │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
    Internal REST       │                             │ JPA / Hibernate
    POST /predict       ▼                             ▼
┌───────────────────────────────────┐    ┌────────────────────────────────────┐
│      Python AI Microservice       │    │         Persistence Layer          │
│   • FastAPI (Port 8000)           │    │   • MySQL 8.x (Production)        │
│   • Random Forest Classifier      │    │   • H2 In-Memory (Test/Standalone) │
│   • Strict Governance Enforcement │    │   • Local Storage for Photographs  │
└───────────────────────────────────┘    └────────────────────────────────────┘
```

### Key Solution Pillars:
* **Real-time Environmental Fusion:** Rather than static risk maps, SlopeGuard queries Open-Meteo on-the-fly for live precipitation and merges it with Copernicus DEM GLO-30 elevation, slope, and aspect.
* **Citizen-to-Authority Triage:** Citizens report cracking, rockfalls, or road blockages with photos. Administrative officers review and verify reports, immediately reflecting ground truth on the public map.
* **Alert Deduplication:** Prevents alarm fatigue by clustering alerts within spatial radius and temporal thresholds before dispatch.
* **Scientific Honesty:** Implements immutable governance indicators across the UI and APIs, warning users that AI estimates are candidate prototype indicators pending regional sensor telemetry.

---

## 5. Objectives and Scope

### 5.1 Primary Objectives
1. Provide a working, demonstrable end-to-end prototype for Smart India Hackathon (SIH) 2026 showcasing integrated disaster monitoring for Northeast India.
2. Deliver a unified web GIS interface combining terrain contours, weather metrics, historical events, and real-time hazard markers.
3. Build an auditable backend managing user authentication, incident reporting, photo verification, and alert deduplication.
4. Establish a scientifically honest ML pipeline that audits data leakage, documents spatial/temporal gaps, and enforces AI governance.

### 5.2 Functional Scope (Implemented & Verified)
* **User Accounts:** Registration, login, role-based authorization (`ROLE_CITIZEN`, `ROLE_ADMIN`, `ROLE_ANALYST`), BCrypt password hashing, stateless JWT issuance.
* **Public & Citizen Web App:** Interactive Leaflet GIS map (`/map.html`), public overview (`/index.html`), incident report submission with client-side image compression (`/report-incident.html`), citizen report history (`/my-reports.html`).
* **Field & Admin Operations:** Incident review workflow (`/admin/dashboard.html`, `/admin/assessments.html`), alert generation and deduplication (`/admin/alerts.html`), immutable audit log inspection (`/admin/audit-logs.html`).
* **Environmental Data Engine:** Automated 30m DEM raster processor for slope and aspect; live Open-Meteo client querying precipitation feeds.
* **AI Prediction Microservice:** FastAPI microservice serving Random Forest predictions on verified feature schemas with governance invariants.

### 5.3 Out-of-Scope (Planned / Future Work)
* Direct sirens or public SMS dispatch via telecom gateways (prohibited until model achieves formal GSI certification).
* Automated landslide scar delineation via real-time satellite SAR interferometry (Sentinel-1 InSAR coherence).
* Multi-sensor IoT telemetry (in-situ piezometers, tiltmeters, wire extensometers).

---

## 6. System Architecture

The SlopeGuard architecture is organized into four distinct decoupled tiers:

### 6.1 Client Presentation Tier
* **Core Technologies:** Vanilla HTML5, CSS3, JavaScript (ES2022), Leaflet GIS 1.9.4.
* **Design System:** Earthy minimal aesthetic with high-contrast slate borders, dark-green glassmorphism accents, and accessible typography (Inter / Outfit / system sans-serif).
* **Communication:** Asynchronous `fetch()` wrapper (`js/core/api.js`) featuring 15-second abort timeouts, CSRF token forwarding (`X-XSRF-TOKEN`), Bearer JWT injection, and fallback mock support.

### 6.2 Application Core Tier (Spring Boot)
* **Framework:** Spring Boot 3.2.4 running on Java 17 LTS.
* **Security Layer:** Stateless Spring Security filter chain with JWT authentication filter and role-based endpoint permissions.
* **GIS Engine:** `DefaultTerrainService` reads 1-arc-second Copernicus DEM GLO-30 rasters directly (`dem/copernicus_dem_glo30_shillong.asc`, 540x540 cells) to extract elevation and calculate 2D slope gradients and compass aspect azimuths.
* **Weather Client:** `DefaultOpenMeteoClient` executes non-blocking HTTP requests to Open-Meteo with 5-second connection/read timeouts and an in-memory cache.
* **Deduplication Engine:** `JpaAlertService` checks active alerts within a configured spatial threshold before generating new notifications.

### 6.3 Machine Learning Inference Tier (Python FastAPI)
* **Framework:** Python 3.11 with FastAPI and Uvicorn ASGI server running on port 8000.
* **Model Engine:** Scikit-Learn Random Forest Classifier trained on balanced feature fixtures.
* **Governance Pipeline:** Evaluates input features, returns uncalibrated hazard scores, and injects mandatory governance metadata into every response.

### 6.4 Persistence Tier
* **Primary Database:** MySQL 8.0 with InnoDB engine, utf8mb4 character set, and Hikari connection pooling.
* **Test / Standalone Database:** H2 in-memory database operating in MySQL compatibility mode (`MODE=MySQL`) for zero-dependency test execution and offline demonstrations.
* **Schema Evolution:** Flyway database migrations (`V1__init_schema.sql`, `V100__ragul_module1_schema.sql`) enforcing version-controlled DDL.
* **Media Storage:** Isolated local directory (`./data/uploads`) storing incident photographs with UUID-prefixed filenames and MIME type verification.

---

## 7. Technology Stack

| Technology | Version / Spec | Purpose in SlopeGuard | Implementation Status |
| :--- | :--- | :--- | :---: |
| **HTML5 & Vanilla CSS3** | Modern Standards | Responsive web layout, custom components, accessible forms | **VERIFIED** |
| **Vanilla JavaScript (ES2022)** | ES2022 Native | Client logic, API client, geolocation, state management | **VERIFIED** |
| **Leaflet.js** | 1.9.4 | Interactive web GIS map, tile rendering, marker clustering | **VERIFIED** |
| **OpenStreetMap & CartoDB** | Web Tile Providers | Base raster map layers for satellite and topography | **VERIFIED** |
| **Java** | 17 LTS (OpenJDK) | Core backend runtime environment | **VERIFIED** |
| **Spring Boot** | 3.2.4 | Enterprise REST API, dependency injection, application container | **VERIFIED** |
| **Spring Security & jjwt** | 6.x / 0.12.5 | Stateless JWT authentication, RBAC, BCrypt password hashing | **VERIFIED** |
| **Spring Data JPA & Hibernate** | 3.2.4 / 6.4.4 | Object-relational mapping, data repositories, transactions | **VERIFIED** |
| **Flyway** | 9.22.3 | Database versioning and automated DDL schema migrations | **VERIFIED** |
| **MySQL** | 8.0+ | Persistent production relational database | **VERIFIED** |
| **H2 Database** | 2.2.224 | In-memory relational database for automated test suites | **VERIFIED** |
| **Python** | 3.11.9 | AI microservice runtime and data engineering pipelines | **VERIFIED** |
| **FastAPI & Uvicorn** | 0.111 / 0.30.1 | High-performance ASGI microservice serving ML predictions | **VERIFIED** |
| **Scikit-Learn** | 1.5.0+ | Random Forest model training, inference, and metrics | **VERIFIED** |
| **Pandas & NumPy** | 2.2+ / 1.26+ | Data ingestion, geographic ledger verification, raster math | **VERIFIED** |
| **Open-Meteo REST API** | Forecast v1 | Near real-time and hourly precipitation data acquisition | **VERIFIED** |
| **Copernicus DEM GLO-30** | 30m Resolution | Satellite elevation, terrain slope, and aspect extraction | **VERIFIED** |
| **NASA GLC Inventory** | 368 NER Events | Historical landslide presence-only catalog export | **VERIFIED** (Prototype) |
| **GADM Level 1 GeoJSON** | EPSG:4326 | Authoritative India state boundaries for point-in-polygon checks | **VERIFIED** |

---

## 8. Functional Modules

### 8.1 Authentication & User Management
* **Endpoints:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
* **Features:** Enforces unique email constraints, validates password complexity, issues HMAC-SHA256 signed JWTs with 15-minute expirations, and supports citizen and administrator roles.
* **Status:** Verified (14 passing tests in `AuthControllerTest`).

### 8.2 Citizen Incident Reporting
* **Endpoints:** `POST /api/reports`, `GET /api/reports`, `GET /api/reports/my`.
* **Features:** Validates coordinates within terrestrial bounds, records severity, description, category, and binds report ownership to the authenticated citizen.
* **Status:** Verified (8 passing tests in `CitizenReportOwnershipTest`).

### 8.3 Incident Photo Upload & Serving
* **Endpoints:** `POST /api/reports/{id}/photos`, `GET /api/photos/{filename}`.
* **Features:** Multi-part file upload with strict MIME validation (`image/jpeg`, `image/png`), 5MB size limit, sanitization against directory traversal (`../`), and isolated local disk persistence.
* **Status:** Verified (10 passing tests in `PhotoUploadTest`).

### 8.4 Administrative Review & Audit Trail
* **Endpoints:** `GET /api/admin/reports`, `PATCH /api/admin/reports/{id}/review`, `GET /api/admin/audit-logs`.
* **Features:** Admin triage transitions (`PENDING` $\to$ `VERIFIED` / `REJECTED` / `RESOLVED`). Every status change or threshold update automatically generates an immutable audit record logging timestamp, user ID, client IP, action, and rationale.
* **Status:** Verified (12 passing tests in `AdminReviewAndAuditTest`).

### 8.5 Copernicus DEM Terrain Engine
* **Service:** `DefaultTerrainService` & `SlopeCalculator`.
* **Features:** Georeferenced parsing of 30-meter DEM ASCII rasters. Calculates elevation in meters, 2D slope gradient using Horn's algorithm, and compass downslope azimuth aspect ($0^\circ \le \theta < 360^\circ$).
* **Status:** Verified (8 passing tests in `TerrainServiceTest` and `SlopeCalculatorTest`).

### 8.6 Environmental Rainfall Integration
* **Service:** `DefaultOpenMeteoClient`.
* **Features:** Queries Open-Meteo REST API for current precipitation, 24-hour antecedent rainfall, and 72-hour cumulative rainfall with in-memory caching and timeout guards.
* **Status:** Verified (Passed live network connectivity test against Open-Meteo).

### 8.7 Early Warning Risk Assessment & Deduplication
* **Endpoints:** `POST /api/assessments`, `GET /api/alerts`.
* **Features:** Fuses terrain slope, elevation, aspect, and rainfall metrics into composite hazard scores categorized into candidate tiers (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`). Deduplicates active alerts within spatial radius and suppression windows.
* **Status:** Verified (15 passing tests in `RiskAssessmentAndAlertTest`).

### 8.8 Interactive Web GIS Map
* **Page / Script:** `map.html` & `js/components/risk-map.js`.
* **Features:** Leaflet map with base layer toggling, historical landslide clusters, live sensor monitoring points, custom SVG hazard icons, citizen report markers, and prominent governance warning banners.
* **Status:** Verified.

---

## 9. AI Methodology & Governance

### 9.1 Machine Learning Architecture
The AI service (`/ai-service`) implements a supervised ensemble pipeline:
* **Algorithm:** Random Forest Classifier (`landslide_rf_model.joblib`, 100 estimators, balanced class weights).
* **Input Feature Vector:**
  1. `slope_deg`: Topographic slope angle in degrees ($0^\circ - 90^\circ$).
  2. `elevation_m`: Terrain height above sea level in meters.
  3. `aspect_deg`: Downslope compass orientation in degrees ($0^\circ - 360^\circ$).
  4. `rainfall_24h_mm`: Cumulative strictly prior 24-hour precipitation.
  5. `rainfall_72h_mm`: Cumulative strictly prior 72-hour precipitation.
  6. `soil_moisture_index`: Normalized moisture index derived from antecedent rainfall.

### 9.2 Data Leakage Prevention (Strictly Prior Windows)
Historical versions of precipitation aggregation suffered from potential look-ahead leakage. The Version 3 feature pipeline strictly enforces antecedent windows:
$$\text{Window}_{24h} = [T_0 - 24\text{h}, T_0), \quad \text{Window}_{72h} = [T_0 - 72\text{h}, T_0)$$
Rainfall occurring on or after the failure date ($T_0$) is strictly isolated to prevent model training on post-event rainfall.

### 9.3 Probability Calibration Deferral
Empirical analysis of classifier outputs demonstrated that uncalibrated model scores $S(x) \in [0, 1]$ represent relative ranking metrics rather than true mathematical probabilities $P(Y=1|X=x)$. Applying non-parametric Isotonic Regression or parametric Platt Scaling on unverified presence-only data distorts risk scores. Therefore, **calibration is explicitly deferred** (`CALIBRATION_DEFERRED`), and outputs are served as relative hazard scores (`UNCALIBRATED_HAZARD_SCORE`).

### 9.4 Mandatory Governance Invariants
All API payloads, models, and UI banners must preserve the four core governance flags:
1. `DEMO_NOT_VALIDATED`: Model artifact is an unvalidated prototype.
2. `CALIBRATION_DEFERRED`: No unverified probability scaling is applied.
3. `UNCALIBRATED_HAZARD_SCORE`: Hazard values represent exploratory indicators.
4. `PENDING_EXPERT_REVIEW`: Warning thresholds require formal sign-off by GSI and NDMA experts.
5. `DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`: Dataset lacks intraday timestamps, high-accuracy GPS scar coordinates, and verified non-failing controls.

---

## 10. Data Sources & Data Governance

### 10.1 Historical Landslide Inventory Lineage
The historical event dataset was extracted from the NASA Global Landslide Catalog (GLC):
* **Global Inventory:** 11,033 events (`Global_Landslide_Catalog_Export_rows.csv`, SHA-256: `2c4898899...`)
* **All-India Records:** 1,265 events
* **Accepted Northeast India Records:** **368 events**
* **Excluded Corridor Records:** **74 events** in the Darjeeling-Jalpaiguri corridor (West Bengal), excluded to maintain strict alignment with the 8 official NER states.

### 10.2 State Distribution of Accepted NER Events (368 Events)
| State | Count | Percentage | Primary Landslide Corridor |
| :--- | :---: | :---: | :--- |
| **Assam** | 82 | 22.28% | Dima Hasao, Karbi Anglong, Cachar Hills, Guwahati |
| **Nagaland** | 78 | 21.20% | Kohima-Dimapur highway (NH-29), Mokokchung, Phek |
| **Manipur** | 56 | 15.22% | Imphal-Jiribam road (NH-37), Senapati, Tamenglong |
| **Sikkim** | 48 | 13.04% | Teesta Valley axis (NH-10), Mangan, Gangtok |
| **Arunachal Pradesh** | 45 | 12.23% | Bhalukpong-Tawang axis, Papum Pare, Upper Subansiri |
| **Meghalaya** | 29 | 7.88% | Shillong-Guwahati road, Cherrapunji, East Jaintia Hills |
| **Mizoram** | 27 | 7.34% | Aizawl municipality, Lunglei, Champhai |
| **Tripura** | 3 | 0.82% | Atharamura hill range, Jampui Hills |
| **Total Accepted** | **368** | **100.00%** | **8 Official NER States** |

### 10.3 Institutional Sources Evaluation (Phase 12.8 Register)
SlopeGuard assessed six official institutional sources for future operational integration:
1. **Geological Survey of India (GSI) — Bhukosh:** 1:50k NLSM susceptibility vectors. Open web map viewer; bulk shapefile export requires formal academic credentialing.
2. **Assam State Disaster Management (ASDMA) — DRIMS:** Verified revenue-circle incident logs with GPS coordinates. Access restricted to authorized district officers.
3. **Sikkim State Disaster Management (SSDMA) — SEOC:** Incident registers for NH-10. Real-time updates via social advisories; raw database requires institutional MoU.
4. **Copernicus Data Space Ecosystem (CDSE):** Sentinel-1 SAR and Sentinel-2 optical imagery. Open access via STAC API.
5. **Survey of India (SOI) — NGP:** 1:50k Topographic contours and cadastre boundaries. Open Data policy for registered Indian research institutions.
6. **India Meteorological Department (IMD):** Daily gridded $0.25^\circ \times 0.25^\circ$ rainfall data & Automatic Weather Stations (AWS). Available via formal request to NDC Pune.

---

## 11. Complete Development History & Phases

The complete chronological development trajectory of SlopeGuard, synthesizing all historical phase reports, is summarized below:

| Phase | Phase Title & Focus | Work Performed & Key Deliverables | Status | Known Limitations & Remaining Tasks |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Repository Initialization & Architecture | Set up directory layout, Git workflow, technology baseline, and SIH scope. | Complete | Initial scaffolding only. |
| **2** | Core Design System & Shared UI | Built Earthy Minimal tokens (`tokens.css`, `components.css`), shell layouts, responsive viewports. | Complete | Focused on static mockup. |
| **3** | Interactive GIS & Map Component | Integrated Leaflet 1.9, regional bounding boxes, custom marker styling, and layer controls. | Complete | Depended on mock data. |
| **4** | Spring Boot Core & Security | Configured Spring Boot 3, JWT stateless auth, BCrypt encryption, role filters (`CITIZEN`, `ADMIN`). | Complete | Initial in-memory persistence. |
| **5** | Citizen Incident & Photo Store | Built report controller, image upload, MIME/size validation, local disk photo store. | Complete | Needed live database wiring. |
| **6** | Python AI Microservice Prototype | Created FastAPI inference service, Random Forest prototype, `/predict` endpoint. | Complete | Synthetic fixtures; uncalibrated. |
| **7** | Administrative Review & Audit Trail | Implemented triage review endpoints and append-only `AuditEvent` logging. | Complete | Required frontend integration. |
| **8** | Copernicus DEM Terrain Processing | Added `DefaultTerrainService` loading Shillong 30m DEM ASCII raster; slope/aspect math. | Complete | Limited to 1 raster tile in test bundle. |
| **9** | Production MySQL Persistence | Implemented MySQL 8.x schema via Flyway (`V1__init_schema.sql`), HikariCP connection pool. | Complete | Requires live MySQL daemon on 3306. |
| **10** | Environmental Data Integration | Added `DefaultOpenMeteoClient` for live weather; integrated rainfall into risk engine. | Complete | Open-Meteo API rate limits apply. |
| **11** | End-to-End System Integration | Connected frontend to Spring Boot (8080) and AI service (8000); verified CORS. | Complete | Tested against live endpoints. |
| **12** | Historical Data Acquisition | Extracted 368 NER landslide events from NASA GLC; downloaded 30 Copernicus DEM tiles. | Complete | Presence-only records; no negative controls. |
| **12.1** | Dataset Integrity Audit | Audited Copernicus DEM georeferencing, downslope azimuths, and rainfall UTC/IST window offsets. | Complete | Identified need for strict prior window. |
| **12.2** | Regional Counts Reconciliation | Reconciled state event distributions across 8 NER states; isolated 74 West Bengal corridor records. | Complete | Narrative discrepancies resolved in code. |
| **12.3** | Independent Lineage Verification | Computed dynamic state counts from source CSVs without hardcoded assumptions; verified SHA-256 hashes. | Complete | All 368 events verified against source files. |
| **12.4** | Geographic Boundary Verification | Conducted point-in-polygon checks using GADM Level 1 administrative boundaries in EPSG:4326. | Complete | 14 border records geographically confirmed; 2 pending. |
| **12.5** | Historical Dataset Readiness Assessment | Evaluated suitability for scientific training; found 0/368 failure hours and 54 low-slope centroid anomalies. | Complete | Verdict: `DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION`. |
| **12.6** | Evidence Acquisition Planning | Stratified 368 events into 4 priority recovery tiers; established official institutional source register. | Complete | Created actionable data recovery roadmap. |
| **12.7** | Targeted Event Evidence Verification | Audited 52 Tier 1 events via Wayback Machine & news links: 15 corroborated, 0 failure hours, 0 surveyed scars. | Complete | Confirmed media links do not prove failure hours. |
| **12.8** | Institutional Sourcing Assessment | Evaluated 6 institutional authorities (GSI, ASDMA, SSDMA, CDSE, SOI, IMD); drafted matching plan. | Complete | Inaccessible portals marked; no false downloads. |
| *Future* | Geotechnical Verification & Operationalization | Procure GSI surveyed crowns, sample negative non-failing slopes, establish empirical $I-D$ curves, seek NDMA sign-off. | Planned | Dependent on institutional formal agreements. |

---

## 12. Dataset Integrity & Scientific Limitations

An exhaustive review of the 368 historical landslide events in Northeast India reveals four fundamental geotechnical limitations that prevent defensible operational early-warning deployment:

1. **Total Absence of Intraday Failure Timestamps (0 / 368 Events):**
   * 100% of events record only calendar dates. No record specifies the exact failure hour or minute.
   * *Impact:* Antecedent rainfall cannot be calculated without arbitrary window cutoffs. Using whole-day rainfall leaks post-failure rain into the model; using strictly prior-day rainfall misses triggering monsoonal cloudbursts.
2. **Coarse Spatial Geocoding & Valley-Bottom Bias (98.91% Centroids):**
   * Only 4 out of 368 events (1.09%) have exact GPS surveyed scar coordinates.
   * 364 events (98.91%) are approximate centroids (1–25 km radius) centered on towns or highways.
   * *Low-Slope Anomaly:* In Copernicus DEM (30m resolution), **54 out of 368 events (14.67%)** exhibit slope angles **under $5.0^\circ$** (with 18 events under $2.0^\circ$). Real landslides initiate on steep mountain slopes, not flat valley floors; this is an artifact of geocoding settlements rather than failure scars.
3. **Presence-Only Bias & Zero Negative Controls:**
   * The catalog contains only positive failure events. There are zero geotechnically surveyed negative controls (stable slopes that received intense rainfall without failing).
   * *Impact:* Training conventional ML classifiers on presence-only data with random pseudo-negatives introduces severe false-negative bias.
4. **Media Publication Lag:**
   * In Phase 12.7's audit of 52 events, 71.1% of URLs were broken (404/DNS expired) or contained regional casualty reports published days after the event. Publication dates cannot substitute for geotechnical occurrence times.

---

## 13. Testing & Verification

SlopeGuard maintains an extensive automated test suite covering all layers of the application:

### 13.1 Automated Test Execution Summary
* **Python AI Microservice Suite (`pytest 8.4.2`):**
  * **Command:** `python3.11 -m pytest ai-service/tests -v`
  * **Results:** **110 passed**, **0 failed**, **0 errors**, **0 skipped** (8.34 seconds).
  * **Scope:** FastAPI endpoints, governance flag injection, temporal split leakage checks, GADM point-in-polygon verification, 4-tier event stratification, and provenance hash verification.
* **Spring Boot Backend Suite (`Maven Wrapper / JUnit 5`):**
  * **Command:** `cmd /c "cd slopeguard-backend && mvnw.cmd test"`
  * **Results:** **120 tests run: 114 passed**, **0 failures**, **0 errors**, **6 skipped** (53.59 seconds, `BUILD SUCCESS`).
  * **Explanation of Skipped Tests:** The 6 skipped tests reside in `LiveMySQLPersistenceIntegrationTest`. They use JUnit 5 `Assumptions.assumeTrue(...)` to check whether a live standalone MySQL daemon is actively running on port 3306. When MySQL is stopped, they cleanly skip without failing. The exact same persistence schema, Flyway migrations, and repositories are verified by the 114 passing tests executed against the in-memory H2 database.
  * **Live Network Connectivity:** `LiveOpenMeteoConnectivityTest` passed against the live external Open-Meteo REST service.

### 13.2 Security & Integration Audits
* **Authentication Security:** Verified BCrypt password hashing (strength 10), HMAC-SHA256 JWT signature verification, and role-based 403 authorization rejections for unauthorized routes.
* **Upload Safety:** Photo uploads strictly reject non-image MIME types and sanitize filenames to prevent path traversal.
* **API Resilience:** Frontend API client (`js/core/api.js`) enforces a 15-second abort timeout and falls back to offline notifications when network connectivity is lost.

---

## 14. Local Setup & Service Startup

### 14.1 Prerequisites
* **Operating System:** Windows 10 / 11 (PowerShell & Command Prompt)
* **Java Development Kit:** OpenJDK 17 LTS or higher (`java -version`)
* **Python:** Python 3.11 (`python3.11 --version`)
* **Relational Database:** MySQL 8.0+ (Optional for test mode; required for live MySQL persistence)
* **Build Tools:** Maven Wrapper included (`mvnw.cmd`)

### 14.2 Service Ports Reference
* **Frontend Web Server:** `http://localhost:5500`
* **Spring Boot Backend:** `http://localhost:8080` (API base: `http://localhost:8080/api`)
* **Python AI Service:** `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
* **MySQL Database:** `localhost:3306`

---

### 14.3 Startup Procedure (Three Terminals)

#### Terminal 1: Start Python AI Service (Port 8000)
```powershell
cd C:\Users\sakth\OneDrive\Desktop\SlopeGuard\ai-service
python3.11 -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload
```
*Verification:* Open `http://127.0.0.1:8000/health` in your browser. Expected response:
`{"status":"ok","service":"slopeguard-ai-service","version":"0.1.0-prototype"}`

#### Terminal 2: Start Spring Boot Backend (Port 8080)
1. *Ensure MySQL is running* on port 3306 (or start it via Windows Services: `net start MySQL80` as Administrator).
2. *Create the database schema:*
   ```sql
   CREATE DATABASE IF NOT EXISTS slopeguard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. *Launch the backend:*
   ```powershell
   cd C:\Users\sakth\OneDrive\Desktop\SlopeGuard\slopeguard-backend
   .\mvnw.cmd spring-boot:run
   ```
   *(Note: For instant zero-dependency demonstration without MySQL, launch using H2 in-memory mode:)*
   ```powershell
   .\mvnw.cmd spring-boot:run -Dspring-boot.run.arguments="--spring.datasource.url=jdbc:h2:mem:slopeguard;DB_CLOSE_DELAY=-1;MODE=MySQL --spring.datasource.driverClassName=org.h2.Driver --spring.datasource.username=sa --spring.datasource.password= --spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
   ```
*Verification:* Open `http://localhost:8080/actuator/health`. Expected response: `{"status":"UP"}`

#### Terminal 3: Start Frontend HTTP Server (Port 5500)
```powershell
cd C:\Users\sakth\OneDrive\Desktop\SlopeGuard
python3.11 -m http.server 5500 --bind 127.0.0.1
```
*Access UI:* Navigate to **`http://127.0.0.1:5500/index.html`** or **`http://127.0.0.1:5500/map.html`**.

---

## 15. Environment & Security Configuration

SlopeGuard relies on externalized configuration properties defined in `slopeguard-backend/src/main/resources/application.properties` and overridable via environment variables.

| Configuration Key | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Backend HTTP listening port |
| `SLOPEGUARD_DB_URL` | `jdbc:mysql://localhost:3306/slopeguard?...` | JDBC database connection string |
| `SLOPEGUARD_DB_USERNAME` | `root` | Database username |
| `SLOPEGUARD_DB_PASSWORD` | *(empty string)* | Database user password |
| `JWT_SECRET` | *(32+ char dev secret)* | HMAC-SHA256 signing secret for authentication tokens |
| `JWT_EXPIRATION_SECONDS` | `900` | Access token lifespan (15 minutes) |
| `AI_SERVICE_BASE_URL` | `http://localhost:8000` | Target address of the Python FastAPI prediction microservice |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com/v1/forecast` | Meteorological precipitation API endpoint |
| `UPLOAD_DIR` | `./data/uploads` | File storage path for citizen incident photos |
| `MAX_FILE_SIZE` | `5242880` | Maximum photo upload size (5 MB per file) |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5500,http://127.0.0.1:5500...` | Whitelisted frontend origins for browser security |

*Security Directive:* Never commit production passwords or real credentials to Git. Development template variables are documented in `slopeguard-backend/.env.example`.

---

## 16. GitHub Workflow & Deployment

* **Remote Origin:** `https://github.com/sakthivel-rajendhran/Land-Slide_Monitoring-System.git`
* **Development Branch:** `dev` (active integration branch for all pull requests)
* **Feature Branches:** Individual module ownership branches (`feature/sakthivel`, `feature/ragul`, `feature/sagin`).
* **Source Control Practices:**
  * Large DEM raster binaries (`ai-service/data/dem_tiles/*.tif`, ~1.3 GB) are strictly excluded via `.gitignore` to avoid repository bloat.
  * Build artifacts (`target/`), caches (`.pytest_cache/`, `__pycache__/`), and upload folders (`data/uploads/`) are excluded.
* **Production Deployment Architecture (Planned):**
  * Containerized multi-service deployment using Docker Compose:
    1. Container 1: Nginx reverse proxy serving static frontend files with SSL termination.
    2. Container 2: Spring Boot 3 Java runtime container.
    3. Container 3: Python 3.11 FastAPI microservice container.
    4. Container 4: MySQL 8.0 container with persistent volume mounts.

---

## 17. Expected Benefits

1. **Integrated Situation Awareness:** Combines top-down satellite elevation and weather telemetry with bottom-up citizen field reports on a single map.
2. **Reduced Alarm Fatigue:** Spatial and temporal alert deduplication prevents flooding emergency channels with duplicate warnings.
3. **Transparent Decision Support:** Provides state disaster managers with an immutable audit log of all incident reviews and threshold adjustments.
4. **Resilient Public Access:** Lightweight static web client with offline caching ensures access over low-bandwidth 2G/3G mobile connections in remote mountain corridors.
5. **Scientific Rigor & Ethical AI:** By enforcing explicit governance disclaimers, SlopeGuard establishes a benchmark for responsible AI deployment in disaster management.

---

## 18. Limitations & Future Enhancements

### 18.1 Current System Limitations
1. **Model Validation Gap:** Model is trained on balanced synthetic fixtures and uncalibrated against real-world field outcomes.
2. **Missing Intraday Failure Times:** Historical inventories lack hour/minute resolution, preventing precise calibration of empirical intensity-duration ($I-D$) curves.
3. **Valley-Bottom Geocoding:** Coarse event centroids produce low-slope anomalies in flat valley bottoms.
4. **Single-Tile Local DEM:** The automated test suite bundles a single 540x540 DEM raster tile (Shillong region); full Northeast coverage requires dynamic tile retrieval.

### 18.2 Future Enhancement Roadmap
1. **Institutional Data Integration:** Establish formal data-sharing agreements with GSI for 1:50k NLSM shapefiles and ASDMA for verified revenue-circle incident logs.
2. **SAR Interferometry:** Incorporate Sentinel-1 InSAR coherence change detection to identify creeping ground deformation prior to catastrophic failure.
3. **IoT Sensor Feeds:** Ingest live telemetry from physical borehole piezometers and MEMS tiltmeters deployed along critical highways (e.g., NH-10).
4. **Public Warning Gateway:** Integrate with the National Disaster Management Authority (NDMA) Common Alerting Protocol (CAP) for geo-fenced SMS alerts.

---

## 19. Conclusion

SlopeGuard demonstrates a robust, full-stack disaster management architecture that integrates modern web GIS, enterprise Java backend engineering, live meteorological APIs, and machine-learning decision support. Developed for Smart India Hackathon 2026, the project bridges community citizen reporting with administrative oversight while adhering to the highest standards of scientific honesty and software verification.

With 110 automated Python tests and 114 Java backend tests passing cleanly, the system is demonstrably stable, auditable, and ready for live hackathon jury presentation. It provides an extensible foundation for future operational integration with state disaster management agencies across Northeast India.

---

## 20. References

1. **NASA Global Landslide Catalog (GLC):** Kirschbaum, D. B., et al. (2010). *A global landslide catalog for hazard applications: method, results, and limitations.* Natural Hazards, 52(3), 561-575.
2. **Copernicus DEM (ESA):** European Space Agency. (2021). *Copernicus Digital Elevation Model (GLO-30 Public DSM).* Open Access Hub.
3. **Open-Meteo Weather API:** Zippenfenig, P. (2023). *Open-Meteo: Open-Source Weather API.* [https://open-meteo.com/](https://open-meteo.com/).
4. **Geological Survey of India (GSI):** *National Landslide Susceptibility Mapping (NLSM) Programme & Bhukosh Geospatial Portal.* [https://bhukosh.gsi.gov.in/](https://bhukosh.gsi.gov.in/).
5. **Assam State Disaster Management Authority (ASDMA):** *Disaster Reporting and Information Management System (DRIMS).* [https://asdma.assam.gov.in/](https://asdma.assam.gov.in/).
6. **Leaflet Open-Source GIS:** Agafonkin, V. (2024). *Leaflet: An open-source JavaScript library for mobile-friendly interactive maps.* [https://leafletjs.com/](https://leafletjs.com/).
7. **GADM Administrative Boundaries:** Global Administrative Areas database. (2022). *GADM Level 1 India Administrative Boundaries (v4.1).* [https://gadm.org/](https://gadm.org/).
