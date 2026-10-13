const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

console.log('=== VERIFYING SLOPEGUARD NAVIGATION & HOMEPAGE STRUCTURE ===\n');

let allPassed = true;
function check(label, condition, details = '') {
  if (condition) {
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}${details ? ' - ' + details : ''}`);
    allPassed = false;
  }
}

// 1. Branding: SlopeGuard title and no LANDSENTRY wordmark in visible HTML
check('Page <title> uses SlopeGuard', indexHtml.includes('<title>SlopeGuard'));
check('Visible header brand uses SlopeGuard', indexHtml.includes('Slope<span>Guard</span>'));
const hasOldWordmarkInHeader = /<header[\s\S]*?LANDSENTRY[\s\S]*?<\/header>/i.test(indexHtml);
check('Header does NOT contain LANDSENTRY wordmark', !hasOldWordmarkInHeader);

// 2. Header layout separation: Branding, Navigation bar, and CTA are separate siblings in header-container
const headerMatch = indexHtml.match(/<header class="site-header" id="navbar">([\s\S]*?)<\/header>/i);
check('Header element exists', !!headerMatch);

if (headerMatch) {
  const headerContent = headerMatch[1];
  const hasBrandLogo = headerContent.includes('class="brand-logo"');
  const hasNavBar = headerContent.includes('class="nav-bar"');
  const hasHeaderActions = headerContent.includes('class="header-actions"');
  const hasLiveDashboardInActions = /<div class="header-actions"[\s\S]*?Live Dashboard[\s\S]*?<\/div>/i.test(headerContent);

  check('Branding is present in header', hasBrandLogo);
  check('Navigation bar <nav class="nav-bar"> is a distinct element in header', hasNavBar);
  check('Header actions <div class="header-actions"> is a distinct element in header', hasHeaderActions);
  check('Live Dashboard CTA is placed in header-actions outside the navigation bar', hasLiveDashboardInActions);
}

// 3. Navigation items: exactly 6 items in exact required order
const expectedNav = [
  { text: 'Home', href: '#home' },
  { text: 'Overview', href: '#overview' },
  { text: 'Risk Intelligence', href: '#risk-intelligence' },
  { text: 'How It Works', href: '#how-it-works' },
  { text: 'Technology', href: '#technology' },
  { text: 'About', href: '#about' }
];

const navMatch = indexHtml.match(/<nav class="nav-bar"[\s\S]*?<\/nav>/i);
check('Dedicated <nav class="nav-bar"> exists', !!navMatch);

if (navMatch) {
  const navContent = navMatch[0];
  const navLinks = [...navContent.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  
  check(`Navigation contains exactly 6 items (found ${navLinks.length})`, navLinks.length === 6);
  
  // Check if Dashboard or Sign In is inside <nav class="nav-bar">
  const hasDashboardInNav = /Dashboard/i.test(navContent);
  const hasSignInInNav = /Sign In|Log In/i.test(navContent);
  check('Dashboard is removed from navigation bar', !hasDashboardInNav);
  check('Sign In is removed from navigation bar', !hasSignInInNav);

  navLinks.forEach((link, idx) => {
    const href = link[1];
    const text = link[2].trim();
    if (idx < expectedNav.length) {
      check(
        `Nav item ${idx + 1} is "${expectedNav[idx].text}" -> ${expectedNav[idx].href}`,
        text === expectedNav[idx].text && href === expectedNav[idx].href,
        `Got "${text}" -> ${href}`
      );
    }
  });
}

// 4. Exact section order in document
const expectedSections = [
  'home',
  'overview',
  'risk-intelligence',
  'how-it-works',
  'technology',
  'about'
];

const sectionMatches = [...indexHtml.matchAll(/<section[^>]*id=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
console.log('\nDocument section order detected:', sectionMatches.join(' -> '));

check('First section is home', sectionMatches[0] === 'home');
check('Second section is overview', sectionMatches[1] === 'overview');
check('Third section is risk-intelligence', sectionMatches[2] === 'risk-intelligence');
check('Fourth section is how-it-works', sectionMatches[3] === 'how-it-works');
check('Fifth section is technology', sectionMatches[4] === 'technology');
check('Sixth section is about', sectionMatches[5] === 'about');

// 5. Verification of static preview & zero Leaflet on public page
check('Public index.html does NOT import leaflet.js', !indexHtml.includes('leaflet.js'));
check('Public index.html does NOT import leaflet.css', !indexHtml.includes('leaflet.css'));
check('Public index.html does NOT contain OpenStreetMap tile URLs', !indexHtml.includes('tile.openstreetmap.org'));
check('Exact static map caption exists', indexHtml.includes('Illustrative risk visualization — sign in to access live map monitoring.'));

// 6. Zero contact references check
check('No contact links or buttons exist in index.html', !/href=["']#contact["']/i.test(indexHtml));

// 7. Footer structure
const footerMatch = indexHtml.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/i);
check('Footer exists', !!footerMatch);
if (footerMatch) {
  const footerContent = footerMatch[1];
  check('Footer branding uses SlopeGuard', footerContent.includes('Slope<span>Guard</span>'));
  check('Footer copyright uses SlopeGuard', footerContent.includes('SlopeGuard'));
}

console.log('\n=== RESULT: ' + (allPassed ? 'ALL CHECKS PASSED SUCCESSFULLY!' : 'SOME CHECKS FAILED') + ' ===');
process.exit(allPassed ? 0 : 1);
