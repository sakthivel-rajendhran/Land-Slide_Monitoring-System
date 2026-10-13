/**
 * test_pwa_implementation.js
 * Comprehensive automated verification for SlopeGuard Progressive Web App (PWA)
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

console.log("=== 1. Checking PWA Web App Manifest ===");

const manifestPath = path.join(__dirname, '..', 'manifest.webmanifest');
assert(fs.existsSync(manifestPath), "manifest.webmanifest exists");

const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifestContent.name === "SlopeGuard", "Manifest name is 'SlopeGuard'");
assert(manifestContent.short_name === "SlopeGuard", "Manifest short_name is 'SlopeGuard'");
assert(manifestContent.description.includes("Landslide Risk Monitoring"), "Manifest has accurate description");
assert(manifestContent.display === "standalone", "Display mode is standalone");
assert(manifestContent.theme_color.toLowerCase() === "#14251a", "Theme color matches #14251A");
assert(manifestContent.background_color.toLowerCase() === "#0b120d", "Background color matches #0B120D");
assert(manifestContent.start_url === "./index.html", "Start URL is ./index.html");

const icon192 = manifestContent.icons.find(i => i.sizes === "192x192" && i.purpose === "any");
const icon512 = manifestContent.icons.find(i => i.sizes === "512x512" && i.purpose === "any");
const maskable192 = manifestContent.icons.find(i => i.sizes === "192x192" && i.purpose === "maskable");
const maskable512 = manifestContent.icons.find(i => i.sizes === "512x512" && i.purpose === "maskable");

assert(icon192 && fs.existsSync(path.join(__dirname, '..', icon192.src)), "192x192 icon exists on disk");
assert(icon512 && fs.existsSync(path.join(__dirname, '..', icon512.src)), "512x512 icon exists on disk");
assert(maskable192 && fs.existsSync(path.join(__dirname, '..', maskable192.src)), "192x192 maskable icon exists on disk");
assert(maskable512 && fs.existsSync(path.join(__dirname, '..', maskable512.src)), "512x512 maskable icon exists on disk");

console.log("\n=== 2. Checking HTML Manifest Links and PWA Meta Tags ===");

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

assert(indexHtml.includes('<link rel="manifest" href="manifest.webmanifest">'), "index.html links manifest.webmanifest");
assert(indexHtml.includes('<meta name="theme-color" content="#14251A">'), "index.html has theme-color meta tag");
assert(indexHtml.includes('<link rel="apple-touch-icon" href="assets/icons/icon-192x192.png">'), "index.html has apple-touch-icon");
assert(indexHtml.includes("btnInstallApp"), "index.html has install action button");
assert(indexHtml.includes("beforeinstallprompt"), "index.html handles beforeinstallprompt event");
assert(indexHtml.includes("navigator.serviceWorker.register('./sw.js')"), "index.html registers service worker");

const dashboardHtmlPath = path.join(__dirname, '..', 'dashboard.html');
const dashboardHtml = fs.readFileSync(dashboardHtmlPath, 'utf8');
assert(dashboardHtml.includes('<link rel="manifest" href="manifest.webmanifest">'), "dashboard.html links manifest.webmanifest");
assert(dashboardHtml.includes("navigator.serviceWorker.register('./sw.js')"), "dashboard.html registers service worker");

console.log("\n=== 3. Checking Service Worker (sw.js) Architecture ===");

const swPath = path.join(__dirname, '..', 'sw.js');
assert(fs.existsSync(swPath), "sw.js exists");

const swContent = fs.readFileSync(swPath, 'utf8');
assert(swContent.includes("slopeguard-pwa-v"), "Uses versioned cache name");
assert(swContent.includes("CORE_SHELL_ASSETS"), "Contains pre-cache list of core shell assets");
assert(swContent.includes("offline.html"), "Pre-caches offline.html");
assert(swContent.includes("trimCache"), "Enforces cache limits on map tiles");
assert(swContent.includes("MAX_TILE_COUNT"), "Specifies MAX_TILE_COUNT threshold to prevent unbounded storage");
assert(swContent.includes("url.pathname.includes(\"/api/auth/\")"), "Strict security: NEVER caches /api/auth/ responses");
assert(swContent.includes("caches.delete(name)"), "Cleans up obsolete version caches during activate");
assert(swContent.includes("self.addEventListener(\"push\""), "Implements Web Push event listener");
assert(swContent.includes("self.addEventListener(\"notificationclick\""), "Implements notificationclick handler");

console.log("\n=== 4. Checking Offline Behavior & Map Safety ===");

const offlineHtmlPath = path.join(__dirname, '..', 'offline.html');
assert(fs.existsSync(offlineHtmlPath), "offline.html exists");

const offlineHtml = fs.readFileSync(offlineHtmlPath, 'utf8');
assert(offlineHtml.includes("Safety Disclaimer: Data May Be Outdated"), "Explains cached data limitations");
assert(offlineHtml.includes("Retry Connection"), "Provides reconnect action button");
assert(offlineHtml.includes("lastSyncTimeText"), "Displays timestamp of last cached telemetry");

const riskMapPath = path.join(__dirname, '..', 'js', 'components', 'risk-map.js');
const riskMapContent = fs.readFileSync(riskMapPath, 'utf8');
assert(riskMapContent.includes("tileerror"), "Listens for tileerror to gracefully handle missing offline tiles");
assert(riskMapContent.includes("map-offline-notice"), "Provides visual offline notice when map tiles are unavailable");

console.log("\n=== 5. Checking Push Notification Services ===");

const pushJsPath = path.join(__dirname, '..', 'js', 'services', 'push.js');
assert(fs.existsSync(pushJsPath), "push.js exists");

const pushJsContent = fs.readFileSync(pushJsPath, 'utf8');
assert(pushJsContent.includes("LW.push"), "Defines window.LW.push service");
assert(pushJsContent.includes("enable()"), "Implements user-initiated push enable method");
assert(pushJsContent.includes("/api/push/subscribe"), "Sends subscription payload to backend /api/push/subscribe endpoint");

const regionsServicePath = path.join(__dirname, '..', 'js', 'services', 'regions-service.js');
const regionsServiceContent = fs.readFileSync(regionsServicePath, 'utf8');
assert(regionsServiceContent.includes("/api/push/subscribe"), "Mock backend handles /api/push/subscribe");
assert(regionsServiceContent.includes("/api/push/unsubscribe"), "Mock backend handles /api/push/unsubscribe");
assert(regionsServiceContent.includes("sg_push_subscriptions"), "Persists push subscriptions securely");

console.log(`\n========================================`);
console.log(`Summary: ${testsPassed} passed, ${testsFailed} failed.`);
console.log(`========================================`);

if (testsFailed > 0) {
  process.exit(1);
}
