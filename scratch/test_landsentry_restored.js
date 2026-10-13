const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

console.log('=== VERIFYING RESTORED LANDSENTRY HOMEPAGE ===');

// 1. Navigation order check
const expectedNav = [
  { text: 'Home', href: '#home' },
  { text: 'Overview', href: '#overview' },
  { text: 'Risk Intelligence', href: '#risk-intelligence' },
  { text: 'How It Works', href: '#how-it-works' },
  { text: 'Technology', href: '#technology' },
  { text: 'About', href: '#about' },
  { text: 'Dashboard', href: 'dashboard.html' }
];

const navMatch = indexHtml.match(/<nav class="nav-links"[\s\S]*?<\/nav>/i);
if (!navMatch) {
  console.error('FAIL: <nav class="nav-links"> not found');
} else {
  console.log('PASS: <nav class="nav-links"> found');
  const links = [...navMatch[0].matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  console.log(`Found ${links.length} nav links:`);
  links.forEach((l, idx) => {
    const href = l[1];
    const text = l[2].trim();
    console.log(`  ${idx + 1}. [${text}] -> ${href}`);
    if (idx < expectedNav.length) {
      if (expectedNav[idx].href !== href || expectedNav[idx].text !== text) {
        console.error(`FAIL: Nav link ${idx + 1} mismatch. Expected ${expectedNav[idx].text} (${expectedNav[idx].href}), got ${text} (${href})`);
      }
    }
  });
  if (links.length === expectedNav.length) {
    console.log('PASS: Navigation items match exact required order!');
  } else {
    console.error(`FAIL: Expected ${expectedNav.length} nav items, found ${links.length}`);
  }
}

// 2. Section IDs check
const expectedSections = ['home', 'overview', 'risk-intelligence', 'how-it-works', 'technology', 'about'];
expectedSections.forEach(id => {
  const re = new RegExp(`id=["']${id}["']`, 'i');
  if (re.test(indexHtml)) {
    console.log(`PASS: Section id="${id}" exists in document`);
  } else {
    console.error(`FAIL: Section id="${id}" missing in document!`);
  }
});

// 3. Exact caption check
const caption = "Illustrative risk visualization — sign in to access live map monitoring.";
if (indexHtml.includes(caption)) {
  console.log(`PASS: Exact caption found: "${caption}"`);
} else {
  console.error(`FAIL: Exact caption missing!`);
}

// 4. Static image check
const staticImg = "assets/images/landsentry-risk-map.jpg";
if (indexHtml.includes(staticImg) && fs.existsSync(path.join(rootDir, staticImg))) {
  console.log(`PASS: Static risk map image referenced and exists on disk: ${staticImg}`);
} else {
  console.error(`FAIL: Static risk map image issue: ${staticImg}`);
}

// 5. Leaflet & Tile isolation check on public page
if (indexHtml.includes('leaflet.css') || indexHtml.includes('leaflet.js') || indexHtml.includes('openstreetmap.org')) {
  console.error('FAIL: Leaflet / OpenStreetMap tiles leaked into index.html!');
} else {
  console.log('PASS: index.html is clean: Zero Leaflet, zero external OSM tile calls');
}

// 6. Prohibited contact references check
if (/contact/i.test(indexHtml)) {
  console.error('FAIL: "contact" reference found in index.html');
} else {
  console.log('PASS: Zero contact links or references found in index.html');
}

// 7. Prohibited strip check
if (indexHtml.includes('POWERED BY TRUSTED GEOGRAPHIC')) {
  console.error('FAIL: Prohibited strip "POWERED BY TRUSTED GEOGRAPHIC" found!');
} else {
  console.log('PASS: Prohibited trusted strip is NOT present');
}

// 8. Design system check
if (indexHtml.includes('css/style.css')) {
  console.log('PASS: index.html is linked to core forest-green design system css/style.css');
} else {
  console.error('FAIL: index.html does not link to css/style.css');
}

console.log('=== VERIFICATION COMPLETED ===');
