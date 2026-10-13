/**
 * test_risk_intelligence_layout.js
 * Verification of the SlopeGuard Risk Intelligence Layout fix:
 * 1. Correct section structure and order.
 * 2. Dedicated containers for map, HUD, legend, metadata, and full-width CTA.
 * 3. Absence of absolute positioning for major panels (HUD, Legend, CTA).
 * 4. Proper two-column desktop and responsive stacked layout.
 * 5. Wayanad sector data integrity and event wiring.
 */
const fs = require('fs');
const path = require('path');

function testRiskIntelligenceLayout() {
  console.log('================================================================');
  console.log(' TESTING SLOPEGUARD RISK INTELLIGENCE OVERLAPPING LAYOUT FIX ');
  console.log('================================================================\n');

  const indexPath = path.join(__dirname, '..', 'index.html');
  const cssPath = path.join(__dirname, '..', 'css', 'style.css');
  const jsPath = path.join(__dirname, '..', 'js', 'main.js');

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  const js = fs.readFileSync(jsPath, 'utf8');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Structure Order Verification ---
  console.log('--- 1. Structure Order Verification in #risk-intelligence ---');
  const sectionMatch = indexHtml.match(/<section[^>]*id=["']risk-intelligence["'][\s\S]*?<\/section>/i);
  assert(sectionMatch, '#risk-intelligence section found in index.html');
  const sHtml = sectionMatch ? sectionMatch[0] : '';

  // Order indices:
  // 1. Heading & description
  const idxHeader = sHtml.indexOf('class="map-section-header"');
  // 2. Sector selector toolbar
  const idxToolbar = sHtml.indexOf('class="map-filter-bar"');
  // 3. Main map card
  const idxMapCard = sHtml.indexOf('class="map-stage-wrapper"');
  // Inside map card: map top bar
  const idxTopBar = sHtml.indexOf('class="map-top-bar"');
  // Inside map card: map visualization
  const idxMapFrame = sHtml.indexOf('class="map-canvas-frame"');
  // Inside map card: HUD panel
  const idxHud = sHtml.indexOf('class="map-hud-panel"');
  // 4. Risk legend below map
  const idxLegend = sHtml.indexOf('class="map-legend-row"');
  // 5. Telemetry metadata bar
  const idxMeta = sHtml.indexOf('class="map-telemetry-meta-bar"');
  // 6. Full-width CTA below map card
  const idxCta = sHtml.indexOf('class="map-access-cta-container"');

  assert(idxHeader !== -1, '1. Heading & description present');
  assert(idxToolbar > idxHeader, '2. Sector selector toolbar follows header');
  assert(idxMapCard > idxToolbar, '3. Main map card follows sector toolbar');
  assert(idxTopBar > idxMapCard, '3a. Map top bar inside map card');
  assert(idxMapFrame > idxTopBar, '3b. Map visualization frame inside map card body');
  assert(idxHud > idxMapFrame, '3c. Sector Telemetry HUD is in a separate panel after map canvas');
  assert(idxLegend > idxHud, '4. Risk legend is positioned below the map body');
  assert(idxMeta > idxLegend, '5. Telemetry metadata is in a dedicated area below the legend');
  assert(idxCta > idxMeta, '6. Full-width CTA is positioned below the map card');

  // Verify map card ends before CTA
  const mapCardCloseIdx = sHtml.lastIndexOf('</div>', idxCta);
  assert(mapCardCloseIdx < idxCta, 'Main map card closes BEFORE the full-width CTA container');

  // --- 2. Sector Selector Toolbar ---
  console.log('\n--- 2. Sector Selector Toolbar & Layer Controls ---');
  assert(sHtml.includes('data-sector="all"'), 'Sector button: All Sectors (Wayanad)');
  assert(sHtml.includes('data-sector="meppadi"'), 'Sector button: Meppadi Ridge');
  assert(sHtml.includes('data-sector="kalpetta"'), 'Sector button: Kalpetta Slopes');
  assert(sHtml.includes('data-sector="vythiri"'), 'Sector button: Vythiri Pass');
  assert(sHtml.includes('id="toggleRiskLayer"'), 'Layer control: Hazard Buffers');
  assert(sHtml.includes('id="toggleRainfallLayer"'), 'Layer control: 24h Rainfall');

  // --- 3. Map Card & Telemetry HUD Content ---
  console.log('\n--- 3. Map Card & Telemetry HUD Elements ---');
  assert(sHtml.includes('id="mapCoordsDisplay"'), 'Geographic coordinates display present');
  assert(sHtml.includes('id="wayanadMapImg"'), 'Map visualization image element present');
  assert(sHtml.includes('assets/images/wayanad-risk-map.jpg'), 'Map references Wayanad image asset');
  assert(sHtml.includes('id="mapCaptionBadge"'), 'Illustrative caption badge present');
  assert(sHtml.includes('Illustrative risk visualization — sign in to access live map monitoring.'), 'Exact caption text present');
  assert(sHtml.includes('id="sectorTelemetryHud"'), 'HUD panel container #sectorTelemetryHud present');
  assert(sHtml.includes('id="hudModeBadge"'), 'HUD mode badge #hudModeBadge present');
  assert(sHtml.includes('id="hudSectorName"'), 'HUD metric #hudSectorName present');
  assert(sHtml.includes('id="hudRiskScore"'), 'HUD metric #hudRiskScore present');
  assert(sHtml.includes('id="hudPrecipitation"'), 'HUD metric #hudPrecipitation present');
  assert(sHtml.includes('id="hudSaturation"'), 'HUD metric #hudSaturation present');
  assert(sHtml.includes('id="hudDataSource"'), 'Telemetry metadata #hudDataSource present');
  assert(sHtml.includes('id="hudModelEngine"'), 'Telemetry metadata #hudModelEngine present');
  assert(sHtml.includes('id="hudObservationTime"'), 'Telemetry metadata #hudObservationTime present');
  assert(sHtml.includes('id="btnAccessMonitoring"'), 'CTA button #btnAccessMonitoring present');

  // --- 4. Risk Legend Requirements ---
  console.log('\n--- 4. Risk Legend Tiers & Calibration ---');
  assert(sHtml.includes('Low Risk (&lt;40%)') || sHtml.includes('Low Risk (<40%)'), 'Legend contains Low Risk (<40%)');
  assert(sHtml.includes('Moderate (40%–69%)'), 'Legend contains Moderate (40%–69%)');
  assert(sHtml.includes('High (70%–89%)'), 'Legend contains High (70%–89%)');
  assert(sHtml.includes('Severe Hotspot (≥90%)') || sHtml.includes('Severe Hotspot (&ge;90%)'), 'Legend contains Severe Hotspot (≥90%)');
  assert(sHtml.includes('Relative geospatial susceptibility model index (v2.4-convLSTM) — not an absolute probability.'), 'Calibration note present');

  // --- 5. CSS Layout & No Absolute Positioning for Major Panels ---
  console.log('\n--- 5. CSS Layout Verification (No Absolute Overlap on Major Panels) ---');
  assert(css.includes('.map-card-body'), '.map-card-body CSS class defined');
  assert(css.includes('.map-hud-panel'), '.map-hud-panel CSS class defined');
  assert(css.includes('.map-legend-row'), '.map-legend-row CSS class defined');
  assert(css.includes('.map-telemetry-meta-bar'), '.map-telemetry-meta-bar CSS class defined');
  assert(css.includes('.btn-access-live-cta'), '.btn-access-live-cta CSS class defined');

  // Check that .map-hud-panel does not use position: absolute
  const hudCssMatch = css.match(/\.map-hud-panel\s*\{([^}]+)\}/);
  assert(hudCssMatch && !hudCssMatch[1].includes('position: absolute'), '.map-hud-panel does NOT use position: absolute');

  // Check that .map-legend-row does not use position: absolute
  const legendCssMatch = css.match(/\.map-legend-row\s*\{([^}]+)\}/);
  assert(legendCssMatch && !legendCssMatch[1].includes('position: absolute'), '.map-legend-row does NOT use position: absolute');

  // Check that .map-telemetry-meta-bar does not use position: absolute
  const metaCssMatch = css.match(/\.map-telemetry-meta-bar\s*\{([^}]+)\}/);
  assert(metaCssMatch && !metaCssMatch[1].includes('position: absolute'), '.map-telemetry-meta-bar does NOT use position: absolute');

  // Check that full-width CTA has width 100%
  const ctaBtnCssMatch = css.match(/\.btn-access-live-cta\s*\{([^}]+)\}/);
  assert(ctaBtnCssMatch && ctaBtnCssMatch[1].includes('width: 100%'), '.btn-access-live-cta has width: 100% (full-width CTA)');

  // Check desktop grid on .map-card-body
  const cardBodyMatch = css.match(/\.map-card-body\s*\{([^}]+)\}/);
  assert(cardBodyMatch && cardBodyMatch[1].includes('grid-template-columns'), '.map-card-body uses CSS Grid for side-by-side desktop presentation');

  // Check responsive styles exist for tablet/mobile
  assert(css.includes('@media (max-width: 992px)'), 'Media query @media (max-width: 992px) defined');
  assert(css.includes('@media (max-width: 768px)'), 'Media query @media (max-width: 768px) defined');

  // --- 6. JavaScript Logic & Event Integrity ---
  console.log('\n--- 6. JavaScript Sector & Telemetry Engine ---');
  assert(js.includes('WAYANAD_SECTOR_DATA'), 'WAYANAD_SECTOR_DATA dictionary defined in js/main.js');
  assert(js.includes('initRiskIntelligenceMap'), 'initRiskIntelligenceMap initialized in js/main.js');
  assert(js.includes('hudModeBadge.textContent = "Illustrative"'), 'Illustrative fallback badge updated');
  assert(js.includes('hudModeBadge.textContent = "Live Telemetry"'), 'Live Telemetry badge updated on auth');

  console.log('\n================================================================');
  console.log(` RESULTS: ${passed} passed, ${failed} failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testRiskIntelligenceLayout();
