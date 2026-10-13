/**
 * SlopeGuard — Interactive Risk Map Component (risk-map.js)
 * Implements the frozen contract:
 * LW.RiskMap.mount(el, { mode: "preview" | "full", regions, incidents, onSelect, onSelectIncident })
 *       -> { focus(regionId), focusIncident(incidentId), setFilters(...), setIncidents(...), destroy(), getMapInstance() }
 *
 * 5 Identifiable GIS Layers:
 * 1. Landslide Susceptibility Zones (Regional high & critical buffer envelopes)
 * 2. Current Risk Assessments (Monitored sensor stations)
 * 3. Citizen-Reported Incidents (Unverified citizen hazard submissions)
 * 4. Verified Landslide Incidents (Geotechnically confirmed landslides)
 * 5. Verified Road Blockages (Confirmed impassable or single-lane highway blockages)
 */

window.LW = window.LW || {};

window.LW.RiskMap = {
  mount(el, options = {}) {
    if (!el) {
      console.error("[LW.RiskMap] Target container element is missing.");
      return null;
    }

    if (!window.L) {
      console.error("[LW.RiskMap] Leaflet 1.9.4 is not loaded.");
      if (window.LW.ui) {
        window.LW.ui.state.render(el, "error", {
          message: window.LW.content?.mapLoadFailed || "Leaflet map engine failed to load."
        });
      }
      return null;
    }

    const mode = options.mode || "full";
    let regions = options.regions || [];
    let incidents = options.incidents || [];
    const onSelect = options.onSelect || (() => {});
    const onSelectIncident = options.onSelectIncident || (() => {});

    const config = window.LW.config || {
      defaultCenter: [25.7500, 92.8000],
      defaultZoom: 7,
      tileProvider: {
        url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
      }
    };

    // Initialize Leaflet Map instance
    const map = L.map(el, {
      zoomControl: mode === "full",
      attributionControl: true,
      scrollWheelZoom: mode === "full"
    }).setView(config.defaultCenter, config.defaultZoom);

    // Add Base Tile Layer with tile error indicator
    const tileLayer = L.tileLayer(config.tileProvider.url, {
      maxZoom: config.tileProvider.maxZoom,
      attribution: config.tileProvider.attribution
    }).addTo(map);

    tileLayer.on("tileerror", function() {
      if (!navigator.onLine) {
        let mapNotice = el.querySelector(".map-offline-notice");
        if (!mapNotice) {
          mapNotice = document.createElement("div");
          mapNotice.className = "map-offline-notice";
          mapNotice.style.cssText = "position: absolute; bottom: 12px; left: 12px; z-index: 600; background: rgba(14, 23, 17, 0.9); border: 1px solid rgba(232, 209, 122, 0.4); color: #E8D17A; padding: 6px 12px; border-radius: 4px; font-size: 0.75rem; pointer-events: none;";
          mapNotice.textContent = "Offline: Showing cached hazard points. Some base map tiles may be unavailable.";
          el.appendChild(mapNotice);
        }
      }
    });

    // 5 Separate Identifiable GIS Layer Groups
    const susceptibilityLayer = L.layerGroup().addTo(map);
    const assessmentsLayer = L.layerGroup().addTo(map);
    const reportedIncidentsLayer = L.layerGroup().addTo(map);
    const citizenIncidentsLayer = reportedIncidentsLayer; // alias for reported citizen incidents
    const verifiedLandslidesLayer = L.layerGroup().addTo(map);
    const verifiedBlockagesLayer = L.layerGroup().addTo(map);

    const markerMap = new Map(); // regionId -> L.Marker
    const incidentMarkerMap = new Map(); // incidentId -> L.Marker

    // Layer Visibility State
    const activeLayers = {
      susceptibility: true,
      assessments: true,
      reported: true,
      verifiedLandslides: true,
      verifiedBlockages: true
    };

    let currentFilters = {
      risk: "all",
      dataStatus: "all",
      incidentCategory: "all",
      verificationStatus: "all",
      passability: "all"
    };

    // 1. Render Susceptibility Buffers
    function renderSusceptibility() {
      susceptibilityLayer.clearLayers();
      if (!activeLayers.susceptibility) return;

      regions.forEach(r => {
        if (!r.lat || !r.lng) return;
        if (r.risk_level === "critical" || r.risk_level === "high") {
          const color = r.risk_level === "critical" ? "#F07878" : "#F1A46B";
          const radiusMeters = r.risk_level === "critical" ? 18000 : 12000;

          const circle = L.circle([r.lat, r.lng], {
            radius: radiusMeters,
            color: color,
            weight: 1.5,
            opacity: 0.7,
            fillColor: color,
            fillOpacity: 0.12,
            dashArray: "4, 6"
          });

          circle.bindTooltip(`
            <div style="font-family: var(--lw-font-sans); font-size: 11px;">
              <strong>Susceptibility Buffer: ${r.name}</strong><br/>
              <span>Threshold: ${r.risk_level.toUpperCase()} Vulnerability Envelope</span>
            </div>
          `, { direction: "center" });

          circle.addTo(susceptibilityLayer);
        }
      });
    }

    // 2. Render Monitored Sensor Stations
    function renderSensorAssessments() {
      assessmentsLayer.clearLayers();
      markerMap.clear();
      if (!activeLayers.assessments) return;

      const filtered = regions.filter(region => {
        if (currentFilters.risk !== "all" && region.risk_level !== currentFilters.risk) {
          return false;
        }
        if (currentFilters.dataStatus !== "all" && region.data_status !== currentFilters.dataStatus) {
          return false;
        }
        return true;
      });

      filtered.forEach(region => {
        if (!region.lat || !region.lng) return;

        const icon = window.LW.mapMarkers?.createIcon(region);
        const marker = L.marker([region.lat, region.lng], { icon });

        const riskLabel = (region.risk_level || "Not Assessed").toUpperCase();
        marker.bindTooltip(`
          <div style="font-family: var(--lw-font-sans); font-size: 12px; padding: 2px;">
            <strong>${region.name}</strong><br/>
            <span>Risk Assessment: ${riskLabel}</span><br/>
            <span style="color: #A3B3A0;">${region.district}, ${region.state}</span>
          </div>
        `, { direction: "top", offset: [0, -18] });

        marker.on("click", () => {
          onSelect(region);
          document.dispatchEvent(new CustomEvent("lw:region-selected", { detail: { id: region.id } }));
        });

        marker.addTo(assessmentsLayer);
        markerMap.set(region.id, marker);
      });
    }

    // 3. Render Incidents (Reported, Verified Landslide, Verified Blockage)
    function renderIncidentMarkers() {
      reportedIncidentsLayer.clearLayers();
      verifiedLandslidesLayer.clearLayers();
      verifiedBlockagesLayer.clearLayers();
      incidentMarkerMap.clear();

      incidents.forEach(incident => {
        const loc = incident.location || {};
        if (!loc.latitude || !loc.longitude) return;

        // Apply filters
        if (currentFilters.incidentCategory !== "all" && incident.incidentType !== currentFilters.incidentCategory && incident.category !== currentFilters.incidentCategory) {
          return;
        }
        if (currentFilters.verificationStatus !== "all") {
          if (currentFilters.verificationStatus === "verified" && !incident.isVerified) return;
          if (currentFilters.verificationStatus === "unverified" && incident.isVerified) return;
        }
        if (currentFilters.passability !== "all") {
          const pass = (incident.verifiedPassability || incident.roadPassability || "").toLowerCase();
          if (pass !== currentFilters.passability.toLowerCase()) return;
        }

        // Determine Layer & Icon Type
        const isVerified = Boolean(incident.isVerified);
        const hasBlockage = incident.roadPassability === "completely blocked" || incident.roadPassability === "partially blocked" || incident.verifiedPassability === "completely blocked" || incident.verifiedPassability === "partially blocked";
        const isLandslide = incident.incidentType?.toLowerCase().includes("landslide") || incident.incidentType?.toLowerCase().includes("debris") || incident.incidentType?.toLowerCase().includes("movement");

        let targetLayer = null;
        let iconType = "reported";

        if (isVerified && hasBlockage) {
          targetLayer = verifiedBlockagesLayer;
          iconType = "verified_blockage";
          if (!activeLayers.verifiedBlockages) return;
        } else if (isVerified && isLandslide) {
          targetLayer = verifiedLandslidesLayer;
          iconType = "verified_landslide";
          if (!activeLayers.verifiedLandslides) return;
        } else {
          targetLayer = reportedIncidentsLayer;
          iconType = "reported";
          if (!activeLayers.reported) return;
        }

        const icon = window.LW.mapMarkers?.createIncidentIcon ? 
          window.LW.mapMarkers.createIncidentIcon(incident, iconType) : 
          window.LW.mapMarkers?.createIcon({ risk_level: "critical" });

        const marker = L.marker([loc.latitude, loc.longitude], { icon });

        // Rich Accessible Popup
        const statusBadge = isVerified ? 
          `<span style="background: rgba(77, 120, 78, 0.15); color: #2E5A30; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 700;">VERIFIED HAZARD</span>` : 
          `<span style="background: rgba(196, 136, 41, 0.15); color: #8C5B12; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 700;">PENDING VERIFICATION</span>`;

        const passBadge = incident.roadPassability === "completely blocked" ? 
          `<span style="color: #8F2618; font-weight: 700;">Completely Blocked</span>` : 
          (incident.roadPassability === "partially blocked" ? `<span style="color: #9E492B; font-weight: 700;">Partially Blocked</span>` : `<span style="color: #2E5A30; font-weight: 700;">Open</span>`);

        const photosCount = incident.photos ? incident.photos.length : 0;
        const photoThumb = incident.photos && incident.photos[0] ? `
          <div style="margin-top: 8px; border-radius: 4px; overflow: hidden; border: 1px solid #D9C9B2;">
            <img src="${incident.photos[0].url}" alt="Evidence" style="width: 100%; height: 110px; object-fit: cover; display: block;" onerror="this.style.display='none'" />
          </div>
        ` : '';

        const popupContent = `
          <div class="lw-incident-popup" style="font-family: var(--lw-font-sans, system-ui); min-width: 240px; max-width: 300px; color: #2E3A2F;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-family: monospace; font-size: 11px; color: #C96F4F; font-weight: 700;">${incident.id}</span>
              ${statusBadge}
            </div>
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #2E3A2F; line-height: 1.3;">
              ${incident.incidentType}
            </h4>
            <div style="font-size: 11px; color: #4A5D48; margin-bottom: 6px;">
              📍 ${loc.roadName ? `<strong>${loc.roadName}</strong> &bull; ` : ''}${loc.placeName || 'Regional Slopes'}
            </div>
            <div style="font-size: 11px; margin-bottom: 4px; color: #4A5D48;">
              <strong style="color: #2E3A2F;">Verification Status:</strong> ${isVerified ? 'Verified Incident' : 'Reported Incident (Pending Geotechnical Review)'}
            </div>
            <div style="font-size: 11px; line-height: 1.4; color: #2E3A2F; margin-bottom: 6px; max-height: 60px; overflow: hidden; text-overflow: ellipsis;">
              ${incident.description}
            </div>
            <div style="font-size: 11px; border-top: 1px solid #D9C9B2; padding-top: 6px; display: flex; justify-content: space-between; color: #2E3A2F;">
              <span>Road: ${passBadge}</span>
              <span style="color: #5E6F5C;">📷 ${photosCount} photo(s)</span>
            </div>
            ${incident.reviewReason ? `
              <div style="margin-top: 6px; font-size: 11px; color: #2E3A2F; background: var(--lw-bg, #F8F6EE); border: 1px solid #D9C9B2; padding: 4px 6px; border-radius: 3px;">
                <strong style="color: #8C5B12;">Admin Update:</strong> ${incident.reviewReason}
              </div>
            ` : ''}
            ${photoThumb}
            <div style="margin-top: 8px; font-size: 10px; color: #5E6F5C; text-align: right;">
              Observed: ${new Date(incident.observedAt).toLocaleString()}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 320 });

        marker.on("click", () => {
          onSelectIncident(incident);
          document.dispatchEvent(new CustomEvent("lw:incident-selected", { detail: { id: incident.id, incident } }));
        });

        marker.addTo(targetLayer);
        incidentMarkerMap.set(incident.id, marker);
      });
    }

    function renderAll() {
      renderSusceptibility();
      renderSensorAssessments();
      renderIncidentMarkers();
    }

    renderAll();

    // 4. Mount Custom Floating Layer Control UI on Map (if in full mode)
    if (mode === "full") {
      let layerControlBox = el.querySelector(".lw-map-layers-control");
      if (!layerControlBox) {
        layerControlBox = document.createElement("div");
        layerControlBox.className = "lw-map-layers-control";
        layerControlBox.style.cssText = `
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 500;
          background: rgba(14, 23, 17, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(215, 245, 160, 0.2);
          border-radius: 6px;
          padding: 10px 14px;
          color: #F8FAFC;
          font-family: inherit;
          font-size: 0.75rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          max-width: 250px;
        `;
        layerControlBox.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid rgba(217, 201, 178, 0.25); padding-bottom: 6px;">
            <strong style="color: #F8F6EE; letter-spacing: 0.05em; text-transform: uppercase; font-size: 0.725rem; font-weight: 800;">GIS Map Layers</strong>
            <span style="font-size: 0.6875rem; color: #D9C9B2; font-weight: 600;">5 Active</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px; color: #F8F6EE;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="layerToggle_susceptibility" checked style="accent-color: #C96F4F;">
              <span>Landslide Susceptibility Zones</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="layerToggle_assessments" checked style="accent-color: #C96F4F;">
              <span>Monitored Sensor Stations</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="layerToggle_reported" checked style="accent-color: #C48829;">
              <span>Citizen Reports (Unverified)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="layerToggle_verifiedLandslides" checked style="accent-color: #B84333;">
              <span>Verified Landslide Incidents</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="checkbox" id="layerToggle_verifiedBlockages" checked style="accent-color: #C96F4F;">
              <span>Verified Road Blockages</span>
            </label>
          </div>
        `;
        el.appendChild(layerControlBox);

        // Bind Checkbox Events
        layerControlBox.querySelector("#layerToggle_susceptibility").onchange = (e) => {
          activeLayers.susceptibility = e.target.checked;
          renderSusceptibility();
        };
        layerControlBox.querySelector("#layerToggle_assessments").onchange = (e) => {
          activeLayers.assessments = e.target.checked;
          renderSensorAssessments();
        };
        layerControlBox.querySelector("#layerToggle_reported").onchange = (e) => {
          activeLayers.reported = e.target.checked;
          renderIncidentMarkers();
        };
        layerControlBox.querySelector("#layerToggle_verifiedLandslides").onchange = (e) => {
          activeLayers.verifiedLandslides = e.target.checked;
          renderIncidentMarkers();
        };
        layerControlBox.querySelector("#layerToggle_verifiedBlockages").onchange = (e) => {
          activeLayers.verifiedBlockages = e.target.checked;
          renderIncidentMarkers();
        };
      }
    }

    // In preview mode with coordinates, fit bounds
    const allCoords = [
      ...regions.filter(r => r.lat && r.lng).map(r => [r.lat, r.lng]),
      ...incidents.filter(i => i.location?.latitude && i.location?.longitude).map(i => [i.location.latitude, i.location.longitude])
    ];
    if (allCoords.length > 0) {
      const bounds = L.latLngBounds(allCoords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 11 });
      }
    }

    return {
      focus(regionId) {
        const marker = markerMap.get(regionId);
        if (marker) {
          map.setView(marker.getLatLng(), 13, { animate: true });
          marker.openTooltip();
          const region = regions.find(r => r.id === regionId);
          if (region) onSelect(region);
        }
      },

      focusIncident(incidentId) {
        const marker = incidentMarkerMap.get(incidentId);
        if (marker) {
          map.setView(marker.getLatLng(), 14, { animate: true });
          marker.openPopup();
          const inc = incidents.find(i => i.id === incidentId);
          if (inc) onSelectIncident(inc);
        }
      },

      setFilters(filters = {}) {
        currentFilters = { ...currentFilters, ...filters };
        renderAll();
      },

      setRegions(newRegions) {
        regions = newRegions || [];
        renderAll();
      },

      setIncidents(newIncidents) {
        incidents = newIncidents || [];
        renderIncidentMarkers();
      },

      destroy() {
        map.remove();
      },

      getMapInstance() {
        return map;
      }
    };
  }
};
