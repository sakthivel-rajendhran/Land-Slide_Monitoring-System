const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING DASHBOARD RISK MAP OVERLAY FIX ===\n');

let allPassed = true;
function check(label, condition, details = '') {
  if (condition) {
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}${details ? ' - ' + details : ''}`);
    allPassed = false;
  }
}

// 1. Verify dashboard.html tabView_map has NO iframe
const dashboardHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
const tabMapMatch = dashboardHtml.match(/<div class="dashboard-tab-view"[^>]*id="tabView_map"[\s\S]*?<\/div>\s*<\/section>/i);

check('tabView_map exists in dashboard.html', !!tabMapMatch);
if (tabMapMatch) {
  const content = tabMapMatch[0];
  check('tabView_map does NOT contain iframe', !content.includes('<iframe'));
  check('tabView_map contains #dashboardFullRiskMapCanvas container', content.includes('id="dashboardFullRiskMapCanvas"'));
  check('tabView_map preserves "Full Geographic Risk Map (North Eastern Region)" heading', content.includes('Full Geographic Risk Map (North Eastern Region)'));
  check('tabView_map preserves "Open Dedicated Map Page" link', content.includes('Open Dedicated Map Page'));
  check('tabView_map includes risk classification legend', content.includes('class="map-legend-wrap"'));
  check('tabView_map legend includes CRIT, HIGH, MOD, LOW', content.includes('CRIT') && content.includes('HIGH') && content.includes('MOD') && content.includes('LOW'));
}

// 2. Verify dashboard.js mounts the full map directly
const dashboardJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'pages', 'dashboard.js'), 'utf8');
check('dashboard.js declares fullMapInstance', dashboardJs.includes('fullMapInstance'));
check('dashboard.js implements renderFullRiskMap', dashboardJs.includes('function renderFullRiskMap'));
check('dashboard.js mounts mode "full" on #dashboardFullRiskMapCanvas', dashboardJs.includes('dashboardFullRiskMapCanvas') && dashboardJs.includes('mode: "full"'));
check('dashboard.js handles tab resize invalidation for map tab', dashboardJs.includes('tabId === "map"') && dashboardJs.includes('fullMapInstance?.getMapInstance()?.invalidateSize()'));

// 3. Verify map.html does NOT contain public floating navbar
const mapHtml = fs.readFileSync(path.join(__dirname, '..', 'map.html'), 'utf8');
check('map.html does NOT contain public site-header or floating navbar', !mapHtml.includes('class="site-header"'));
check('map.html does NOT contain Log In button', !mapHtml.includes('btn-nav-login') && !mapHtml.includes('>Log In<'));
check('map.html does NOT contain Get Started button', !mapHtml.includes('Get Started'));
check('map.html contains dedicated authenticated header map-topbar', mapHtml.includes('class="map-topbar"'));
check('map.html preserves riskMapCanvas', mapHtml.includes('id="riskMapCanvas"'));
check('map.html preserves map toolbar and legend', mapHtml.includes('mapToolbarSlot') && mapHtml.includes('map-legend-wrap'));

// 4. Verify notifications.html does NOT contain public floating navbar with Log In / Get Started
const notifHtml = fs.readFileSync(path.join(__dirname, '..', 'notifications.html'), 'utf8');
check('notifications.html does NOT contain site-header floating navbar', !notifHtml.includes('class="site-header"'));
check('notifications.html does NOT contain Log In button', !notifHtml.includes('btn-nav-login') && !notifHtml.includes('>Log In<'));
check('notifications.html does NOT contain Get Started button', !notifHtml.includes('Get Started'));

// 5. Verify public landing page index.html is unaffected and intact
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
check('index.html retains public site-header', indexHtml.includes('class="site-header"'));
check('index.html retains 6 navigation items', indexHtml.includes('#home') && indexHtml.includes('#overview') && indexHtml.includes('#risk-intelligence') && indexHtml.includes('#how-it-works') && indexHtml.includes('#technology') && indexHtml.includes('#about'));
check('index.html retains Live Dashboard CTA', indexHtml.includes('Live Dashboard'));

console.log('\n=== RESULT: ' + (allPassed ? 'ALL CHECKS PASSED!' : 'SOME CHECKS FAILED') + ' ===');
process.exit(allPassed ? 0 : 1);
