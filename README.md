# SlopeGuard — AI-Powered Landslide Risk Monitoring & Early Warning System

SlopeGuard is an intelligent landslide hazard monitoring and early warning system designed to protect vulnerable communities and assist disaster management authorities in mountainous regions such as the Western Ghats of India.

---

## 🎨 Master Design System — Cinematic Dark-Green Glassmorphism

This project follows a premium, cinematic **dark-green glassmorphism design language** inspired by environmental intelligence and modern SaaS design standards:

| Purpose | Color / Value | Role |
| :--- | :--- | :--- |
| **Primary lime** | `#C7F464` | Solid primary buttons, calls to action, active indicators, brand accents |
| **Light lime** | `#D9FF8F` | Highlights, badge indicators, secondary logo facet |
| **Hover lime** | `#B7E84A` | Primary button interactive hover state (solid) |
| **Active lime** | `#A6D93D` | Primary button pressed/active state (solid) |
| **Primary button text** | `#101509` | High-contrast dark text and arrows on lime buttons |
| **Main background** | `#070B08` | Deep near-black forest canvas |
| **Secondary background** | `#0B120D` | Alternating section depth (`#about`, `#features`) |
| **Elevated background** | `#111A13` | Elevated inner containers & cards |
| **Primary body text** | `#F5F7F2` | High-contrast headlines and labels |
| **Secondary text** | `#BFC6B6` | Subtitles, descriptions, muted copy |
| **Muted text** | `#879280` | Captions, technical metadata, disabled states |
| **Glass card surface** | `rgba(20, 25, 17, 0.72)` | Translucent frosted-glass panels (`blur: 18px`) |
| **Subtle glass border** | `rgba(215, 245, 160, 0.16)`| Subtle, translucent card & navbar borders |
| **Highlight border** | `rgba(199, 244, 100, 0.32)`| Hover focus borders & active states |
| **Low risk** | `#8FD694` | Green safe zones & base thresholds |
| **Moderate risk** | `#E8D17A` | Amber moderate hazard warnings |
| **High risk** | `#F1A46B` | Orange elevated hazard zones |
| **Severe risk** | `#F07878` | Coral/Red critical landslide hotspot alerts |

### Global Sharp-Corner Shape System
SlopeGuard uses a clean, squared-off rectangular geometry system with subtle 3–6px radius values, replacing pill-shaped or exaggerated rounded corners across all components:

| Token | Value | Applied To |
| :--- | :--- | :--- |
| `--radius-button` | `4px` | Primary, secondary, hero, login, and filter buttons |
| `--radius-input` | `4px` | Form text inputs, search fields, checkboxes |
| `--radius-card` | `6px` | Feature cards, factor cards, visual study cards |
| `--radius-panel` | `6px` | Map stage wrappers, telemetry HUD, legend cards, CTA panels |
| `--radius-modal` | `6px` | Authentication cards, dialogs, popovers |
| `--radius-badge` | `3px` | Section badges, announcement tags, status pills, chart labels |
| `--radius-navbar` | `6px` | Sleek rectangular glass navigation bar |
| `--radius-icon-box` | `4px` | Icon containers, visual badge squares, target nodes |

### Solid Lime Rectangular Button Standard
- **Sharp Rectangular Geometry**: All primary action buttons (`.btn-primary`, `.btn-hero-primary`, `.nav-cta-btn`, `.btn-sign-in`, form submits) use `border-radius: 4px` with a clean, solid `#C7F464` background and `#101509` text.
- **Zero Gradients & Neon Glows**: No gradient overlays or neon `box-shadow` / glowing halos. Buttons retain subtle neutral shadows (`0 2px 8px rgba(0, 0, 0, 0.28)`) strictly for clean visual elevation.
- **Consistent States**:
  - *Default*: Solid `#C7F464`, text `#101509`, `border-radius: 4px`
  - *Hover*: Solid `#B7E84A`, text `#101509`, subtle neutral lift
  - *Active*: Solid `#A6D93D`, text `#101509`
  - *Focus*: Accessible `2px solid #C7F464` focus ring with `3px` offset, `border-radius: 4px`
  - *Disabled*: Muted solid `#303929` with `#727E6A` text
- **Secondary/Outline Buttons**: Secondary (`.btn-hero-secondary`, `.btn-secondary`), outline, and filter controls are rectangular (`border-radius: 4px`) with transparent/glass backgrounds to preserve clear visual hierarchy.

### Visual Design Rules
- **Cinematic Photography**: Full-bleed misty dark forest and mossy mountain imagery (`dark-forest-moss.jpg`) with deep atmospheric radial vignettes.
- **Rectangular Glass Navigation**: Sleek translucent glass navbar with 6px sharp radius, subtle border, and lime active-state accent.
- **Editorial Typography**: Modern sans-serif (`Plus Jakarta Sans`) paired with editorial italic serif (`Newsreader`) for hero emphasis (*Anticipate*).
- **Square-Cornered Feature Cards**: Specialized illustrative graphics representing Unified Data (converging nodes), AI Risk Assessment (wave contours), and Environmental Governance (radar target rings) enclosed in 6px glass cards.
- **Interactive Risk Map**: Dark Matter CartoDB Leaflet tiles with concentric hazard buffers, custom epicenter marker, floating telemetry HUD, and rectangular sector filter buttons.

---

## 📂 Project Architecture & Multi-Tier Structure

```
SlopeGuard/
├── frontend/                  # Modern Glassmorphic Web Client
│   ├── index.html             # Application entry router
│   ├── dashboard.html         # Authenticated Risk Monitoring Dashboard
│   ├── map.html               # Interactive GIS Risk Map
│   ├── report-incident.html   # Citizen Geotagged Incident Reporting
│   ├── css/                   # Tokens, components, and master stylesheet
│   └── js/                    # Routing guards, Leaflet GIS engine, and API services
│
├── slopeguard-backend/        # Enterprise REST Backend (Phases 1–5.1)
│   ├── src/main/java/         # Spring Boot 3.2.5 (Java 17) REST API
│   │   ├── config/            # Spring Security, JWT, CORS, Open-Meteo properties
│   │   ├── controller/        # Auth, Reports, Admin Review, Environmental Controllers
│   │   ├── service/           # Open-Meteo HTTP client, Auditing, User, Photo services
│   │   └── dto/               # Strongly-typed request/response models
│   └── pom.xml                # Maven configuration & build wrapper
│
├── ai-service/                # Machine Learning Inference Service (Phase 6)
│   ├── src/                   # Python 3.11 FastAPI service & scikit-learn pipeline
│   ├── data/                  # Schema, data dictionary, and synthetic test fixtures
│   ├── models/                # Trained Random Forest artifact (.joblib) & metadata
│   ├── tests/                 # Automated pytest suite (validation, leakage, API)
│   ├── DATA_DICTIONARY.md     # Comprehensive feature store data dictionary
│   └── requirements.txt       # Python dependencies (scikit-learn, fastapi, pandas)
│
└── README.md                  # Master repository documentation
```

---

## 🚀 How to Run Locally

### Option 1: Direct Browser Access
Open `index.html` directly in any modern web browser.

### Option 2: Local HTTP Server
```bash
npx serve .
```
or
```bash
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

---

## 📱 Full Mobile Responsiveness & Accessibility

- **Responsive Viewports**:
  - `320px`, `360px`, `390px` (Mobile phones): Compact floating header, slide-down frosted-glass navigation drawer, vertical card stacking, touch targets $\ge$ 44px, zero horizontal overflow.
  - `768px`, `1024px` (Tablets / Laptops): 2-column grids, responsive interactive risk map frame, floating HUD adjustments.
  - `1280px`, `1440px+` (Desktop displays): 3-column reference feature cards, full floating pill navigation.
- **Accessibility**:
  - Semantic HTML landmarks (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`).
  - Mobile drawer with `aria-controls`, `aria-expanded`, keyboard Escape listener, and outside-click dismissal.
  - Visible focus indicators (`2px solid #C7F464`).
  - Respects user accessibility preferences via `@media (prefers-reduced-motion: reduce)`.

---

## 🛰️ Phase 7 — Risk Assessment & Early-Warning Engine

SlopeGuard Phase 7 introduces an end-to-end environmental risk assessment pipeline and an alert management engine. It connects live Open-Meteo weather measurements, pre-flight feature completeness verification, and the local AI microservice (`http://localhost:8000`), enforcing rigorous data integrity and clear hazard distinctions.

### 1. Key Architectural Principles

- **No Data Fabrication**: If essential model features (such as `slope_deg` or weather observations) are missing, the system **never** substitutes zeros or fabricates fallback scores. Instead, it explicitly marks the assessment as `UNAVAILABLE_MISSING_FEATURES` or `UNAVAILABLE_ENVIRONMENTAL_OFFLINE`.
- **Observed vs. Forecast Precipitation Distinction**: Real-time precipitation is captured as `OBSERVED`, while future rainfall projections from numerical weather models are tagged as `FORECAST` under distinct provenance keys.
- **Distinction Notice**: All assessments strictly separate four distinct categories:
  1. *Long-term susceptibility*: Static topographic morphology and lithological vulnerability.
  2. *Current environmental conditions*: Numerical weather precipitation estimates.
  3. *Short-term hazard estimates*: Mathematical prototype projections from the AI model.
  4. *Official public warnings*: Issued exclusively by statutory authorities (NDMA/SDMA) and **never** generated or declared by this experimental software.
- **Model Status Designation**: As the model operates in `DEMO_NOT_VALIDATED` mode (Random Forest prototype trained on verified feature schema with synthetic initialization), all results are flagged as `DEMO_EXPERIMENTAL` and prohibited from representation as official emergency triggers.
- **Deterministic Alert Deduplication**: Automatically suppresses duplicate active alerts for repeated queries within a configurable distance (~500m / 0.005°) and interval (`slopeguard.alerts.deduplication-interval-minutes=60`).

---

### 2. Endpoints Added in Phase 7

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/risk-assessments` | Public | Submits coordinates & optional terrain data to execute an environmental risk assessment. |
| `GET` | `/api/alerts` | Public | Lists early-warning alerts with pagination (`page`, `size`) and optional filters (`severity`, `status`). |
| `GET` | `/api/alerts/{id}` | Public | Retrieves detailed alert record by ID with evidence and model provenance. |
| `PATCH` | `/api/alerts/{id}/status` | Admin (`ROLE_ADMIN`) | Adjudicates alert lifecycle (`ACKNOWLEDGED`, `RESOLVED`, `DISMISSED`) with audit notes. |

---

### 3. Example Request & Response

#### Request: `POST /api/risk-assessments`

```json
{
  "latitude": 25.5788,
  "longitude": 91.8933,
  "slopeDeg": 42.0,
  "elevationM": 1436.0,
  "lithology": "Quartzite",
  "soilType": "Clay-Loam"
}
```

#### Successful Response (`200 OK` — Assessed):

```json
{
  "requestId": "9c14ff10-53b9-4a9c-9c32-fb9f82d020e4",
  "assessmentTimestamp": "2026-10-13T00:54:26.015",
  "location": {
    "requested_latitude": 25.5788,
    "requested_longitude": 91.8933,
    "grid_latitude": 25.5536,
    "grid_longitude": 91.9544,
    "elevation_m": 1436.0
  },
  "riskStatus": "ASSESSED",
  "modelVersion": "0.1.0-prototype",
  "modelStatus": "DEMO_NOT_VALIDATED",
  "riskScore": 0.995,
  "riskCategory": "SEVERE",
  "isProvisionalCategory": true,
  "dataFreshness": "FRESH",
  "dataQuality": "VERIFIED_NUMERICAL_WEATHER_MODEL",
  "availableInputFeatures": {
    "observed_precipitation": {
      "featureName": "precipitation",
      "value": 0.0,
      "unit": "mm",
      "observationTimestamp": "2026-10-13T00:45",
      "provider": "Open-Meteo",
      "quality": "VERIFIED_NUMERICAL_WEATHER_MODEL",
      "measurementType": "OBSERVED"
    },
    "slope_deg": {
      "featureName": "slope_deg",
      "value": 42.0,
      "unit": "degrees",
      "observationTimestamp": "2026-10-13T00:54:26.015",
      "provider": "Client / Geotechnical Survey Input",
      "quality": "USER_OR_SURVEY_SUPPLIED",
      "measurementType": "CLIENT_SUPPLIED"
    }
  },
  "unavailableInputs": [],
  "warnings": [
    "Hazard threshold reached: provisional demonstration alert registered (id: ALERT-1791833066015-101)."
  ],
  "limitations": [
    "Predictions are based on numerical model estimates and do not incorporate sub-surface pore water pressure sensors."
  ],
  "distinctionNotice": "DISTINCTION NOTICE: 1) Long-term susceptibility reflects static terrain morphology and lithology. 2) Current environmental conditions represent numerical weather precipitation estimates. 3) Short-term hazard estimates represent mathematical prototype projections. 4) Official public warnings are issued solely by designated disaster management authorities (NDMA/SDMA) and are NOT generated or declared by this experimental software.",
  "disclaimer": "EXPERIMENTAL PROTOTYPE: This risk assessment is an uncalibrated demonstration estimate based on a research pipeline. It is not a certified disaster warning, evacuation trigger, or geotechnical guarantee of slope stability.",
  "alertTriggered": true,
  "alertId": "ALERT-1791833066015-101"
}
```

#### Safe Non-Fabrication Response (When `slope_deg` is Missing):

```json
{
  "requestId": "2f6a72e8-3df0-4b52-9b2d-cce59345c2ea",
  "riskStatus": "UNAVAILABLE_MISSING_FEATURES",
  "riskScore": null,
  "riskCategory": "UNAVAILABLE",
  "unavailableInputs": [
    "slope_deg (Topographic slope gradient angle in degrees: required by geotechnical model but not supplied in request or DEM survey)"
  ],
  "warnings": [
    "Topographic slope angle (slope_deg) is required for slope stability estimation. Cannot generate risk score without terrain morphology."
  ]
}
```

---

### 4. Running the Test Suite

#### Java Backend Test Suite (110 Tests):
```bash
cd slopeguard-backend
./mvnw test
```

#### Python AI Microservice Tests (20 Tests):
```bash
cd ai-service
python -m pytest -v tests/
```

---

## 🏔️ Phase 8 — Real DEM Integration & Automatic Terrain Feature Extraction

SlopeGuard Phase 8 introduces genuine Digital Elevation Model (DEM) processing and automated slope gradient extraction. The backend ingests verified terrain rasters, calculates geodetic slope gradients using Horn's algorithm, and enables the Phase 7 risk assessment engine to derive slope and elevation automatically without requiring manual user input.

### 1. Selected DEM Product & Access Method

- **Provider**: European Space Agency (ESA) / Airbus.
- **Product**: **Copernicus DEM GLO-30 Public DSM** (Digital Surface Model).
- **Spatial Resolution**: 1 arc-second ($\approx 30\text{ metres}$ at the equator).
- **Coordinate Reference System (CRS)**: Horizontal: `EPSG:4326` (WGS 84 ellipsoidal coordinates); Vertical: `EGM2008` geoid.
- **Licensing**: Open and free under the Copernicus Sentinel Data Policy / Copernicus WorldDEM-30 Open License for research and civil protection.
- **Access & Acquisition**: Public Cloud-Optimized GeoTIFF (COG) repository on AWS Open Data (`s3://copernicus-dem-30m/`). The 1° $\times$ 1° tile covering the Meghalaya / Shillong study area (`Copernicus_DSM_COG_10_N25_00_E091_00_DEM.tif`) was accessed and clipped to create a verified local raster fixture.
- **Coverage in Local Raster**:
  - Latitude: $25.5000^\circ\text{N}$ to $25.6500^\circ\text{N}$
  - Longitude: $91.8000^\circ\text{E}$ to $91.9500^\circ\text{E}$
  - Grid Dimension: $540 \times 540$ cells ($291,600$ verified elevation points).
  - Elevation Range: $895.51\text{ m}$ to $1,962.31\text{ m}$ above sea level (Shillong Peak plateau).

---

### 2. Slope Gradient Calculation Methodology

Slope is mathematically derived from a $3 \times 3$ moving window of elevation cells using **Horn's (1981) weighted finite-difference algorithm**:

$$\frac{\partial z}{\partial x} = \frac{(z_{ne} + 2 z_e + z_{se}) - (z_{nw} + 2 z_w + z_{sw})}{8 \cdot \Delta x}$$

$$\frac{\partial z}{\partial y} = \frac{(z_{nw} + 2 z_n + z_{ne}) - (z_{sw} + 2 z_s + z_{se})}{8 \cdot \Delta y}$$

#### Geodetic Metric Conversion:
Because coordinates are in geographic angular degrees ($\phi, \lambda$), the horizontal spacing ($\Delta x, \Delta y$) must be scaled to ground distance in **metres** at the target latitude $\phi$:
- $\Delta y = 111,132.954 \cdot \text{cellsize\_deg}\quad\text{(metres)}$
- $\Delta x = 111,412.84 \cdot \cos(\phi) \cdot \text{cellsize\_deg}\quad\text{(metres)}$

#### Gradient & Angle:
$$\text{gradient} = \sqrt{\left(\frac{\partial z}{\partial x}\right)^2 + \left(\frac{\partial z}{\partial y}\right)^2}$$
$$\text{slope}^\circ = \arctan(\text{gradient}) \cdot \frac{180^\circ}{\pi}$$

#### Boundary & NoData Safety:
- If a target point is on the raster perimeter (no complete $3 \times 3$ neighborhood) or contains a `NODATA` void pixel ($-9999$), the algorithm **never fabricates slope from a single elevation sample**. It omits slope and reports a clear limitation warning (`AVAILABLE_PARTIAL` or `NODATA_PIXEL`).

---

### 3. Endpoints Added in Phase 8

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/environmental/terrain?latitude={lat}&longitude={lon}` | Public | Extracts elevation and calculated slope gradient from Copernicus DEM GLO-30. |

#### Example Request:
```http
GET /api/environmental/terrain?latitude=25.5788&longitude=91.8933 HTTP/1.1
```

#### Example Response (`200 OK`):
```json
{
  "requestedLatitude": 25.5788,
  "requestedLongitude": 91.8933,
  "gridLatitude": 25.5790,
  "gridLongitude": 91.8932,
  "elevationMeters": 1428.26,
  "slopeDegrees": 4.83,
  "aspectDegrees": 180.0,
  "demProvider": "Copernicus DEM (ESA)",
  "productVersion": "GLO-30 Public Copernicus DSM",
  "rasterResolution": "1 arc-second (~30m)",
  "coordinateReferenceSystem": "EPSG:4326 (WGS 84)",
  "retrievalTimestamp": "2026-10-13T01:20:44.817Z",
  "availabilityStatus": "AVAILABLE",
  "dataQuality": "VERIFIED_RASTER_DATA",
  "sourceProvenance": "Copernicus DEM GLO-30 (ESA / Airbus) 1 arc-second Public DSM via local verified raster",
  "slopeAlgorithm": "Horn (1981) 3x3 finite-difference window with geodetic WGS84 horizontal metric scaling",
  "limitations": "Slope values reflect numerical finite-difference gradient over a 3x3 (~90m) window. Sub-grid micro-relief (<30m) is not resolved."
}
```

#### Example Out-of-Coverage Response:
```json
{
  "requestedLatitude": 28.0,
  "requestedLongitude": 95.0,
  "availabilityStatus": "OUT_OF_COVERAGE",
  "dataQuality": "UNAVAILABLE",
  "warnings": [
    "Requested coordinates (28.0000, 95.0000) fall outside active DEM coverage bounds [Lat: 25.5000 to 25.6500, Lon: 91.8000 to 91.9500]."
  ]
}
```

---

### 4. Integration with Risk Assessment Engine

The Phase 7 `POST /api/risk-assessments` engine now automatically derives `slope_deg` and `elevation_m` from Copernicus DEM when not manually supplied:
1. **Automatic Extraction**: When a user submits only coordinates `{"latitude": 25.5788, "longitude": 91.8933}`, the engine retrieves real-time weather from Open-Meteo, queries the local Copernicus DEM for slope and elevation, and feeds complete features to the AI service.
2. **Safe Non-Fabrication**: If the requested location falls outside DEM coverage, the engine does **not** substitute zero or fake values. It returns `UNAVAILABLE_MISSING_FEATURES` with a clear explanation of missing terrain coverage.
3. **Survey Override**: Clients can optionally supply their own surveyed `slope_deg`, which is accepted and marked as `CLIENT_SUPPLIED`.

---

### 5. Configuration Settings

```properties
slopeguard.environmental.dem.enabled=true
slopeguard.environmental.dem.provider-name=Copernicus DEM (ESA)
slopeguard.environmental.dem.product-name=GLO-30 Public Copernicus DSM
slopeguard.environmental.dem.resolution=1 arc-second (~30m)
slopeguard.environmental.dem.crs=EPSG:4326 (WGS 84)
slopeguard.environmental.dem.local-raster-path=classpath:dem/copernicus_dem_glo30_shillong.asc
slopeguard.environmental.dem.cache-ttl-minutes=60
slopeguard.environmental.dem.cache-max-entries=1000
```

---

## 🗄️ Phase 9 — Production-Structured MySQL Persistence

SlopeGuard Phase 9 introduces production-structured MySQL 8.x relational persistence, replacing ephemeral in-memory storage with durable, transactional relational entities while maintaining complete backwards compatibility with all existing REST endpoints, security models, and the FastAPI AI microservice.

### Key Capabilities in Phase 9:
- **MySQL 8.x Database Engine**: InnoDB storage engine with `utf8mb4` encoding and strict foreign key referential integrity.
- **Flyway Database Migrations**: Versioned DDL migration scripts (`V1__init_schema.sql`) for reproducible, audit-compliant schema initialization.
- **Strict Hibernate Validation**: Enforces `spring.jpa.hibernate.ddl-auto=validate` so any drift between entity definitions and SQL schema causes immediate fail-fast startup.
- **Durable Relational Entities**:
  - `User`: BCrypt password hashing, unique normalized emails, active/disabled account states.
  - `IncidentReport`: Foreign-key ownership to users, multi-status state machines (`PENDING`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`), and indexed spatial coordinates.
  - `ReportPhotoMetadata`: Decoupled storage filenames, cryptographic SHA-256 verification, and automatic disk compensation cleanup.
  - `RiskAssessmentRecord`: Persistent model inference governance, environmental telemetry, and provenance JSON.
  - `EarlyWarningAlert` & `AlertStatusHistory`: Proximity deduplication engine and append-only status transition history.
  - `AuditEvent`: Independent transaction isolation (`REQUIRES_NEW`) ensuring audit trails survive business rollbacks.
- **Verified Persistence Across Restarts**: 116 automated tests passing with 100% success, including dedicated live MySQL tests verifying data consistency across backend context restarts.



