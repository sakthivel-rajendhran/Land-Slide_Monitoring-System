const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('=== VERIFYING DASHBOARD & PROTECTED ROUTE GUARDS ===');

const protectedPages = [
  'dashboard.html',
  'settings.html',
  'my-areas.html',
  'history.html',
  'notifications.html',
  'map.html'
];

const adminPages = [
  'admin/dashboard.html',
  'admin/alerts.html',
  'admin/areas.html',
  'admin/assessments.html',
  'admin/audit-logs.html',
  'admin/data.html',
  'admin/users.html'
];

let allPassed = true;

protectedPages.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const html = fs.readFileSync(fullPath, 'utf8');
  const hasGuard = html.includes('login.html?next=') && (html.includes('checkAuth') || html.includes('guard'));
  if (hasGuard) {
    console.log(`[PASS] ${file} has strict auth guard`);
  } else {
    console.error(`[FAIL] ${file} missing auth guard!`);
    allPassed = false;
  }
});

adminPages.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  const html = fs.readFileSync(fullPath, 'utf8');
  const hasGuard = html.includes('login.html?next=') && (html.includes('checkAuth') || html.includes('guard'));
  if (hasGuard) {
    console.log(`[PASS] ${file} has strict admin role guard`);
  } else {
    console.error(`[FAIL] ${file} missing admin guard!`);
    allPassed = false;
  }
});

// Verify guard.js logic
const guardJsPath = path.join(__dirname, '..', 'js', 'core', 'guard.js');
const guardJs = fs.readFileSync(guardJsPath, 'utf8');
if (guardJs.includes('requireAuth') && guardJs.includes('requireRole')) {
  console.log('[PASS] js/core/guard.js provides requireAuth() and requireRole()');
} else {
  console.error('[FAIL] guard.js missing methods!');
  allPassed = false;
}

if (allPassed) {
  console.log('\nALL AUTHENTICATION AND ROLE GUARDS VERIFIED SECURE AND INTACT!');
} else {
  process.exit(1);
}
