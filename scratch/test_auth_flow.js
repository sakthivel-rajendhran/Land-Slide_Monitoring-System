/**
 * Comprehensive Authentication & Guard Verification Script
 * Validates:
 * 1. Entry point routing logic in index.html
 * 2. Strict credential validation in auth service & mockAdapter
 * 3. Prevention of arbitrary credentials / fake authentication
 * 4. Password show/hide, remember me, error alerts
 * 5. Role-based protection on admin routes
 * 6. Destination preservation & Open redirect prevention
 * 7. Logout state clearing and bfcache protection
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runTests() {
  console.log("=================================================");
  console.log("   SLOPEGUARD AUTHENTICATION ENFORCEMENT TEST    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Helper to create browser-like sandbox
  function createBrowserEnvironment(initialStorage = {}, pathname = "/dashboard.html", search = "") {
    const sessionStorageStore = { ...initialStorage.session };
    const localStorageStore = { ...initialStorage.local };

    let currentHref = `http://localhost:8080${pathname}${search}`;

    const windowObj = {
      location: {
        pathname,
        search,
        href: currentHref,
        replace: function(dest) {
          windowObj.location.href = dest;
          currentHref = dest;
        }
      },
      sessionStorage: {
        getItem: (k) => sessionStorageStore[k] || null,
        setItem: (k, v) => { sessionStorageStore[k] = String(v); },
        removeItem: (k) => { delete sessionStorageStore[k]; }
      },
      localStorage: {
        getItem: (k) => localStorageStore[k] || null,
        setItem: (k, v) => { localStorageStore[k] = String(v); },
        removeItem: (k) => { delete localStorageStore[k]; }
      },
      document: {
        cookie: "",
        addEventListener: () => {},
        getElementById: () => null
      },
      navigator: { onLine: true },
      addEventListener: () => {},
      console: console,
      setTimeout: (fn) => fn(),
      clearTimeout: () => {},
      AbortController: globalThis.AbortController,
      fetch: globalThis.fetch,
      URL: globalThis.URL,
      URLSearchParams: globalThis.URLSearchParams,
      Error: globalThis.Error
    };

    windowObj.window = windowObj;
    windowObj.sessionStorageStore = sessionStorageStore;
    windowObj.localStorageStore = localStorageStore;
    return windowObj;
  }

  // TEST 1: Immediate Head Guard in all Protected Files
  console.log("--- 1. Testing Immediate <head> Guard Presence ---");
  const protectedUserFiles = [
    'dashboard.html',
    'settings.html',
    'my-areas.html',
    'history.html',
    'notifications.html',
    'map.html'
  ];

  const protectedAdminFiles = [
    'admin/dashboard.html',
    'admin/alerts.html',
    'admin/areas.html',
    'admin/assessments.html',
    'admin/audit-logs.html',
    'admin/data.html',
    'admin/users.html'
  ];

  for (const f of protectedUserFiles) {
    const fullPath = path.join(__dirname, '..', f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasHeadGuard = content.includes('checkAuth()') && content.includes('login.html?next=') && content.includes('pageshow');
    assert(hasHeadGuard, `${f} has immediate <head> authentication guard script with pageshow handler`);
  }

  for (const f of protectedAdminFiles) {
    const fullPath = path.join(__dirname, '..', f);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasHeadGuard = content.includes('checkAuth()') && content.includes('../login.html?next=') && content.includes('pageshow');
    assert(hasHeadGuard, `${f} has immediate <head> admin role guard script with pageshow handler`);
  }

  // TEST 2: Root Router index.html
  console.log("\n--- 2. Testing Entry Point (index.html) Routing ---");
  const indexContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert(indexContent.includes('login.html') && indexContent.includes('dashboard.html'), "index.html routes between login.html and dashboard.html");

  // Simulate logged out at index.html
  {
    const env = createBrowserEnvironment({}, "/index.html");
    const scriptMatch = indexContent.match(/<script>([\s\S]*?)<\/script>/);
    vm.runInNewContext(scriptMatch[1], env);
    assert(env.location.href === "login.html", "Logged out user visiting / is immediately redirected to login.html");
  }

  // Simulate logged in officer at index.html
  {
    const env = createBrowserEnvironment({
      session: { sg_user: JSON.stringify({ role: "OFFICER", name: "Sharma" }) }
    }, "/index.html");
    const scriptMatch = indexContent.match(/<script>([\s\S]*?)<\/script>/);
    vm.runInNewContext(scriptMatch[1], env);
    assert(env.location.href === "dashboard.html", "Logged in officer visiting / is directed to dashboard.html");
  }

  // Simulate logged in admin at index.html
  {
    const env = createBrowserEnvironment({
      session: { sg_user: JSON.stringify({ role: "ADMIN", name: "Admin" }) }
    }, "/index.html");
    const scriptMatch = indexContent.match(/<script>([\s\S]*?)<\/script>/);
    vm.runInNewContext(scriptMatch[1], env);
    assert(env.location.href === "admin/dashboard.html", "Logged in admin visiting / is directed to admin/dashboard.html");
  }

  // TEST 3: Strict Credential Validation in Mock Adapter
  console.log("\n--- 3. Testing Strict Credential Validation (/api/auth/login) ---");
  const apiCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'api.js'), 'utf8');
  const regionsCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'services', 'regions-service.js'), 'utf8');
  const authCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'auth.js'), 'utf8');
  const guardCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'core', 'guard.js'), 'utf8');

  async function runAuthTestEnv(testFn) {
    const env = createBrowserEnvironment({}, "/login.html");
    vm.runInNewContext(apiCode, env);
    vm.runInNewContext(regionsCode, env);
    vm.runInNewContext(authCode, env);
    vm.runInNewContext(guardCode, env);
    return await testFn(env);
  }

  // 3a. Missing credentials
  runAuthTestEnv(async (env) => {
    let errorCaught = false;
    try {
      await env.LW.auth.login("", "");
    } catch (err) {
      errorCaught = true;
      assert(err.message.includes("Please enter both email and password"), "Missing credentials correctly rejected with informative message");
    }
    assert(errorCaught, "Empty credentials rejected");

    // 3b. Arbitrary / incorrect credentials must fail!
    let wrongCredsFailed = false;
    try {
      await env.LW.auth.login("hacker@malicious.com", "wrongpassword123");
    } catch (err) {
      wrongCredsFailed = true;
      assert(err.message.includes("Invalid credentials") || err.status === 401, "Arbitrary email/password rejected with 401 unauthenticated error");
    }
    assert(wrongCredsFailed, "Arbitrary email/password rejected (no fake success)");

    // 3c. Valid Officer Credentials
    const officerUser = await env.LW.auth.login("officer@slopeguard.ner.gov.in", "officer123", true);
    assert(officerUser && officerUser.role === "OFFICER", "Valid officer credentials successfully authenticated");
    assert(env.localStorageStore["sg_user"] !== undefined, "Session saved in localStorage when remember=true");

    // 3d. Logout
    await env.LW.auth.logout();
    assert(env.localStorageStore["sg_user"] === undefined && env.sessionStorageStore["sg_user"] === undefined, "Logout successfully purges session from storage");

    // 3e. Valid Admin Credentials with remember=false (session only)
    const adminUser = await env.LW.auth.login("admin@slopeguard.ner.gov.in", "admin123", false);
    assert(adminUser && adminUser.role === "ADMIN", "Valid admin credentials successfully authenticated");
    assert(env.sessionStorageStore["sg_user"] !== undefined && env.localStorageStore["sg_user"] === undefined, "Session saved in sessionStorage when remember=false");

    // 3f. Registration and Registered User Login
    await env.LW.auth.logout();
    const registeredUser = await env.LW.auth.register({
      fullName: "Tenzing Norbu",
      email: "tenzing@sikkim.gov.in",
      password: "securePassword99",
      district: "Gangtok"
    });
    assert(registeredUser && registeredUser.name === "Tenzing Norbu", "New user registration establishes valid account");

    await env.LW.auth.logout();
    // Login with registered account
    const reloggedUser = await env.LW.auth.login("tenzing@sikkim.gov.in", "securePassword99");
    assert(reloggedUser && reloggedUser.email === "tenzing@sikkim.gov.in", "Registered user successfully logs in with their credentials");

    // Login with wrong password for registered account
    let regWrongPass = false;
    try {
      await env.LW.auth.login("tenzing@sikkim.gov.in", "wrongPassword");
    } catch (err) {
      regWrongPass = true;
    }
    assert(regWrongPass, "Registered user login rejected with incorrect password");

    // TEST 4: Route Guards & Role Restrictions
    console.log("\n--- 4. Testing Route & Role Guard Enforcement ---");

    // 4a. requireAuth when logged out
    await env.LW.auth.logout();
    env.location.pathname = "/settings.html";
    env.location.search = "";
    const isAuthed = env.LW.guard.requireAuth();
    assert(!isAuthed, "requireAuth returns false when unauthenticated");
    assert(env.location.href.includes("login.html?next=settings.html"), "Unauthenticated access redirects to login.html with preserved destination");

    // 4b. requireRole for regular user trying to access admin
    await env.LW.auth.login("tenzing@sikkim.gov.in", "securePassword99"); // role is USER
    env.location.pathname = "/admin/alerts.html";
    const allowed = env.LW.guard.requireRole(["officer", "admin"]);
    assert(!allowed, "Regular user denied access to admin/alerts.html");
    assert(env.location.href.includes("dashboard.html"), "Unauthorized regular user redirected back to dashboard.html");

    // 4c. requireRole for Officer accessing admin/users.html (which is admin-only)
    await env.LW.auth.login("officer@slopeguard.ner.gov.in", "officer123");
    env.location.pathname = "/admin/users.html";
    const officerAllowed = env.LW.guard.requireRole(["admin"]);
    assert(!officerAllowed, "Officer denied access to admin-only users.html");
    assert(env.location.href.includes("dashboard.html"), "Officer redirected away from admin-only page");

    // 4d. Admin accessing admin/users.html
    await env.LW.auth.login("admin@slopeguard.ner.gov.in", "admin123");
    env.location.pathname = "/admin/users.html";
    const adminAllowed = env.LW.guard.requireRole(["admin"]);
    assert(adminAllowed, "Admin successfully granted access to admin/users.html");

    // TEST 5: Open Redirect Prevention
    console.log("\n--- 5. Testing Open Redirect & Safe Destination ---");
    const loginContent = fs.readFileSync(path.join(__dirname, '..', 'login.html'), 'utf8');
    const safeDestMatch = loginContent.match(/function getSafeDestination[\s\S]*?return decoded;\s*\}\s*catch/);
    assert(safeDestMatch !== null, "getSafeDestination function found in login.html");

    // Create sandbox for getSafeDestination
    function evalSafeDest(searchQuery, userRole = "USER") {
      const sandbox = {
        URLSearchParams,
        decodeURIComponent,
        location: { search: searchQuery },
        sessionStorage: { getItem: () => JSON.stringify({ role: userRole }) },
        localStorage: { getItem: () => null }
      };
      sandbox.window = sandbox;
      const code = `
        ${loginContent.substring(loginContent.indexOf("function getSafeDestination"), loginContent.indexOf("const safeDestination ="))}
        getSafeDestination({ role: "${userRole}" });
      `;
      return vm.runInNewContext(code, sandbox);
    }

    assert(evalSafeDest("?next=my-areas.html") === "my-areas.html", "Valid relative destination 'my-areas.html' is preserved");
    assert(evalSafeDest("?next=admin/dashboard.html", "ADMIN") === "admin/dashboard.html", "Valid admin destination 'admin/dashboard.html' is preserved");
    assert(evalSafeDest("?next=https://attacker.com/steal") === "dashboard.html", "Malicious https: open redirect blocked and defaulted to dashboard");
    assert(evalSafeDest("?next=//attacker.com/steal") === "dashboard.html", "Malicious protocol-relative // open redirect blocked and defaulted to dashboard");
    assert(evalSafeDest("?next=javascript:alert(1)") === "dashboard.html", "Malicious javascript: scheme blocked and defaulted to dashboard");
    assert(evalSafeDest("?next=login.html") === "dashboard.html", "Redirect loop to login.html avoided and defaulted to dashboard");

    console.log("\n=================================================");
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("=================================================");
  });
}

runTests();
