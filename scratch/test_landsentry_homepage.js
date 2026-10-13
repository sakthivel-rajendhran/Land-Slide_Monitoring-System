/**
 * LANDSENTRY Homepage & Navigation Restructure Verification Suite
 */

const fs = require('fs');
const path = require('path');

function testLandsentryHomepage() {
  console.log("=================================================");
  console.log("   LANDSENTRY HOMEPAGE & NAVIGATION TEST SUITE   ");
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

  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  // 1. SECTION INVENTORY & ORDER
  console.log("--- 1. Section Order Verification ---");
  const section1Nav = indexHtml.indexOf('<header class="ls-navbar"');
  const section2Hero = indexHtml.indexOf('<section class="ls-hero" id="home"');
  const section3RiskMap = indexHtml.indexOf('<section class="ls-risk-preview" id="risk-intelligence"');
  const section4Overview = indexHtml.indexOf('<section class="ls-overview" id="overview"');
  const section5Capabilities = indexHtml.indexOf('<section class="ls-capabilities" id="capabilities"');
  const section6Workflow = indexHtml.indexOf('<section class="ls-workflow" id="how-it-works"');
  const section7Tech = indexHtml.indexOf('<section class="ls-tech" id="technology"');
  const section8About = indexHtml.indexOf('<section class="ls-about" id="about"');
  const section9FinalCta = indexHtml.indexOf('<section class="ls-final-cta"');
  const section10Footer = indexHtml.indexOf('<footer class="ls-footer"');

  assert(section1Nav !== -1, "Section 1 (Navbar) found");
  assert(section2Hero > section1Nav, "Section 2 (Hero #home) follows Navbar");
  assert(section3RiskMap > section2Hero, "Section 3 (Risk Intelligence #risk-intelligence) follows Hero");
  assert(section4Overview > section3RiskMap, "Section 4 (Overview #overview) follows Risk Intelligence");
  assert(section5Capabilities > section4Overview, "Section 5 (Capabilities #capabilities) follows Overview");
  assert(section6Workflow > section5Capabilities, "Section 6 (How It Works #how-it-works) follows Capabilities");
  assert(section7Tech > section6Workflow, "Section 7 (Technology #technology) follows How It Works");
  assert(section8About > section7Tech, "Section 8 (About #about) follows Technology");
  assert(section9FinalCta > section8About, "Section 9 (Final CTA) follows About");
  assert(section10Footer > section9FinalCta, "Section 10 (Footer) follows Final CTA");

  // 2. NAVIGATION BAR
  console.log("\n--- 2. Navigation Bar Elements & Order ---");
  const navMenuMatch = indexHtml.match(/<ul class="ls-nav-menu"[\s\S]*?<\/ul>/);
  assert(navMenuMatch !== null, "Navigation menu found");
  const navMenuHtml = navMenuMatch ? navMenuMatch[0] : "";

  assert(navMenuHtml.includes('href="#home"') && navMenuHtml.includes('>Home<'), "Nav item 1: Home (#home)");
  assert(navMenuHtml.includes('href="#overview"') && navMenuHtml.includes('>Overview<'), "Nav item 2: Overview (#overview)");
  assert(navMenuHtml.includes('href="#risk-intelligence"') && navMenuHtml.includes('>Risk Intelligence<'), "Nav item 3: Risk Intelligence (#risk-intelligence)");
  assert(navMenuHtml.includes('href="#how-it-works"') && navMenuHtml.includes('>How It Works<'), "Nav item 4: How It Works (#how-it-works)");
  assert(navMenuHtml.includes('href="#technology"') && navMenuHtml.includes('>Technology<'), "Nav item 5: Technology (#technology)");
  assert(navMenuHtml.includes('href="#about"') && navMenuHtml.includes('>About<'), "Nav item 6: About (#about)");
  assert(indexHtml.includes('href="login.html"') && indexHtml.includes('Sign In'), "Right nav action: Sign In (login.html)");

  // Verify navigation ordering
  const posHome = navMenuHtml.indexOf('href="#home"');
  const posOverview = navMenuHtml.indexOf('href="#overview"');
  const posRisk = navMenuHtml.indexOf('href="#risk-intelligence"');
  const posHow = navMenuHtml.indexOf('href="#how-it-works"');
  const posTech = navMenuHtml.indexOf('href="#technology"');
  const posAbout = navMenuHtml.indexOf('href="#about"');
  assert(posHome < posOverview && posOverview < posRisk && posRisk < posHow && posHow < posTech && posTech < posAbout, 
    "Nav links appear in exact required sequence: Home -> Overview -> Risk Intelligence -> How It Works -> Technology -> About");

  // 3. HERO CONTENT & CALLOUTS
  console.log("\n--- 3. Hero Section Requirements ---");
  assert(indexHtml.includes('AI-POWERED LANDSLIDE MONITORING'), "Hero eyebrow: 'AI-POWERED LANDSLIDE MONITORING'");
  assert(indexHtml.includes('See the Risk.') && indexHtml.includes('Understand the Terrain.') && indexHtml.includes('Act Before Disaster.'),
    "Hero headline: 'See the Risk. Understand the Terrain. Act Before Disaster.'");
  assert(indexHtml.includes('LANDSENTRY combines geospatial information, environmental indicators, and AI-driven risk analysis'),
    "Hero supporting paragraph matches specifications");
  assert(indexHtml.includes('Access Risk Dashboard'), "Hero primary CTA: 'Access Risk Dashboard'");
  assert(indexHtml.includes('Explore Risk Intelligence'), "Hero secondary CTA: 'Explore Risk Intelligence'");
  assert(indexHtml.includes('Geospatial Risk Analysis') && indexHtml.includes('Environmental Monitoring') && indexHtml.includes('Early-Warning Support'),
    "Three capability labels present below hero CTAs");

  // 4. STATIC RISK-MAP PREVIEW
  console.log("\n--- 4. Static Landslide Risk-Map Preview ---");
  assert(indexHtml.includes('LANDSLIDE RISK INTELLIGENCE'), "Heading: 'LANDSLIDE RISK INTELLIGENCE'");
  assert(indexHtml.includes('Explore an illustrative view of terrain vulnerability and landslide risk zones.'),
    "Supporting text matches specifications");
  assert(indexHtml.includes('assets/images/landsentry-risk-map.jpg'), "References local static asset 'assets/images/landsentry-risk-map.jpg'");
  
  // Verify image exists on disk
  const imgPath = path.join(__dirname, '..', 'assets', 'images', 'landsentry-risk-map.jpg');
  assert(fs.existsSync(imgPath) && fs.statSync(imgPath).size > 100000, "Static image file exists on disk and has valid size");

  assert(indexHtml.includes('ILLUSTRATIVE RISK VISUALIZATION'), "Label: 'ILLUSTRATIVE RISK VISUALIZATION'");
  assert(indexHtml.includes('Green &mdash; Low Risk') || indexHtml.includes('Green — Low Risk'), "Legend contains Green — Low Risk");
  assert(indexHtml.includes('Yellow &mdash; Moderate Risk') || indexHtml.includes('Yellow — Moderate Risk'), "Legend contains Yellow — Moderate Risk");
  assert(indexHtml.includes('Orange &mdash; High Risk') || indexHtml.includes('Orange — High Risk'), "Legend contains Orange — High Risk");
  assert(indexHtml.includes('Red &mdash; Critical Risk') || indexHtml.includes('Red — Critical Risk'), "Legend contains Red — Critical Risk");
  assert(indexHtml.includes('Illustrative risk visualization — sign in to access live map monitoring.'),
    "Exact caption present: 'Illustrative risk visualization — sign in to access live map monitoring.'");
  assert(indexHtml.includes('Sign In to View Live Map'), "CTA button: 'Sign In to View Live Map'");

  // 5. STRICT SECURITY & MAP HYGIENE
  console.log("\n--- 5. Public Map Hygiene (Zero Leakage) ---");
  assert(!indexHtml.includes('leaflet.js') && !indexHtml.includes('leaflet.css'), "No Leaflet library on public homepage");
  assert(!indexHtml.includes('tile.openstreetmap.org'), "No OpenStreetMap live tile loading on public homepage");
  assert(!indexHtml.includes('L.map('), "No interactive L.map initialization on public homepage");

  // 6. PROHIBITED STRIPS & CONTACT REMOVAL
  console.log("\n--- 6. Negative Constraints Verification ---");
  assert(!indexHtml.includes('POWERED BY TRUSTED GEOGRAPHIC'), "Prohibited strip 'POWERED BY TRUSTED GEOGRAPHIC...' is NOT present");
  assert(!indexHtml.toLowerCase().includes('contact us') && !indexHtml.toLowerCase().includes('contact.html'),
    "Zero contact links or contact pages on homepage");

  // 7. FOOTER REQUIREMENTS
  console.log("\n--- 7. Footer Specifications ---");
  assert(indexHtml.includes('currentYear'), "Footer contains dynamic year element");
  assert(indexHtml.includes('LAND<span style="color: var(--ls-primary);">SENTRY</span>') || indexHtml.includes('LANDSENTRY'),
    "Footer contains LANDSENTRY branding");

  // 8. ROUTE GUARDS PRESERVATION
  console.log("\n--- 8. Protected Dashboard Still Requires Authentication ---");
  const dashHtml = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
  assert(dashHtml.includes('login.html?next='), "dashboard.html retains immediate authentication guard");

  console.log("\n=================================================");
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
}

testLandsentryHomepage();
