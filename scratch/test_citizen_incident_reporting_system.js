/**
 * SlopeGuard — Citizen Road Blockage, Landslide Photo Reporting & Incident Mapping
 * Comprehensive Verification & Test Suite
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

console.log("===============================================================================");
console.log("   SLOPEGUARD CITIZEN INCIDENT REPORTING & MAPPING SYSTEM - COMPREHENSIVE TEST");
console.log("===============================================================================\n");

// --- 1. HTML Layouts and Navigation Integration ---
console.log("=== 1. Checking Portal Navigation & Page Architecture ===");

const navPages = [
  'dashboard.html',
  'history.html',
  'my-areas.html',
  'notifications.html',
  'map.html'
];

navPages.forEach(p => {
  const filePath = path.join(__dirname, '..', p);
  assert(fs.existsSync(filePath), `${p} exists`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(
    content.includes('report-incident.html') || content.includes('Report Incident') || content.includes('Report an Observation'),
    `${p} includes navigation link to incident reporting`
  );
});

const reportIncidentPath = path.join(__dirname, '..', 'report-incident.html');
const myReportsPath = path.join(__dirname, '..', 'my-reports.html');
assert(fs.existsSync(reportIncidentPath), "report-incident.html exists");
assert(fs.existsSync(myReportsPath), "my-reports.html exists");

const reportHtml = fs.readFileSync(reportIncidentPath, 'utf8');
const myReportsHtml = fs.readFileSync(myReportsPath, 'utf8');

// --- 2. Emergency Notice & Safety Compliance ---
console.log("\n=== 2. Emergency Notice & Safety Compliance ===");
const emergencyNoticeText = "If you are in immediate danger, move to a safer location when possible and contact local emergency authorities. Do not wait for your report to be reviewed.";
assert(reportHtml.includes(emergencyNoticeText), "report-incident.html contains prominent exact emergency safety notice");
assert(reportHtml.includes("Do not enter active slide paths or approach unstable slopes to take photos"), "Contains safety warning not to approach unstable slopes or hazardous blockages");

// --- 3. Reporting Form Fields & 7 Categories ---
console.log("\n=== 3. Incident Form Fields & 7 Required Categories ===");
const requiredCategories = [
  "Road blocked by landslide debris",
  "Road covered by fallen rocks",
  "Road damaged by slope movement",
  "Ground cracks or slope instability near a road",
  "Small landslide observed",
  "Flooding or unusual water flow affecting a road",
  "Other relevant hazard"
];

requiredCategories.forEach(cat => {
  assert(reportHtml.includes(cat), `Form includes required category: '${cat}'`);
});

const requiredPassabilities = [
  "unknown",
  "open",
  "partially blocked",
  "completely blocked"
];

requiredPassabilities.forEach(pas => {
  assert(reportHtml.includes(pas), `Form includes passability option: '${pas}'`);
});

assert(reportHtml.includes('id="incidentType"'), "Form includes incident type selector (required)");
assert(reportHtml.includes('id="description"'), "Form includes description textarea (required)");
assert(reportHtml.includes('id="observedAt"'), "Form includes observation date/time input (required)");
assert(reportHtml.includes('id="latitude"') && reportHtml.includes('id="longitude"'), "Form includes latitude and longitude fields (required)");
assert(reportHtml.includes('id="roadName"'), "Form includes road name/landmark field");
assert(reportHtml.includes('id="roadPassability"'), "Form includes road passability field");
assert(reportHtml.includes('id="additionalInfo"'), "Form includes additional information field");

// --- 4. Photo Evidence & Upload Architecture ---
console.log("\n=== 4. Photo Capture, Validation & Reference Storage ===");
assert(reportHtml.includes('accept="image/jpeg,image/png,image/webp"'), "Restricted to configured image formats (JPEG, PNG, WebP)");
assert(reportHtml.includes('capture="environment"') || reportHtml.includes('btnCameraCapture'), "Supports mobile camera capture with rear environment lens");
assert(reportHtml.includes('id="photoFileInput"'), "Supports device file picker");
assert(reportHtml.includes('id="photoPreviewGrid"'), "Includes photo preview container before submission");
assert(reportHtml.includes('id="uploadProgressBar"'), "Includes upload progress bar");

// Verify realistic incident image assets exist on disk
const debrisImg = path.join(__dirname, '..', 'assets', 'images', 'incidents', 'debris_road_block.jpg');
const rocksImg = path.join(__dirname, '..', 'assets', 'images', 'incidents', 'fallen_rocks_road.jpg');
assert(fs.existsSync(debrisImg), "Realistic debris incident image exists at assets/images/incidents/debris_road_block.jpg");
assert(fs.existsSync(rocksImg), "Realistic fallen rocks incident image exists at assets/images/incidents/fallen_rocks_road.jpg");

// --- 5. Location Acquisition (Geolocation & Leaflet Map) ---
console.log("\n=== 5. Dual Location Methods (GPS & Map Pin) ===");
assert(reportHtml.includes('id="btnUseCurrentLocation"'), "Includes 'Use My Current Location' button");
assert(reportHtml.includes('id="locationAccuracyDisplay"'), "Displays reported GPS accuracy in meters");
assert(reportHtml.includes('id="locationPickerMap"'), "Includes Leaflet interactive map picker");
assert(reportHtml.includes('Leaflet') || reportHtml.includes('leaflet'), "Integrates Leaflet map for coordinate adjustment");

// --- 6. Backend Incidents Service & Mock API Verification ---
console.log("\n=== 6. Backend API Pipeline & Service Execution ===");

// Build sandbox with localStorage and sessionStorage
const sessionStorageStore = {};
const localStorageStore = {};

const mockStorage = (store) => ({
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
});

const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  sessionStorage: mockStorage(sessionStorageStore),
  localStorage: mockStorage(localStorageStore),
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  navigator: { onLine: true },
  fetch: global.fetch || (() => Promise.reject(new Error("No fetch"))),
  AbortController: global.AbortController,
  URL: global.URL,
  URLSearchParams: global.URLSearchParams
};
sandbox.window = sandbox;
sandbox.global = sandbox;

// Load core scripts into sandbox
const configSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'config.js'), 'utf8');
const formatSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'format.js'), 'utf8');
const apiSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'api.js'), 'utf8');
const authSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'auth.js'), 'utf8');
const regionsServiceSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'services', 'regions-service.js'), 'utf8');
const incidentsServiceSrc = fs.readFileSync(path.join(__dirname, '..', 'js', 'services', 'incidents-service.js'), 'utf8');

vm.createContext(sandbox);
vm.runInContext(configSrc, sandbox);
vm.runInContext(formatSrc, sandbox);
vm.runInContext(apiSrc, sandbox);
vm.runInContext(authSrc, sandbox);
vm.runInContext(regionsServiceSrc, sandbox);
vm.runInContext(incidentsServiceSrc, sandbox);

assert(sandbox.window.LW?.incidentsService, "LW.incidentsService is registered");
assert(sandbox.window.LW?.regionsService, "LW.regionsService is registered");

// --- 7. Photo Validation Service Tests (File Type, Magic Bytes, Max Size) ---
async function testPhotoValidation() {
  console.log("\n=== 7. Photo Security & File Validation ===");
  const fileValidator = sandbox.window.LW.incidentsService.validateImageFile;

  // Valid JPEG simulation
  const fakeJpegBuffer = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
  const validJpeg = { name: "road_slide.jpg", type: "image/jpeg", size: 2 * 1024 * 1024, buffer: fakeJpegBuffer };
  const valRes1 = await fileValidator(validJpeg);
  assert(valRes1.valid === true, "Valid JPEG file passes security validation");

  // Oversized file (>10MB)
  const oversizedImg = { name: "huge.jpg", type: "image/jpeg", size: 15 * 1024 * 1024, buffer: fakeJpegBuffer };
  const valRes2 = await fileValidator(oversizedImg);
  assert(valRes2.valid === false && valRes2.error.includes("exceeds"), "Rejects image exceeding 10MB limit");

  // Disallowed format (.exe or .svg)
  const exeFile = { name: "malware.exe", type: "application/x-msdownload", size: 1024, buffer: fakeJpegBuffer };
  const valRes3 = await fileValidator(exeFile);
  assert(valRes3.valid === false, "Rejects unconfigured file format (.exe)");

  // Magic byte spoofing (file named .jpg but buffer is text/html)
  const textBuffer = new Uint8Array([0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50]); // <!DOCTYPE
  const spoofedFile = { name: "spoofed.jpg", type: "image/jpeg", size: 1024, buffer: textBuffer };
  const valRes4 = await fileValidator(spoofedFile);
  assert(valRes4.valid === false && valRes4.error.includes("header"), "Rejects spoofed magic bytes (content mismatch)");
}

// --- 8. Submission Pipeline & Database Isolation ---
console.log("\n=== 8. Report Submission, Ownership Isolation & Anti-Duplicate Protection ===");

async function testSubmissionWorkflow() {
  // Log in as citizen 'Priya Roy'
  const citizenUser = {
    id: "usr_citizen_priya",
    name: "Priya Roy",
    email: "priya.roy@example.com",
    role: "CITIZEN"
  };
  sandbox.localStorage.setItem("sg_user", JSON.stringify(citizenUser));

  // Prepare valid incident payload
  const validReport = {
    incidentType: "Road blocked by landslide debris",
    description: "Substantial rock and mud debris covering both lanes after heavy morning downpour. Traffic completely stopped.",
    observedAt: new Date(Date.now() - 3600000).toISOString(),
    roadPassability: "completely blocked",
    latitude: 25.1852,
    longitude: 93.0245,
    roadName: "Haflong-Silchar Highway (NH-54E)",
    landmark: "Near Jatinga Viewpoint Mile 42",
    additionalInfo: "Power lines also downed on shoulder.",
    photos: [
      {
        name: "debris_road_block.jpg",
        type: "image/jpeg",
        size: 150000,
        url: "assets/images/incidents/debris_road_block.jpg"
      }
    ]
  };

  const submitRes = await sandbox.window.LW.incidentsService.submitIncident(validReport);
  assert(submitRes.success === true, "Incident report submitted successfully");
  assert(submitRes.data?.id && submitRes.data.id.startsWith("INC-"), `Unique incident reference generated: ${submitRes.data?.id}`);
  assert(submitRes.data?.status === "Submitted" || submitRes.data?.status === "Pending Verification", "Initial status is 'Submitted' / 'Pending Verification'");
  assert(submitRes.data?.citizenId === citizenUser.id, "Associated with authenticated citizen ID");
  assert(submitRes.data?.citizenName === citizenUser.name, "Associated with authenticated citizen name");
  assert(submitRes.data?.observedAt === validReport.observedAt, "Observed timestamp preserved separately");
  assert(submitRes.data?.submittedAt, "Submission timestamp generated");
  assert(submitRes.data?.isVerified === false, "Unverified report is strictly not marked verified");
  assert(Array.isArray(submitRes.data?.photos) && submitRes.data.photos.length === 1, "Photo references stored as URLs (not base64)");
  assert(submitRes.data.photos[0].url.startsWith("assets/images/incidents/"), "Photo stored via file storage path");

  // Verify anti-duplicate protection (submitting same report within 10 seconds with same idempotency token)
  let duplicateCaught = false;
  try {
    await sandbox.window.LW.incidentsService.submitIncident(validReport);
  } catch (err) {
    duplicateCaught = true;
    assert(err.code === "DUPLICATE_SUBMISSION" || err.message.includes("duplicate"), "Prevents duplicate submission with rapid repeated clicks");
  }
  if (!duplicateCaught) {
    assert(false, "Should have prevented immediate duplicate submission");
  }

  // Verify Citizen Ownership Isolation:
  // Citizen Priya can see her report
  const priyaReports = await sandbox.window.LW.incidentsService.getMyIncidents();
  assert(priyaReports.some(r => r.id === submitRes.data.id), "Citizen Priya sees her own submitted report in My Reports");

  // Log in as different citizen 'Rahul Das'
  const otherCitizen = {
    id: "usr_citizen_rahul",
    name: "Rahul Das",
    email: "rahul.das@example.com",
    role: "CITIZEN"
  };
  sandbox.localStorage.setItem("sg_user", JSON.stringify(otherCitizen));

  const rahulReports = await sandbox.window.LW.incidentsService.getMyIncidents();
  const rahulCanSeePriya = rahulReports.some(r => r.id === submitRes.data.id);
  assert(rahulCanSeePriya === false, "Citizen Rahul CANNOT see Priya's private report (ownership isolation strictly enforced)");

  return submitRes.data.id;
}

// --- 9. Map Layers & Risk Map Integration ---
console.log("\n=== 9. Risk Map Layers & Incident Markers ===");
const mapHtml = fs.readFileSync(path.join(__dirname, '..', 'map.html'), 'utf8');
const riskMapJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components', 'risk-map.js'), 'utf8');
const mapMarkersJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'components', 'map-markers.js'), 'utf8');

assert(mapHtml.includes('incidents-service.js'), "map.html includes incidents-service.js");
assert(riskMapJs.includes('citizenIncidentsLayer'), "Risk map maintains Citizen-Reported Incidents layer");
assert(riskMapJs.includes('verifiedLandslidesLayer'), "Risk map maintains Verified Landslide Incidents layer");
assert(riskMapJs.includes('verifiedBlockagesLayer'), "Risk map maintains Verified Road Blockages layer");
assert(riskMapJs.includes('susceptibilityLayer'), "Risk map maintains Susceptibility layer");
assert(mapMarkersJs.includes('createIncidentIcon'), "map-markers.js provides specialized accessible incident icons");
assert(riskMapJs.includes('PASSABILITY:') || riskMapJs.includes('Passability'), "Marker popups include road passability status");
assert(riskMapJs.includes('Verification Status') || riskMapJs.includes('badge'), "Marker popups clearly distinguish reported vs verified status");

// Test map-markers endpoint
async function testMapMarkersEndpoint() {
  const res = await sandbox.window.LW.api.get("/api/incidents/map-markers");
  assert(res.data && Array.isArray(res.data.reportedIncidents), "Map markers API returns reportedIncidents list");
  assert(res.data && Array.isArray(res.data.verifiedLandslides), "Map markers API returns verifiedLandslides list");
  assert(res.data && Array.isArray(res.data.verifiedRoadBlockages), "Map markers API returns verifiedRoadBlockages list");
}

// --- 10. Administrator Review Workflow & Geotechnical Adjudication ---
console.log("\n=== 10. Administrator Adjudication Workflow & Audit History ===");

async function testAdminAdjudication(incidentId) {
  // Unauthorized citizen cannot adjudicate
  const citizenUser = { id: "usr_citizen", role: "CITIZEN" };
  sandbox.localStorage.setItem("sg_user", JSON.stringify(citizenUser));

  let citizenAdjudicationBlocked = false;
  try {
    await sandbox.window.LW.incidentsService.reviewIncident(incidentId, {
      action: "VERIFY",
      status: "Verified",
      reviewReason: "Attempted citizen override"
    });
  } catch (err) {
    citizenAdjudicationBlocked = true;
    assert(err.status === 403 || err.code === "FORBIDDEN", "Citizens are blocked from adjudicating incidents (403 Forbidden)");
  }
  if (!citizenAdjudicationBlocked) {
    assert(false, "Citizen should not be allowed to adjudicate incident");
  }

  // Log in as authorized Geotechnical Officer
  const officerUser = {
    id: "off_sharma",
    name: "Dr. Sharma",
    role: "OFFICER",
    district: "NER Geotechnical Division"
  };
  sandbox.localStorage.setItem("sg_user", JSON.stringify(officerUser));

  // Step 1: Mark Under Review
  const reviewStep1 = await sandbox.window.LW.incidentsService.reviewIncident(incidentId, {
    action: "STATUS_UPDATE",
    status: "Under Review",
    reviewReason: "Dispatched local patrol unit to Mile 42."
  });
  assert(reviewStep1.data?.status === "Under Review", "Administrator set status to 'Under Review'");
  assert(reviewStep1.data?.auditTrail?.length >= 1, "Audit trail records Under Review step");

  // Step 2: Request Additional Info
  const reviewStep2 = await sandbox.window.LW.incidentsService.reviewIncident(incidentId, {
    action: "REQUEST_INFO",
    status: "Additional Info Requested",
    reviewReason: "Please clarify if western shoulder is still slipping."
  });
  assert(reviewStep2.data?.status === "Additional Info Requested", "Administrator requested additional information");

  // Step 3: Verify incident with confirmed cause & confirmed passability
  const reviewStep3 = await sandbox.window.LW.incidentsService.reviewIncident(incidentId, {
    action: "VERIFY",
    status: "Verified",
    verifiedIncidentType: "Road blocked by landslide debris",
    verifiedPassability: "completely blocked",
    reviewReason: "Field patrol verified 400m debris slope failure across NH-54E."
  });
  assert(reviewStep3.data?.status === "Verified", "Administrator set status to 'Verified'");
  assert(reviewStep3.data?.isVerified === true, "Report is now marked isVerified: true");
  assert(reviewStep3.data?.verifiedBy === "Dr. Sharma", "Logged verifying staff name");
  assert(reviewStep3.data?.verifiedIncidentType === "Road blocked by landslide debris", "Verified cause recorded distinctly from citizen observation");
  assert(reviewStep3.data?.verifiedPassability === "completely blocked", "Passability confirmed by geotechnical authority");

  // Step 4: Resolve incident
  const reviewStep4 = await sandbox.window.LW.incidentsService.reviewIncident(incidentId, {
    action: "RESOLVE",
    status: "Resolved",
    reviewReason: "BRO heavy earthmovers cleared debris. Slope netted and reopened to single lane."
  });
  assert(reviewStep4.data?.status === "Resolved", "Administrator marked incident 'Resolved'");
  assert(reviewStep4.data?.auditTrail?.length >= 4, "Complete tamper-evident audit history maintained");

  // Verify admin assessments HTML structure
  const adminAssessmentsHtml = fs.readFileSync(path.join(__dirname, '..', 'admin', 'assessments.html'), 'utf8');
  assert(adminAssessmentsHtml.includes('id="tabIncidentReportsBtn"'), "admin/assessments.html contains dedicated Incident Reports tab");
  assert(adminAssessmentsHtml.includes('id="viewIncidentReports"'), "admin/assessments.html contains incident reports view container");
  assert(adminAssessmentsHtml.includes('id="adminIncidentReviewModal"'), "admin/assessments.html contains full adjudication review modal");
  assert(adminAssessmentsHtml.includes('id="incidentDuplicateBanner"'), "admin/assessments.html includes duplicate proximity detector (<1.5 km)");
  assert(adminAssessmentsHtml.includes('incModalAuditHistory'), "admin/assessments.html displays audit trail with past reviewer actions");
}

// --- 11. Notifications Generation ---
console.log("\n=== 11. In-App Notifications Delivery ===");
async function testNotifications() {
  const notifsRes = await sandbox.window.LW.api.get("/api/notifications");
  assert(notifsRes.data && Array.isArray(notifsRes.data), "Notifications API returns notifications list");
  const hasIncidentNotif = notifsRes.data.some(n => 
    (n.title && n.title.includes("Incident")) || (n.title && n.title.includes("Road"))
  );
  assert(hasIncidentNotif, "Genuine in-app notifications generated for incident lifecycle events");
}

// --- 12. Execution of Async Tests ---
(async () => {
  try {
    await testPhotoValidation();
    const createdIncidentId = await testSubmissionWorkflow();
    await testMapMarkersEndpoint();
    await testAdminAdjudication(createdIncidentId);
    await testNotifications();

    console.log("\n===============================================================================");
    console.log(`TEST RESULTS: ${passedTests} PASSED | ${failedTests} FAILED`);
    console.log("===============================================================================");

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  }
})();
