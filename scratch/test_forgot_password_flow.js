/**
 * test_forgot_password_flow.js
 * Comprehensive automated validation for SlopeGuard Forgot Password & Reset Password workflows.
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

console.log("=== 1. Checking File Existence & Structure ===");

const forgotHtmlPath = path.join(__dirname, '..', 'forgot-password.html');
const resetHtmlPath = path.join(__dirname, '..', 'reset-password.html');
const loginHtmlPath = path.join(__dirname, '..', 'login.html');
const authJsPath = path.join(__dirname, '..', 'js', 'core', 'auth.js');
const regionsServicePath = path.join(__dirname, '..', 'js', 'services', 'regions-service.js');

assert(fs.existsSync(forgotHtmlPath), "forgot-password.html exists");
assert(fs.existsSync(resetHtmlPath), "reset-password.html exists");
assert(fs.existsSync(loginHtmlPath), "login.html exists");
assert(fs.existsSync(authJsPath), "js/core/auth.js exists");
assert(fs.existsSync(regionsServicePath), "js/services/regions-service.js exists");

console.log("\n=== 2. Inspecting forgot-password.html Content & Elements ===");
const forgotHtml = fs.readFileSync(forgotHtmlPath, 'utf8');

assert(forgotHtml.includes("Forgot your password?"), "Contains heading 'Forgot your password?'");
assert(forgotHtml.includes("Enter the email address associated with your SlopeGuard account"), "Contains exact required description");
assert(forgotHtml.includes("Send Reset Instructions"), "Contains 'Send Reset Instructions' button");
assert(forgotHtml.includes("Remember your password?"), "Contains 'Remember your password?' text");
assert(forgotHtml.includes("Sign In"), "Contains 'Sign In' link");
assert(forgotHtml.includes('placeholder="Enter your registered email"'), "Contains correct placeholder");
assert(forgotHtml.includes('Check your email'), "Contains Stage B confirmation state 'Check your email'");
assert(forgotHtml.includes('devResetBox'), "Includes dev testing reset box");
assert(!forgotHtml.includes('<nav class="nav-links">'), "No public landing-page navigation included");
assert(!forgotHtml.includes('class="dashboard-sidebar"'), "No dashboard sidebar included");
assert(!forgotHtml.includes('id="map"'), "No map canvas included");

console.log("\n=== 3. Inspecting reset-password.html Content & Elements ===");
const resetHtml = fs.readFileSync(resetHtmlPath, 'utf8');

assert(resetHtml.includes("Reset Password"), "Contains 'Reset Password' heading");
assert(resetHtml.includes("New Password"), "Contains 'New Password' field label");
assert(resetHtml.includes("Confirm New Password"), "Contains 'Confirm New Password' field label");
assert(resetHtml.includes("toggleNewPwBtn"), "Contains show/hide password toggle for new password");
assert(resetHtml.includes("toggleConfirmPwBtn"), "Contains show/hide password toggle for confirm password");
assert(resetHtml.includes("verifyResetToken"), "Calls verifyResetToken on page load");
assert(resetHtml.includes("resetPassword"), "Calls resetPassword on form submission");
assert(resetHtml.includes("Password Updated"), "Contains success stage after updating password");
assert(resetHtml.includes("login.html"), "Contains links back to login.html");

console.log("\n=== 4. Validating Auth & Service API Methods ===");
const authJs = fs.readFileSync(authJsPath, 'utf8');
const regionsService = fs.readFileSync(regionsServicePath, 'utf8');

assert(authJs.includes("forgotPassword(email)"), "LW.auth includes forgotPassword method");
assert(authJs.includes("verifyResetToken(token)"), "LW.auth includes verifyResetToken method");
assert(authJs.includes("resetPassword(token, password, confirmPassword)"), "LW.auth includes resetPassword method");

assert(regionsService.includes("/api/auth/forgot-password"), "regions-service handles /api/auth/forgot-password");
assert(regionsService.includes("/api/auth/verify-reset-token"), "regions-service handles /api/auth/verify-reset-token");
assert(regionsService.includes("/api/auth/reset-password"), "regions-service handles /api/auth/reset-password");
assert(regionsService.includes("sg_password_resets"), "Manages tokens in sg_password_resets");
assert(regionsService.includes("sg_officer_custom_pw"), "Persists custom reset password for officer account");
assert(regionsService.includes("RATE_LIMITED"), "Enforces rate limiting on repeated reset requests");

console.log("\n=== 5. Functional Simulation Test in Node ===");

// Simulate the mock adapter logic
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

// Evaluate regions-service in global scope
global.window = { LW: {} };
eval(regionsService);

const mockAdapter = window.LW.mockAdapter;

// Scenario 1: Empty or invalid email submission
try {
  mockAdapter("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: "" }) });
  assert(false, "Should fail on empty email");
} catch (e) {
  assert(e.code === "INVALID_EMAIL", "Rejected empty email with INVALID_EMAIL");
}

try {
  mockAdapter("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: "invalid-email" }) });
  assert(false, "Should fail on invalid email format");
} catch (e) {
  assert(e.code === "INVALID_EMAIL", "Rejected invalid email format");
}

// Scenario 2: Valid email submission for unknown email (generic response, no dev token)
const unknownRes = mockAdapter("/api/auth/forgot-password", {
  method: "POST",
  body: JSON.stringify({ email: "unknown.citizen@example.com" })
});
assert(unknownRes.success === true, "Unknown email returns success generic envelope");
assert(unknownRes.data.devToken === null, "Unknown email does not generate reset token");
assert(unknownRes.data.message.includes("If an account matches"), "Generic message does not reveal account non-existence");

// Scenario 3: Valid email submission for known officer account
const officerRes = mockAdapter("/api/auth/forgot-password", {
  method: "POST",
  body: JSON.stringify({ email: "officer@slopeguard.ner.gov.in" })
});
assert(officerRes.success === true, "Officer email returns success");
assert(typeof officerRes.data.devToken === "string" && officerRes.data.devToken.length > 20, "Generated secure cryptographic token");

const token = officerRes.data.devToken;

// Scenario 4: Verify valid token
const verifyRes = mockAdapter(`/api/auth/verify-reset-token?token=${token}`, { method: "GET" });
assert(verifyRes.success === true, "Token verification passes");
assert(verifyRes.data.email === "officer@slopeguard.ner.gov.in", "Verified email matches token owner");

// Scenario 5: Verify invalid token
try {
  mockAdapter(`/api/auth/verify-reset-token?token=bad-token-xyz`, { method: "GET" });
  assert(false, "Should fail on bad token");
} catch (e) {
  assert(e.code === "INVALID_TOKEN", "Rejected invalid token");
}

// Scenario 6: Reset password validation (too short / mismatch)
try {
  mockAdapter("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password: "123", confirmPassword: "123" })
  });
  assert(false, "Should fail on weak password");
} catch (e) {
  assert(e.code === "WEAK_PASSWORD", "Rejected password < 8 characters");
}

try {
  mockAdapter("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password: "NewStrongPassword123", confirmPassword: "MismatchPassword" })
  });
  assert(false, "Should fail on password mismatch");
} catch (e) {
  assert(e.code === "PASSWORD_MISMATCH", "Rejected mismatched passwords");
}

// Scenario 7: Successful password reset
const resetSuccessRes = mockAdapter("/api/auth/reset-password", {
  method: "POST",
  body: JSON.stringify({ token, password: "NewPassword123", confirmPassword: "NewPassword123" })
});
assert(resetSuccessRes.success === true, "Password reset succeeded");

// Scenario 8: Single-use check (token cannot be reused)
try {
  mockAdapter("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password: "AnotherPassword123", confirmPassword: "AnotherPassword123" })
  });
  assert(false, "Token should be single-use");
} catch (e) {
  assert(e.code === "TOKEN_ALREADY_USED", "Rejected already-used token");
}

// Scenario 9: Login with old password fails
try {
  mockAdapter("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "officer@slopeguard.ner.gov.in", password: "officer123" })
  });
  assert(false, "Old password should no longer work");
} catch (e) {
  assert(e.code === "UNAUTHENTICATED", "Login with old password was rejected");
}

// Scenario 10: Login with new password succeeds
const loginNewRes = mockAdapter("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ username: "officer@slopeguard.ner.gov.in", password: "NewPassword123" })
});
assert(loginNewRes.success === true, "Login with new password succeeded");
assert(loginNewRes.data.name === "Field Officer Sharma", "Logged in user profile resolved correctly");

// Scenario 11: Rate limiting test
for (let i = 0; i < 2; i++) {
  mockAdapter("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "rate_limit_test@slopeguard.ner.gov.in" })
  });
}
try {
  // 4th attempt should exceed 3 requests threshold
  mockAdapter("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "rate_limit_test@slopeguard.ner.gov.in" })
  });
  mockAdapter("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "rate_limit_test@slopeguard.ner.gov.in" })
  });
  assert(false, "Should trigger rate limit");
} catch (e) {
  assert(e.code === "RATE_LIMITED", "Rate limiting triggered after repeated attempts");
}

console.log(`\n========================================`);
console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed.`);
console.log(`========================================`);

if (testsFailed > 0) {
  process.exit(1);
}
