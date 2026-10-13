/**
 * SlopeGuard — Location Details Panel Component (region-panel.js)
 * Slide-out drawer on desktop, bottom sheet on mobile displaying the 5 groups:
 * 1. Basic location, 2. Risk assessment, 3. Environmental, 4. Data quality, 5. Related alerts
 */

window.LW = window.LW || {};

window.LW.regionPanel = (function() {
  let drawerEl = null;
  let backdropEl = null;

  function ensureElements() {
    if (!drawerEl) {
      backdropEl = document.createElement("div");
      backdropEl.className = "lw-drawer-backdrop";
      backdropEl.id = "lw-panel-backdrop";
      document.body.appendChild(backdropEl);

      drawerEl = document.createElement("aside");
      drawerEl.className = "lw-drawer";
      drawerEl.id = "lw-region-panel";
      drawerEl.setAttribute("aria-label", "Monitored Region Details");
      document.body.appendChild(drawerEl);

      backdropEl.addEventListener("click", close);

      // Close on Escape
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawerEl.classList.contains("open")) {
          close();
        }
      });
    }
  }

  function close() {
    if (drawerEl) {
      drawerEl.classList.remove("open");
      backdropEl.classList.remove("active");
    }
  }

  function render(region) {
    ensureElements();
    const format = window.LW.format || {};
    const risk = (region.risk_level || "none").toLowerCase();
    const riskData = window.LW.content?.riskLevels[risk] || window.LW.content?.riskLevels.none;
    const sourceData = window.LW.content?.sourceTypes[region.source_type] || window.LW.content?.sourceTypes.ai_estimate;

    drawerEl.innerHTML = `
      <div class="lw-drawer__header">
        <div>
          <span class="lw-chip lw-chip--${region.data_status || 'current'}" style="margin-bottom: 4px;">
            Telemetry: ${(region.data_status || 'current').toUpperCase()}
          </span>
          <h2 class="lw-drawer__title">${region.name}</h2>
          <span style="font-size: 0.75rem; color: var(--lw-text-muted);">
            ${region.district}, ${region.state || 'Western Ghats'}
          </span>
        </div>
        <button type="button" class="lw-btn lw-btn--ghost" id="lw-drawer-close" aria-label="Close panel" style="font-size: 1.5rem; line-height: 1; padding: 4px 8px;">
          &times;
        </button>
      </div>

      <div class="lw-drawer__body">
        <!-- 1. Risk Assessment Group -->
        <section class="lw-drawer__section">
          <h3 class="lw-drawer__section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
            Risk Assessment
          </h3>
          <div class="lw-card" style="padding: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span class="lw-risk ${riskData.badgeClass}">
                <span class="lw-risk__shape"></span>
                ${riskData.name} Risk
              </span>
              <span class="lw-source ${sourceData.badgeClass}">
                ${sourceData.name}
              </span>
            </div>
            <p style="font-size: 0.8125rem; color: var(--lw-text-secondary); margin: 0 0 8px 0; line-height: 1.4;">
              ${riskData.definition}
            </p>
            <div class="lw-fresh">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Assessed: ${format.dateTimeIST(region.assessed_at)} (${format.relativeTime(region.assessed_at)})</span>
            </div>
            ${region.contributing_factors ? `
              <div style="margin-top: 8px; font-size: 0.75rem; color: var(--lw-text-muted); border-top: 1px solid var(--lw-border); padding-top: 6px;">
                <strong>Key Contributing Indicators:</strong> ${region.contributing_factors}
              </div>
            ` : ""}
          </div>
        </section>

        <!-- 2. Environmental Telemetry Group -->
        <section class="lw-drawer__section">
          <h3 class="lw-drawer__section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
            Environmental Telemetry
          </h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div class="lw-stat">
              <span class="lw-stat__label">Rainfall (1 Hour)</span>
              <span class="lw-stat__value">${format.rainfall(region.latest_rainfall_1h)}</span>
              <span class="lw-stat__freshness">Pluviometer Telemetry</span>
            </div>
            <div class="lw-stat">
              <span class="lw-stat__label">Rainfall (24h Accum)</span>
              <span class="lw-stat__value">${format.rainfall(region.accumulated_rainfall_24h)}</span>
              <span class="lw-stat__freshness">72h: ${format.rainfall(region.accumulated_rainfall_72h)}</span>
            </div>
            <div class="lw-stat">
              <span class="lw-stat__label">Slope Gradient</span>
              <span class="lw-stat__value">${format.slope(region.slope_gradient)}</span>
              <span class="lw-stat__freshness">DEM Contour Study</span>
            </div>
            <div class="lw-stat">
              <span class="lw-stat__label">Pore Pressure</span>
              <span class="lw-stat__value">${region.pore_water_pressure_kpa !== undefined ? region.pore_water_pressure_kpa + ' kPa' : 'N/A'}</span>
              <span class="lw-stat__freshness">Displacement: ${region.ground_displacement_mm !== undefined ? region.ground_displacement_mm + ' mm' : 'N/A'}</span>
            </div>
          </div>
        </section>

        <!-- 3. Basic Location & Data Quality -->
        <section class="lw-drawer__section">
          <h3 class="lw-drawer__section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
            Geographic Coordinates & Data Quality
          </h3>
          <div class="lw-card" style="padding: 12px; font-size: 0.8125rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--lw-text-muted);">Coordinates:</span>
              <span style="font-family: var(--lw-font-mono);">${format.coordinates(region.lat, region.lng)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--lw-text-muted);">Elevation:</span>
              <span style="font-family: var(--lw-font-mono);">${format.elevation(region.elevation)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: var(--lw-text-muted);">Last Sensor Poll:</span>
              <span>${format.dateTimeIST(region.last_observation_time)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--lw-text-muted);">Model Engine:</span>
              <span>${region.model_version || "N/A"}</span>
            </div>
          </div>
        </section>

        <!-- 4. Related Published Alerts -->
        <section class="lw-drawer__section">
          <h3 class="lw-drawer__section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Related Published Alerts
          </h3>
          ${(region.alerts && region.alerts.length > 0) ? region.alerts.map(a => `
            <div class="lw-card" style="padding: 12px; border-left: 3px solid ${a.severity === 'critical' ? 'var(--lw-risk-crit)' : 'var(--lw-risk-high)'}; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                <strong style="font-size: 0.8125rem; color: var(--lw-text);">${a.title}</strong>
                <span class="lw-risk lw-risk--${a.severity}">${a.severity.toUpperCase()}</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--lw-text-secondary); margin: 0 0 6px 0;">${a.description}</p>
              ${a.recommended_actions ? `
                <div style="font-size: 0.6875rem; color: var(--lw-cta); background: rgba(199,244,100,0.06); padding: 4px 6px; border-radius: 4px; margin-bottom: 6px;">
                  <strong>Action:</strong> ${a.recommended_actions}
                </div>
              ` : ""}
              <div class="lw-fresh">
                <span>Published: ${format.dateTimeIST(a.published_at)}</span>
              </div>
            </div>
          `).join("") : `
            <p style="font-size: 0.8125rem; color: var(--lw-text-muted); font-style: italic; margin: 0;">
              No published alerts are available for this location.
            </p>
          `}
        </section>

        <!-- 5. Actions Group -->
        <section class="lw-drawer__section" style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--lw-border);">
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="lw-btn lw-btn--primary" id="lw-action-share">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share Deep Link
            </button>
            <button class="lw-btn lw-btn--outline" id="lw-action-save">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
              Add to My Monitored Areas
            </button>
          </div>
        </section>
      </div>
    `;

    drawerEl.querySelector("#lw-drawer-close").onclick = close;

    // Action: Share Deep Link
    drawerEl.querySelector("#lw-action-share").onclick = () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?region=${region.id}&lat=${region.lat}&lng=${region.lng}&z=13`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          window.LW.ui?.toast("Deep link copied to clipboard!", "success");
        });
      } else {
        window.LW.ui?.toast(`Share URL: ${shareUrl}`, "info");
      }
    };

    // Action: Add to Monitored Areas
    drawerEl.querySelector("#lw-action-save").onclick = () => {
      const user = window.LW.guard?.getUser();
      if (!user) {
        window.LW.ui?.confirm(
          "Sign In Required",
          "You must be signed in to add areas to your personal monitoring feed.",
          () => {
            window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          }
        );
      } else {
        window.LW.ui?.toast(`Region '${region.name}' added to your monitored areas!`, "success");
      }
    };

    drawerEl.classList.add("open");
    backdropEl.classList.add("active");
  }

  return {
    open(region) {
      render(region);
    },
    close
  };
})();
