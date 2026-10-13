/**
 * test_risk_intelligence_wayanad.js
 * Verification test suite for SlopeGuard Risk Intelligence Map & Telemetry HUD.
 */
const fs = require('fs');
const path = require('path');

function runTests() {
  console.log('--- TESTING SLOPEGUARD RISK INTELLIGENCE & TELEMETRY ---');

  // 1. Inspect index.html
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  // Check map image src
  const mapImgMatch = indexHtml.match(/<img[^>]*id=["']wayanadMapImg["'][^>]*>/i) || indexHtml.match(/<img[^>]*src=["'][^"']*wayanad-risk-map\.jpg["'][^>]*>/i);
  if (!mapImgMatch) {
    throw new Error('FAIL: #wayanadMapImg image not found in index.html');
  }
  const imgSrcMatch = mapImgMatch[0].match(/src=["']([^"']+)["']/i);
  const mapImgSrc = imgSrcMatch ? imgSrcMatch[1] : '';
  console.log('Map image source:', mapImgSrc);
  if (!mapImgSrc.includes('wayanad-risk-map.jpg')) {
    throw new Error(`FAIL: Expected wayanad-risk-map.jpg, but got ${mapImgSrc}`);
  }
  console.log('PASS: Correct Wayanad map asset is referenced.');

  // Verify no Gangtok, Sohra, Haflong or Kohima in the public landing page risk intelligence section
  const riskSectionMatch = indexHtml.match(/<section[^>]*id=["']risk-intelligence["'][\s\S]*?<\/section>/i);
  if (!riskSectionMatch) {
    throw new Error('FAIL: #risk-intelligence section not found in index.html');
  }
  const riskSectionHtml = riskSectionMatch[0];
  const forbiddenNames = ['Gangtok', 'Sohra', 'Haflong', 'Kohima', 'North Eastern'];
  forbiddenNames.forEach(name => {
    if (new RegExp(name, 'i').test(riskSectionHtml)) {
      throw new Error(`FAIL: Found incorrect geographic label "${name}" in #risk-intelligence!`);
    }
  });
  console.log('PASS: No incorrect geographic labels (Gangtok, Sohra, etc.) found in Risk Intelligence section.');

  // Check for sectors: All, Meppadi, Kalpetta, Vythiri
  ['all', 'meppadi', 'kalpetta', 'vythiri'].forEach(sec => {
    if (!riskSectionHtml.includes(`data-sector="${sec}"`)) {
      throw new Error(`FAIL: Missing sector button for "${sec}"`);
    }
  });
  console.log('PASS: All 4 sector buttons (all, meppadi, kalpetta, vythiri) configured.');

  // Check for pins: pinMeppadi, pinKalpetta, pinVythiri
  ['pinMeppadi', 'pinKalpetta', 'pinVythiri'].forEach(pinId => {
    if (!riskSectionHtml.includes(`id="${pinId}"`)) {
      throw new Error(`FAIL: Missing map marker pin #${pinId}`);
    }
  });
  console.log('PASS: Interactive map sector pins present.');

  // Check legend categories and boundary conditions
  if (!riskSectionHtml.includes('Low Risk (&lt;40%)') && !riskSectionHtml.includes('Low Risk (<40%)')) {
    throw new Error('FAIL: Low Risk legend (<40%) missing or incorrect');
  }
  if (!riskSectionHtml.includes('40%–69%') && !riskSectionHtml.includes('40% - 69%')) {
    throw new Error('FAIL: Moderate Risk legend (40%–69%) missing or incorrect');
  }
  if (!riskSectionHtml.includes('70%–89%') && !riskSectionHtml.includes('70% - 89%')) {
    throw new Error('FAIL: High Risk legend (70%–89%) missing or incorrect');
  }
  if (!riskSectionHtml.includes('Severe Hotspot (&ge;90%)') && !riskSectionHtml.includes('Severe Hotspot (≥90%)')) {
    throw new Error('FAIL: Severe Hotspot legend (≥90%) missing or incorrect');
  }
  console.log('PASS: Risk legend has mutually exclusive, standardized boundary conditions.');

  // Check model interpretation caption
  if (!riskSectionHtml.includes('Relative geospatial susceptibility model index (v2.4-convLSTM) — not an absolute probability.')) {
    throw new Error('FAIL: Scientific calibration note missing in legend.');
  }
  console.log('PASS: Scientific disclaimer clarifying susceptibility index vs. calibrated probability present.');

  // Check telemetry provenance fields
  ['hudDataSource', 'hudModelEngine', 'hudObservationTime', 'hudModeBadge'].forEach(hudId => {
    if (!riskSectionHtml.includes(`id="${hudId}"`)) {
      throw new Error(`FAIL: Missing Telemetry HUD provenance element #${hudId}`);
    }
  });
  console.log('PASS: Telemetry HUD provenance elements present.');

  // 2. Inspect js/main.js
  const mainJsPath = path.join(__dirname, '..', 'js', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  if (!mainJs.includes('initRiskIntelligenceMap')) {
    throw new Error('FAIL: initRiskIntelligenceMap function missing in js/main.js');
  }
  if (!mainJs.includes('WAYANAD_SECTOR_DATA')) {
    throw new Error('FAIL: WAYANAD_SECTOR_DATA dataset missing in js/main.js');
  }
  if (!mainJs.includes('layerHazardBuffers') || !mainJs.includes('layerRainfall')) {
    throw new Error('FAIL: Layer toggle handlers missing in js/main.js');
  }
  console.log('PASS: js/main.js includes complete sector synchronization and telemetry engine.');

  // 3. Inspect regions-service.js
  const regionsPath = path.join(__dirname, '..', 'js', 'services', 'regions-service.js');
  const regionsJs = fs.readFileSync(regionsPath, 'utf8');
  if (!regionsJs.includes('Meppadi Ridge') || !regionsJs.includes('Kalpetta Slopes') || !regionsJs.includes('Vythiri Pass')) {
    throw new Error('FAIL: Wayanad regions missing in regions-service.js');
  }
  console.log('PASS: Wayanad sectors registered in regions-service.js');

  // 4. Verify map image exists on disk
  const imgPath = path.join(__dirname, '..', 'assets', 'images', 'wayanad-risk-map.jpg');
  if (!fs.existsSync(imgPath)) {
    throw new Error('FAIL: assets/images/wayanad-risk-map.jpg file does not exist on disk!');
  }
  const stat = fs.statSync(imgPath);
  console.log(`PASS: assets/images/wayanad-risk-map.jpg exists and is ${stat.size} bytes.`);

  console.log('\nALL RISK INTELLIGENCE & TELEMETRY TESTS PASSED SUCCESSFULLY! ✅');
}

runTests();
