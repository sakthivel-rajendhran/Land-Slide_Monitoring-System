/**
 * test_signup_page.js
 * Verification for SlopeGuard Authorized Registration / Signup page
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

console.log("=== 1. Checking signup.html Layout & Elements ===");

const signupHtmlPath = path.join(__dirname, '..', 'signup.html');
assert(fs.existsSync(signupHtmlPath), "signup.html exists");

const html = fs.readFileSync(signupHtmlPath, 'utf8');

// Header, Titles, and Branding
assert(html.includes("Authorized Registration"), "Contains heading 'Authorized Registration'");
assert(html.includes("Create your personal or departmental monitoring account"), "Contains description 'Create your personal or departmental monitoring account'");
assert(html.includes("Back to Login"), "Contains 'Back to Login' link");
assert(html.includes("Slope<span>Guard</span>"), "Contains SlopeGuard branding logo & text");

// Form Fields & Labels
assert(html.includes('id="fullNameInput"'), "Contains Full Name input");
assert(html.includes('id="emailInput"'), "Contains Official Email Address input");
assert(html.includes('id="districtInput"'), "Contains Assigned District input");
assert(html.includes('id="passwordInput"'), "Contains Security Password input");
assert(html.includes('id="confirmPasswordInput"'), "Contains Confirm Password input");

assert(html.includes('Full Name</label>'), "Visible label for Full Name");
assert(html.includes('Official Email Address</label>'), "Visible label for Official Email Address");
assert(html.includes('Assigned District / Jurisdiction</label>'), "Visible label for Assigned District");
assert(html.includes('Security Password</label>'), "Visible label for Security Password");
assert(html.includes('Confirm Password</label>'), "Visible label for Confirm Password");

// Password Show/Hide controls
assert(html.includes('id="togglePasswordBtn"'), "Contains password show/hide button");
assert(html.includes('id="toggleConfirmPasswordBtn"'), "Contains confirm password show/hide button");

// Icon & Input Wrapper standard styling
assert(html.includes('.login-input-wrapper'), "Uses standard .login-input-wrapper class");
assert(html.includes('.login-field-icon'), "Uses standard .login-field-icon class");
assert(html.includes('.login-input'), "Uses standard .login-input class");
assert(html.includes('.btn-sign-in'), "Uses standard .btn-sign-in class");

// No unconstrained SVG elements
assert(!html.includes('class="input-wrapper"'), "Replaced unconstrained input-wrapper with login-input-wrapper");
assert(!html.includes('class="input-icon"'), "Replaced unconstrained input-icon with login-field-icon");

// Button & Footer
assert(html.includes("Create Monitoring Account"), "Contains primary submit button text");
assert(html.includes("Sign in here"), "Contains 'Sign in here' link");

console.log("\n=== 2. Functional API Mock Verification ===");

// Setup mock environment
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

const regionsServicePath = path.join(__dirname, '..', 'js', 'services', 'regions-service.js');
const regionsService = fs.readFileSync(regionsServicePath, 'utf8');

global.window = { LW: {} };
eval(regionsService);

const mockAdapter = window.LW.mockAdapter;

// Registration missing fields
try {
  mockAdapter("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ fullName: "", email: "", password: "" })
  });
  assert(false, "Should reject empty registration");
} catch (e) {
  assert(e.code === "MISSING_FIELDS", "Rejected missing fields with MISSING_FIELDS");
}

// Successful registration
const regRes = mockAdapter("/api/auth/register", {
  method: "POST",
  body: JSON.stringify({
    fullName: "Arunav Bora",
    email: "arunav.bora@ner.gov.in",
    password: "Password123",
    district: "Dima Hasao",
    location: { latitude: 25.18, longitude: 93.03, accuracyMeters: 15 }
  })
});

assert(regRes.success === true, "Registration succeeded");
assert(regRes.data.name === "Arunav Bora", "Correct name stored");
assert(regRes.data.email === "arunav.bora@ner.gov.in", "Correct email stored");

// Duplicate registration rejection
try {
  mockAdapter("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Arunav Duplicate",
      email: "arunav.bora@ner.gov.in",
      password: "Password123",
      location: { latitude: 25.18, longitude: 93.03 }
    })
  });
  assert(false, "Should reject duplicate email registration");
} catch (e) {
  assert(e.code === "USER_EXISTS", "Rejected duplicate registration with USER_EXISTS");
}

console.log(`\n========================================`);
console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed.`);
console.log(`========================================`);

if (testsFailed > 0) {
  process.exit(1);
}
