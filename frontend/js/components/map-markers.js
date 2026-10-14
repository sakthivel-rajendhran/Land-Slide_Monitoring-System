/**
 * SlopeGuard — Accessible Map Markers Generator (map-markers.js)
 * Produces Leaflet divIcons with distinct geometric shapes and high contrast
 * adhering strictly to the WCAG accessibility rules (never relying on color alone).
 */

window.LW = window.LW || {};

window.LW.mapMarkers = (function() {
  function getMarkerSvg(riskLevel) {
    switch (riskLevel) {
      case "low":
        return `
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <circle cx="16" cy="16" r="12" fill="#8FD694" stroke="#101509" stroke-width="2.5" />
            <circle cx="16" cy="16" r="5" fill="#101509" />
          </svg>`;
      case "moderate":
        return `
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
            <polygon points="16,4 29,27 3,27" fill="#E8D17A" stroke="#101509" stroke-width="2.5" stroke-linejoin="round" />
            <circle cx="16" cy="19" r="3.5" fill="#101509" />
          </svg>`;
      case "high":
        return `
          <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
            <rect x="5" y="5" width="22" height="22" rx="3" fill="#F1A46B" stroke="#101509" stroke-width="2.5" />
            <rect x="11" y="11" width="10" height="10" rx="1" fill="#101509" />
          </svg>`;
      case "critical":
        return `
          <svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true" class="lw-marker-pulse">
            <polygon points="10,2 24,2 32,10 32,24 24,32 10,32 2,24 2,10" fill="#F07878" stroke="#101509" stroke-width="2.5" />
            <line x1="17" y1="9" x2="17" y2="19" stroke="#101509" stroke-width="3.5" stroke-linecap="round" />
            <circle cx="17" cy="24" r="2.5" fill="#101509" />
          </svg>`;
      default: // none / unassessed
        return `
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <circle cx="16" cy="16" r="12" fill="rgba(125,136,119,0.3)" stroke="#7D8877" stroke-width="2.5" stroke-dasharray="4,3" />
            <circle cx="16" cy="16" r="3" fill="#7D8877" />
          </svg>`;
    }
  }

  function getIncidentSvg(type, passability) {
    if (type === "verified_blockage") {
      let color = "#F07878";
      if (passability === "partially blocked") color = "#F1A46B";
      if (passability === "open") color = "#8FD694";

      return `
        <svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true">
          <rect x="3" y="6" width="28" height="22" rx="4" fill="${color}" stroke="#101509" stroke-width="2.5" />
          <line x1="7" y1="11" x2="27" y2="11" stroke="#101509" stroke-width="2.5" stroke-dasharray="3,3" />
          <line x1="7" y1="23" x2="27" y2="23" stroke="#101509" stroke-width="2.5" stroke-dasharray="3,3" />
          <polygon points="12,17 22,17 17,12" fill="#101509" />
        </svg>
      `;
    }

    if (type === "verified_landslide") {
      return `
        <svg viewBox="0 0 34 34" width="34" height="34" aria-hidden="true" class="lw-marker-pulse">
          <polygon points="10,2 24,2 32,10 32,24 24,32 10,32 2,24 2,10" fill="#F07878" stroke="#101509" stroke-width="2.5" />
          <path d="M7 26 L14 12 L20 20 L27 8" stroke="#101509" stroke-width="2.5" stroke-linecap="round" fill="none" />
          <circle cx="23" cy="24" r="3" fill="#101509" />
          <circle cx="16" cy="25" r="2" fill="#101509" />
        </svg>
      `;
    }

    // Default: Citizen-reported unverified observation
    return `
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <polygon points="16,3 30,28 2,28" fill="#E8D17A" stroke="#101509" stroke-width="2.5" stroke-linejoin="round" />
        <line x1="16" y1="11" x2="16" y2="19" stroke="#101509" stroke-width="3" stroke-linecap="round" />
        <circle cx="16" cy="24" r="2" fill="#101509" />
      </svg>
    `;
  }

  return {
    createIcon(region) {
      if (!window.L) return null;
      const risk = (region.risk_level || "none").toLowerCase();
      const svg = getMarkerSvg(risk);

      return L.divIcon({
        className: `lw-map-marker lw-map-marker--${risk}`,
        html: `
          <div class="lw-marker-wrapper" title="${region.name} (${risk.toUpperCase()} RISK)">
            ${svg}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      });
    },

    createIncidentIcon(incident, type = "reported") {
      if (!window.L) return null;
      const pass = (incident.verifiedPassability || incident.roadPassability || "unknown").toLowerCase();
      const svg = getIncidentSvg(type, pass);

      let badgeText = "REPORTED";
      let badgeCls = "badge-reported";
      if (type === "verified_blockage") {
        badgeText = pass === "completely blocked" ? "BLOCKED" : (pass === "partially blocked" ? "PARTIAL" : "OPEN");
        badgeCls = "badge-blockage";
      } else if (type === "verified_landslide") {
        badgeText = "VERIFIED SLIDE";
        badgeCls = "badge-slide";
      }

      return L.divIcon({
        className: `lw-incident-marker lw-incident-marker--${type}`,
        html: `
          <div class="lw-incident-marker-inner" title="${incident.id} - ${incident.incidentType} (${badgeText})">
            ${svg}
            <span class="lw-incident-tag ${badgeCls}">${badgeText}</span>
          </div>
        `,
        iconSize: [38, 46],
        iconAnchor: [19, 23],
        popupAnchor: [0, -22]
      });
    }
  };
})();
