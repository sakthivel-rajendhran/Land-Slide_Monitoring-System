/**
 * test_citizen_location_flow.js
 * End-to-end verification of SlopeGuard Citizen Location Registration,
 * Automated AI Risk Analysis Pipeline, and Admin Geotechnical Review.
 */

const fs = require('fs');
const path = require('path');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log("=== 1. Checking signup.html Current Location Layout & Components ===");

const signupHtmlPath = path.join(__dirname, '..', 'signup.html');
assert(fs.existsSync(signupHtmlPath), "signup.html exists");
const signupHtml = fs.readFileSync(signupHtmlPath, 'utf8');

// Title & Supporting text
assert(signupHtml.includes("Current Location"), "Includes required section title 'Current Location'");
assert(signupHtml.includes("Allow SlopeGuard to access your current location so we can assess landslide risks in your area and support geographically relevant monitoring."), "Includes exact required supporting text");
assert(signupHtml.includes("Use My Current Location"), "Includes prominent button 'Use My Current Location'");

// Status states in HTML / CSS / JS
const requiredStatuses = [
  "Location not selected",
  "Requesting permission",
  "Detecting location",
  "Location detected successfully",
  "Permission denied",
  "Location unavailable",
  "Location request timed out",
  "Location accuracy insufficient"
];

requiredStatuses.forEach(status => {
  assert(signupHtml.includes(status), `Handles required location status: '${status}'`);
});

// Confirmation panel components
assert(signupHtml.includes('id="locationConfirmBox"'), "Contains confirmation box container");
assert(signupHtml.includes('id="locPlaceName"'), "Contains detected place name display");
assert(signupHtml.includes('id="locLat"'), "Contains latitude display");
assert(signupHtml.includes('id="locLng"'), "Contains longitude display");
assert(signupHtml.includes('id="locAccuracy"'), "Contains GPS accuracy display");
assert(signupHtml.includes('id="locTime"'), "Contains capture timestamp display");
assert(signupHtml.includes('id="btnRefreshLocation"'), "Contains Refresh Location action button");
assert(signupHtml.includes('id="confirmLocationConsent"'), "Contains confirmation checkbox");

// Required Safety Notice
const requiredDisclaimer = "Your location will be used to support geographically relevant landslide-risk assessment. Location readings may be inaccurate, and risk results are estimates rather than guarantees of safety.";
assert(signupHtml.includes(requiredDisclaimer), "Contains exact required risk estimate disclaimer notice");

console.log("\n=== 2. Checking admin/assessments.html Layout & Review Modal ===");

const adminAssessmentsPath = path.join(__dirname, '..', 'admin', 'assessments.html');
assert(fs.existsSync(adminAssessmentsPath), "admin/assessments.html exists");
const adminHtml = fs.readFileSync(adminAssessmentsPath, 'utf8');

// Dual Queues & Tabs
assert(adminHtml.includes('id="tabCitizenBtn"'), "Contains Citizen Location tab button");
assert(adminHtml.includes('id="tabSensorBtn"'), "Contains Sensor Breaches tab button");
assert(adminHtml.includes('id="citizenAssessmentsTbody"'), "Contains Citizen Assessments table body");

// Review & Location Statuses supported in Filter and Modal
const requiredReviewStatuses = [
  "Location Provided",
  "Location Not Provided",
  "Assessment Pending",
  "Assessment Completed",
  "Review Required"
];

requiredReviewStatuses.forEach(status => {
  assert(adminHtml.includes(status), `Admin dashboard supports status '${status}'`);
});

// Geotechnical Review Modal
assert(adminHtml.includes('id="citizenReviewModal"'), "Contains Geotechnical Review modal dialog");
assert(adminHtml.includes('id="modalReviewStatusSelect"'), "Contains review status selector");
assert(adminHtml.includes('id="modalCorrectedRiskSelect"'), "Contains risk correction override selector");
assert(adminHtml.includes('id="modalReviewNotes"'), "Contains review notes and justification input");
assert(adminHtml.includes('id="modalAuditHistory"'), "Contains audit history and review trail container");
assert(adminHtml.includes('id="modalMapLink"'), "Contains link to open location on risk map");
assert(adminHtml.includes('regions-service.js'), "Includes regions-service.js in admin assessments scripts");

console.log("\n=== 3. Backend API Validation & Optional Location Registration Pipeline ===");

// Set up browser-like environment for regions-service.js
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};
global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

global.window = { LW: {} };
const regionsServiceCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'services', 'regions-service.js'), 'utf8');
eval(regionsServiceCode);
const mockAdapter = window.LW.mockAdapter;

// Test A: Registration WITHOUT location must succeed on desktop and mobile!
const noLocRes = mockAdapter("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Anurag Sen",
    email: "anurag.sen@test.org",
    password: "StrongPassword123!"
  })
});
assert(noLocRes.success === true, "Desktop/Mobile registration succeeds without location coordinates");
assert(noLocRes.data.location === null, "User location stored as null/optional");
assert(noLocRes.data.locationStatus === "Location Not Provided", "Location status marked as 'Location Not Provided'");
assert(noLocRes.data.assessment.preliminaryRisk === "Pending Location", "Risk assessment is marked 'Pending Location' (never fabricated)");
assert(noLocRes.data.assessment.reviewStatus === "Assessment Pending", "Review status marked as 'Assessment Pending'");
assert(noLocRes.data.assessment.factorOfSafety === "Pending Location", "Factor of safety is 'Pending Location'");

// Test B: Registration with invalid geographic coordinates
try {
  mockAdapter("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Anurag Invalid",
      email: "anurag.invalid@test.org",
      password: "StrongPassword123!",
      location: { latitude: 195.4, longitude: 93.2 }
    })
  });
  assert(false, "Should reject registration with latitude > 90");
} catch (err) {
  assert(err.code === "INVALID_COORDINATES", "Rejects coordinates outside bounds [-90, 90] with INVALID_COORDINATES");
}

// Test C: Successful registration proximate to Haflong Hill Corridor (Critical hazard zone)
const haflongCitizenLoc = {
  latitude: 25.1805,
  longitude: 93.0298,
  accuracyMeters: 12,
  capturedAt: new Date().toISOString(),
  source: "browser_geolocation",
  resolvedPlaceName: "Haflong Hill Station, Dima Hasao, Assam",
  citizenConfirmedAt: new Date().toISOString()
};

const regRes = mockAdapter("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Ranjit Borah",
    email: "ranjit.borah@assam.gov.in",
    password: "SecureHimalayaPass1!",
    district: "Dima Hasao",
    location: haflongCitizenLoc
  })
});

assert(regRes.success === true, "Registration succeeded with valid location payload");
assert(regRes.data.location.latitude === haflongCitizenLoc.latitude, "User record stores latitude");
assert(regRes.data.location.accuracyMeters === 12, "User record stores accuracy in meters");
assert(regRes.data.location.source === "browser_geolocation", "Records location capture source");
assert(regRes.data.locationStatus === "Location Provided", "User record marked with 'Location Provided'");

// Validate Automated AI Risk Engine evaluation
const asm = regRes.data.assessment;
assert(asm !== undefined, "Automated assessment generated upon registration");
assert(asm.modelVersion === "v2.4-convLSTM", "Uses registered model version 'v2.4-convLSTM'");
assert(asm.preliminaryRisk === "critical", "Computed preliminary risk 'critical' based on proximate Haflong slip zone");
assert(asm.confidence === "high", "Confidence is 'high' due to sensor density");
assert(asm.availableSources.includes("GPS Telemetry"), "Includes GPS Telemetry in data sources");
assert(asm.availableSources.includes("IMD Automated Rain Gauge Network"), "Includes IMD Rain Gauge Network");
assert(asm.reviewStatus === "Review Required", "High/critical corridor status is 'Review Required'");
assert(asm.reviewHistory.length === 1, "Initial review history logs automated evaluation step");

// Test D: Distant location (>150km from corridor instruments)
const distantCitizenLoc = {
  latitude: 28.6139,
  longitude: 77.2090,
  accuracyMeters: 30,
  capturedAt: new Date().toISOString(),
  source: "browser_geolocation",
  resolvedPlaceName: "Northern Envelope (Distant)",
  citizenConfirmedAt: new Date().toISOString()
};

const regResDistant = mockAdapter("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Tashi Lepcha",
    email: "tashi.lepcha@border.gov.in",
    password: "SecureHimalayaPass1!",
    location: distantCitizenLoc
  })
});

assert(regResDistant.success === true, "Distant registration succeeded");
assert(regResDistant.data.assessment.limitations.length > 0, "Distant assessment correctly flags data limitation (>150km)");
assert(regResDistant.data.assessment.confidence === "low", "Confidence is flagged as low when instruments are distant");

// Test E: Update Location later from settings / profile page
sessionStorage.setItem("sg_user", JSON.stringify(noLocRes.data));
const updateLocRes = mockAdapter("/api/user/location", {
  method: "POST",
  body: JSON.stringify({
    location: {
      latitude: 25.1805,
      longitude: 93.0298,
      accuracyMeters: 15,
      resolvedPlaceName: "Haflong Hill Station, Assam"
    }
  })
});
assert(updateLocRes.success === true, "User can provide or update location later via /api/user/location");
assert(updateLocRes.data.location.latitude === 25.1805, "Updated coordinates recorded in user profile");
assert(updateLocRes.data.assessment.locationStatus === "Location Provided", "Assessment transitioned to 'Location Provided'");
assert(updateLocRes.data.assessment.preliminaryRisk === "critical", "Synthesized AI risk assessment after user provided location");

// Register a citizen without location to verify both records exist simultaneously in the queue
mockAdapter("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Priya Sharma (Desktop Citizen)",
    email: "priya.sharma@desktop.org",
    password: "StrongPassword123!"
  })
});

console.log("\n=== 4. Administrator Review Workflow & Geotechnical Adjudication ===");

// 1. Fetch queue for staff
const queueRes = mockAdapter("/api/admin/citizen-assessments?status=all", { method: "GET" });
assert(queueRes.success === true, "Admin can retrieve citizen assessments queue");
assert(queueRes.data.length >= 3, "Queue contains registered citizen assessments");

// Check that queue reflects both Location Provided and Location Not Provided
const hasProvided = queueRes.data.some(q => q.locationStatus === "Location Provided");
const hasNotProvided = queueRes.data.some(q => q.locationStatus === "Location Not Provided");
assert(hasProvided, "Queue includes 'Location Provided' records");
assert(hasNotProvided, "Queue includes 'Location Not Provided' records");

// 2. Perform Geotechnical Confirmation
const targetId = regRes.data.assessment.assessmentId;
const confirmRes = mockAdapter(`/api/admin/citizen-assessments/${targetId}/review`, {
  method: "POST",
  body: JSON.stringify({
    status: "Confirmed",
    notes: "Verified correlation with piezometer ARG-04 active pressure spike. Recommended community advisory.",
    reviewer: "Dr. L. Sharma (SENIOR GEOTECHNICAL OFFICER)"
  })
});

assert(confirmRes.success === true, "Successfully confirmed assessment");
assert(confirmRes.data.assessment.reviewStatus === "Confirmed", "Status transitioned to 'Confirmed'");
assert(confirmRes.data.assessment.reviewHistory.length === 2, "Audit history recorded confirmation action");
assert(confirmRes.data.assessment.reviewHistory[1].actor.includes("Dr. L. Sharma"), "Audit logs reviewer identity");

// 3. Perform Geotechnical Correction / Override
const targetIdDistant = regResDistant.data.assessment.assessmentId;
const correctRes = mockAdapter(`/api/admin/citizen-assessments/${targetIdDistant}/review`, {
  method: "POST",
  body: JSON.stringify({
    status: "Corrected",
    correctedRisk: "high",
    notes: "Recent local unpaved road cutting coupled with unmonitored local stream blockage justifies elevation to HIGH.",
    reviewer: "Officer K. Sangma (FIELD INSPECTOR)"
  })
});

assert(correctRes.success === true, "Successfully submitted geotechnical correction");
assert(correctRes.data.assessment.reviewStatus === "Corrected", "Status transitioned to 'Corrected'");
assert(correctRes.data.assessment.preliminaryRisk === "moderate", "Preserved original model risk (moderate)");
assert(correctRes.data.assessment.correctedRisk === "high", "Recorded human corrected risk separately as 'high'");
assert(correctRes.data.assessment.reviewHistory.some(h => h.correction && h.correction.includes("HIGH")), "Audit history details risk adjustment");

// 4. Test Filtering by Status
const filterRes = mockAdapter("/api/admin/citizen-assessments?status=confirmed", { method: "GET" });
assert(filterRes.success === true, "Filter endpoint functions");
assert(filterRes.data.every(item => item.assessment.reviewStatus.toLowerCase() === "confirmed"), "Filter returns only confirmed assessments");

console.log("\n========================================================");
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log("========================================================");
if (testsFailed > 0) process.exit(1);

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
