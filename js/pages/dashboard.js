/**
 * SlopeGuard — Authenticated Dashboard Controller (pages/dashboard.js)
 * Manages route protection, tab routing, API data aggregation, map preview, and report views.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Route Protection — Enforce Authentication
  const user = window.LW.authService?.getCurrentUser();
  if (!user) {
    const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?next=${currentPath}`;
    return;
  }

  // 2. Populate User Information in Shell
  populateUserInfo(user);

  // 3. Mount Notification Bell Widget
  const bellSlot = document.getElementById("dashboardBellSlot");
  if (bellSlot && window.LW.bell) {
    window.LW.bell.mount(bellSlot);
  }

  // 4. State & Caches
  let summaryData = null;
  let allRegions = [];
  let allReports = [];
  let mapPreviewInstance = null;
  let fullMapInstance = null;

  // 5. Initial Data Load
  await loadDashboardData();

  // 6. Setup Tab Routing (?tab=overview|map|reports|locations|profile|settings)
  setupTabRouting();

  // 7. Setup Event Listeners
  setupEventListeners();

  // =========================================================================
  // Core Data Fetching Functions
  // =========================================================================
  async function loadDashboardData() {
    try {
      // Parallel fetch of available APIs
      const [summaryRes, regionsRes, reportsRes, envRes, statusRes] = await Promise.all([
        window.LW.dashboardService?.getSummary().catch(() => null),
        window.LW.regionsService?.getAll().catch(() => []),
        window.LW.reportsService?.getAll().catch(() => []),
        window.LW.environmentalService?.getInsights().catch(() => null),
        window.LW.systemStatusService?.getStatus().catch(() => null)
      ]);

      summaryData = summaryRes;
      allRegions = regionsRes || [];
      allReports = reportsRes || [];

      // Render Dashboard Components
      renderMetricCards(summaryData?.metrics, allRegions);
      renderRiskDistribution(summaryData?.risk_distribution, allRegions);
      renderMapPreview(allRegions);
      renderFullRiskMap(allRegions);
      renderReportsTable(allReports);
      renderLocationsTable(allRegions);
      renderEnvironmentalPanel(envRes);
      renderSystemStatusPanel(statusRes);

      // Update Freshness in Topbar
      updateFreshnessTimestamp(summaryData?.last_update);
    } catch (err) {
      console.error("[Dashboard] Error loading telemetry data", err);
      window.LW.ui?.toast("Error synchronizing telemetry metrics.", "error");
    }
  }

  // =========================================================================
  // Render: 4 Metric Cards
  // =========================================================================
  function renderMetricCards(metrics, regions) {
    const totalLocations = regions.length || metrics?.monitored_locations || 0;
    const criticalCount = regions.filter(r => r.risk_level === "critical").length;
    const highCount = regions.filter(r => r.risk_level === "high").length;
    const highRiskTotal = criticalCount + highCount;
    const liveStations = regions.filter(r => r.data_status === "current").length;
    const livePercent = totalLocations > 0 ? Math.round((liveStations / totalLocations) * 100) : 0;

    // Card 1: Monitored Locations
    document.getElementById("metricLocationsValue").textContent = totalLocations;
    document.getElementById("metricLocationsFootnote").textContent = "Across 7 NER States";

    // Card 2: High & Critical Risk Locations
    document.getElementById("metricHighRiskValue").textContent = highRiskTotal;
    document.getElementById("metricHighRiskFootnote").innerHTML = `
      <span style="color: var(--color-risk-severe);">${criticalCount} Critical</span> &bull; ${highCount} High
    `;

    // Card 3: Environmental Data Live Freshness
    document.getElementById("metricEnvValue").textContent = `${liveStations}/${totalLocations}`;
    document.getElementById("metricEnvFootnote").textContent = `${livePercent}% Telemetry Online`;

    // Card 4: Recent Reports
    document.getElementById("metricReportsValue").textContent = allReports.length || metrics?.recent_reports_count || 0;
    document.getElementById("metricReportsFootnote").textContent = "Published in past 72 hrs";
  }

  // =========================================================================
  // Render: Risk Distribution Horizontal Bar Chart
  // =========================================================================
  function renderRiskDistribution(dist, regions) {
    const total = regions.length || 1;
    const counts = {
      critical: regions.filter(r => r.risk_level === "critical").length,
      high: regions.filter(r => r.risk_level === "high").length,
      moderate: regions.filter(r => r.risk_level === "moderate").length,
      low: regions.filter(r => r.risk_level === "low").length,
      unassessed: regions.filter(r => !r.risk_level || r.risk_level === "none").length
    };

    // Consistent horizontal axis scale (0% to 40% maximum domain)
    const maxPct = Math.max(...Object.values(counts).map(c => Math.round((c / total) * 100)));
    const scaleMax = Math.max(40, Math.ceil(maxPct / 10) * 10);

    updateBar("critical", counts.critical, total);
    updateBar("high", counts.high, total);
    updateBar("moderate", counts.moderate, total);
    updateBar("low", counts.low, total);
    updateBar("unassessed", counts.unassessed, total);

    function updateBar(key, count, totalCount) {
      const pct = Math.round((count / totalCount) * 100);
      const countEl = document.getElementById(`riskDistCount_${key}`);
      const fillEl = document.getElementById(`riskDistFill_${key}`);
      if (countEl) countEl.textContent = `${count} (${pct}%)`;
      if (fillEl) {
        const barWidth = Math.min(100, Math.round((pct / scaleMax) * 1000) / 10);
        fillEl.style.width = `${barWidth}%`;
        fillEl.setAttribute("aria-valuenow", count);
        fillEl.setAttribute("aria-valuetext", `${count} sectors (${pct}%)`);
      }
    }
  }

  // =========================================================================
  // Render: Interactive Risk Map Preview
  // =========================================================================
  function renderMapPreview(regions) {
    const mapEl = document.getElementById("dashboardMapPreview");
    if (!mapEl || !window.LW.RiskMap) return;

    if (mapPreviewInstance) {
      mapPreviewInstance.destroy();
    }

    mapPreviewInstance = window.LW.RiskMap.mount(mapEl, {
      mode: "preview",
      regions: regions,
      onSelect(region) {
        window.LW.regionPanel?.open(region);
      }
    });

    // Invalidate Leaflet size after initial paint
    setTimeout(() => {
      mapPreviewInstance?.getMapInstance()?.invalidateSize();
    }, 150);

    // Watch container size changes (window resize, sidebar toggle)
    if (window.ResizeObserver && !mapEl.__resizeObserverAttached) {
      const ro = new ResizeObserver(() => {
        if (mapPreviewInstance?.getMapInstance()) {
          mapPreviewInstance.getMapInstance().invalidateSize();
        }
      });
      ro.observe(mapEl);
      mapEl.__resizeObserverAttached = true;
    }
  }

  // =========================================================================
  // Render: Full Geographic Risk Map (Tab 2 Native View)
  // =========================================================================
  function renderFullRiskMap(regions) {
    const fullMapEl = document.getElementById("dashboardFullRiskMapCanvas");
    if (!fullMapEl || !window.LW.RiskMap) return;

    if (fullMapInstance) {
      fullMapInstance.destroy();
    }

    fullMapInstance = window.LW.RiskMap.mount(fullMapEl, {
      mode: "full",
      regions: regions,
      onSelect(region) {
        window.LW.regionPanel?.open(region);
      }
    });

    // Invalidate Leaflet size after initial paint
    setTimeout(() => {
      fullMapInstance?.getMapInstance()?.invalidateSize();
    }, 150);

    // Watch container size changes
    if (window.ResizeObserver && !fullMapEl.__resizeObserverAttached) {
      const ro = new ResizeObserver(() => {
        if (fullMapInstance?.getMapInstance()) {
          fullMapInstance.getMapInstance().invalidateSize();
        }
      });
      ro.observe(fullMapEl);
      fullMapEl.__resizeObserverAttached = true;
    }
  }

  // =========================================================================
  // Render: Recent Reports Table
  // =========================================================================
  function renderReportsTable(reports) {
    const tbody = document.getElementById("dashboardReportsTableBody");
    if (!tbody) return;
    const format = window.LW.format || {};

    if (!reports || reports.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--color-text-muted);">
            No monitoring reports published for this time window.
          </td>
        </tr>
      `;
      return;
    }

    const html = reports.map(r => `
      <tr>
        <td>
          <strong style="color: var(--color-text-primary);">${r.title}</strong>
        </td>
        <td>
          <span>${r.area}</span><br/>
          <span style="font-size: 0.7rem; color: var(--color-text-muted);">${r.district}, ${r.state}</span>
        </td>
        <td>
          <span class="lw-source lw-source--reviewed" style="font-size: 0.6875rem;">
            ${r.category}
          </span>
        </td>
        <td>
          <span class="lw-risk lw-risk--${r.severity}">
            <span class="lw-risk__shape"></span>
            ${r.severity.toUpperCase()}
          </span>
        </td>
        <td style="font-family: var(--lw-font-mono); font-size: 0.75rem;">
          ${format.relativeTime(r.created_at)}
        </td>
        <td>
          <button type="button" class="lw-btn lw-btn--sm lw-btn--outline" data-action="view-report" data-id="${r.id}">
            View Report
          </button>
        </td>
      </tr>
    `).join("");

    tbody.innerHTML = reports.slice(0, 5).map(r => `
      <tr>
        <td>
          <strong style="color: var(--color-text-primary);">${r.title}</strong>
        </td>
        <td>
          <span>${r.area}</span><br/>
          <span style="font-size: 0.7rem; color: var(--color-text-muted);">${r.district}, ${r.state}</span>
        </td>
        <td>
          <span class="lw-source lw-source--reviewed" style="font-size: 0.6875rem;">
            ${r.category}
          </span>
        </td>
        <td>
          <span class="lw-risk lw-risk--${r.severity}">
            <span class="lw-risk__shape"></span>
            ${r.severity.toUpperCase()}
          </span>
        </td>
        <td style="font-family: var(--lw-font-mono); font-size: 0.75rem;">
          ${format.relativeTime(r.created_at)}
        </td>
        <td>
          <button type="button" class="lw-btn lw-btn--sm lw-btn--outline" data-action="view-report" data-id="${r.id}">
            View Report
          </button>
        </td>
      </tr>
    `).join("");

    const fullReportsTbody = document.getElementById("fullReportsTableBody");
    if (fullReportsTbody) fullReportsTbody.innerHTML = html;

    document.querySelectorAll('[data-action="view-report"]').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.id, 10);
        const report = allReports.find(x => x.id === id);
        if (report) openReportModal(report);
      };
    });
  }

  // =========================================================================
  // Render: Monitored Locations Table
  // =========================================================================
  function renderLocationsTable(regions) {
    const tbody = document.getElementById("dashboardLocationsTableBody");
    const fullTbody = document.getElementById("fullLocationsTableBody");
    const format = window.LW.format || {};

    const html = regions.map(r => `
      <tr>
        <td>
          <strong style="color: var(--color-text-primary);">${r.name}</strong>
        </td>
        <td>${r.district}, ${r.state}</td>
        <td>
          <span class="lw-risk lw-risk--${r.risk_level || 'none'}">
            <span class="lw-risk__shape"></span>
            ${(r.risk_level || 'NOT ASSESSED').toUpperCase()}
          </span>
        </td>
        <td style="font-family: var(--lw-font-mono);">${format.slope(r.slope_gradient)}</td>
        <td style="font-family: var(--lw-font-mono);">${format.rainfall(r.accumulated_rainfall_24h)}</td>
        <td>
          <span class="lw-chip lw-chip--${r.data_status || 'current'}">
            ${(r.data_status || 'current').toUpperCase()}
          </span>
        </td>
        <td>
          <button type="button" class="lw-btn lw-btn--sm lw-btn--ghost" data-action="locate-region" data-id="${r.id}" style="color: var(--color-primary);">
            View on Map &rarr;
          </button>
        </td>
      </tr>
    `).join("");

    if (tbody) tbody.innerHTML = html;
    if (fullTbody) fullTbody.innerHTML = html;

    document.querySelectorAll('[data-action="locate-region"]').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.id, 10);
        window.location.href = `map.html?region=${id}`;
      };
    });
  }

  // =========================================================================
  // Render: Environmental Telemetry Panel
  // =========================================================================
  function renderEnvironmentalPanel(envData) {
    if (!envData) return;
    const container = document.getElementById("dashboardEnvContent");
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
        <div class="lw-stat">
          <span class="lw-stat__label">Peak 24h Rainfall</span>
          <span class="lw-stat__value">${envData.highest_precipitation_station?.accumulated_rainfall_24h || 312} mm</span>
          <span class="lw-stat__freshness">${envData.highest_precipitation_station?.name || 'Sohra Escarpment'}</span>
        </div>
        <div class="lw-stat">
          <span class="lw-stat__label">Pore Saturation</span>
          <span class="lw-stat__value">${envData.highest_pore_pressure_station?.pore_pressure || '61.4 kPa'}</span>
          <span class="lw-stat__freshness">Displacement: ${envData.highest_pore_pressure_station?.displacement || '16.2 mm'}</span>
        </div>
      </div>
      <div style="font-size: 0.8125rem; color: var(--color-text-secondary); display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-glass-border); padding-bottom: 6px;">
          <span style="color: var(--color-text-muted);">Doppler Weather Radar:</span>
          <span style="color: var(--color-text-primary); font-weight: 600;">${envData.radar_status || 'OPERATIONAL'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-glass-border); padding-bottom: 6px;">
          <span style="color: var(--color-text-muted);">Satellite Radar Track:</span>
          <span>${envData.insar_satellite_pass || 'Sentinel-1 InSAR active'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--color-text-muted);">Monsoon Synopsis:</span>
          <span style="font-size: 0.75rem; color: var(--color-primary);">${envData.monsoon_status || 'Active trough over NER'}</span>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // Render: System Status & Data Quality Panel
  // =========================================================================
  function renderSystemStatusPanel(statusData) {
    const list = document.getElementById("dashboardSystemStatusList");
    if (!list || !statusData) return;

    list.innerHTML = (statusData.services || []).map(s => `
      <div class="system-status-item">
        <div>
          <strong style="color: var(--color-text-primary); font-size: 0.8125rem;">${s.name}</strong><br/>
          <span style="font-size: 0.6875rem; color: var(--color-text-muted);">
            ${s.version || s.provider || s.source || 'Operational'}
          </span>
        </div>
        <span class="system-status-badge">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-primary);"></span>
          ${s.status}
        </span>
      </div>
    `).join("");
  }

  // =========================================================================
  // Report Details Modal
  // =========================================================================
  function openReportModal(report) {
    const format = window.LW.format || {};
    window.LW.ui?.confirm(
      report.title,
      `
        <div style="font-size: 0.8125rem; color: var(--color-text-secondary, #4A5D48); text-align: left; display: flex; flex-direction: column; gap: 8px;">
          <div><strong style="color: var(--color-text-primary, #2E3A2F);">Area:</strong> ${report.area} (${report.district}, ${report.state})</div>
          <div><strong style="color: var(--color-text-primary, #2E3A2F);">Investigating Body:</strong> ${report.author}</div>
          <div><strong style="color: var(--color-text-primary, #2E3A2F);">Classification:</strong> ${report.category} &bull; <span style="text-transform: uppercase; color: var(--color-primary); font-weight: 700;">${report.severity}</span></div>
          <div><strong style="color: var(--color-text-primary, #2E3A2F);">Published:</strong> ${format.dateTimeIST(report.created_at)}</div>
          <div style="background: var(--lw-bg, #F8F6EE); padding: 12px; border-radius: 4px; border: 1px solid var(--lw-border, #D9C9B2); color: var(--color-text-primary, #2E3A2F); line-height: 1.5; margin-top: 6px;">
            ${report.summary}
          </div>
        </div>
      `,
      () => {
        window.LW.ui?.toast(`Report '${report.title}' marked for officer dispatch.`, "success");
      }
    );
  }

  // =========================================================================
  // Tab Routing & Navigation
  // =========================================================================
  function setupTabRouting() {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get("tab") || "overview";
    switchTab(initialTab, false);

    // Ensure initial page load starts cleanly at top unless specific hash targeted
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    } else {
      setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        if (target) {
          if (window.LW?.ui?.scrollToElement) {
            window.LW.ui.scrollToElement(target, true);
          } else {
            const heading = target.querySelector('.panel-title, .card-title, h1, h2, h3') || target;
            const topbar = document.querySelector(".dashboard-topbar");
            const navBottom = topbar ? Math.round(topbar.getBoundingClientRect().bottom) : 68;
            const y = heading.getBoundingClientRect().top + window.pageYOffset - navBottom - 12;
            window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: "smooth" });
          }
        }
      }, 150);
    }

    // Sidebar & Internal Tab Navigation Click Handlers
    document.querySelectorAll("[data-nav-tab]").forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        const tab = item.dataset.navTab;
        switchTab(tab, true);
      };
    });

    window.addEventListener("popstate", (e) => {
      const stateTab = e.state?.tab || new URLSearchParams(window.location.search).get("tab") || "overview";
      switchTab(stateTab, false);
    });
  }

  function switchTab(tabId, pushHistory = true) {
    // Hide all tab views
    document.querySelectorAll(".dashboard-tab-view").forEach(view => {
      view.classList.remove("active");
    });

    // Update Sidebar Active Class
    document.querySelectorAll("[data-nav-tab]").forEach(item => {
      if (item.dataset.navTab === tabId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Show Selected Tab View
    const targetView = document.getElementById(`tabView_${tabId}`);
    if (targetView) {
      targetView.classList.add("active");
    } else {
      document.getElementById("tabView_overview")?.classList.add("active");
      tabId = "overview";
    }

    // Update Breadcrumbs
    const breadcrumbCurrent = document.getElementById("topbarBreadcrumbCurrent");
    if (breadcrumbCurrent) {
      const tabNames = {
        overview: "Dashboard",
        map: "Risk Map Monitoring",
        reports: "Reports",
        locations: "Monitored Locations",
        profile: "Officer Profile",
        settings: "Settings & Alerts"
      };
      breadcrumbCurrent.textContent = tabNames[tabId] || "Dashboard";
    }

    // If Map Tab activated, trigger Leaflet size invalidation
    if (tabId === "map") {
      setTimeout(() => {
        fullMapInstance?.getMapInstance()?.invalidateSize();
      }, 100);
    } else if (tabId === "overview") {
      setTimeout(() => {
        mapPreviewInstance?.getMapInstance()?.invalidateSize();
      }, 100);
    }

    // Update URL query parameter
    if (pushHistory) {
      const newUrl = tabId === "overview" ? window.location.pathname : `${window.location.pathname}?tab=${tabId}`;
      window.history.pushState({ tab: tabId }, "", newUrl);

      // Scroll to top of visible content area when tab is switched
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? "auto" : "smooth"
      });
    }

    // Close mobile drawer if open
    document.getElementById("dashboardSidebar")?.classList.remove("mobile-open");
  }

  // =========================================================================
  // User Profile & Shell Info
  // =========================================================================
  function populateUserInfo(currentUser) {
    const avatar = document.getElementById("sidebarUserAvatar");
    const nameEl = document.getElementById("sidebarUserName");
    const roleEl = document.getElementById("sidebarUserRole");

    const initial = (currentUser.name || currentUser.username || "O").charAt(0).toUpperCase();
    if (avatar) avatar.textContent = initial;
    if (nameEl) nameEl.textContent = currentUser.name || currentUser.username;
    if (roleEl) roleEl.textContent = `${currentUser.role || 'OFFICER'} &bull; ${currentUser.jurisdiction || 'NER'}`;

    // Profile Tab Fields
    const pName = document.getElementById("profileName");
    const pEmail = document.getElementById("profileEmail");
    const pRole = document.getElementById("profileRole");
    const pDistrict = document.getElementById("profileDistrict");

    if (pName) pName.textContent = currentUser.name || "Field Officer";
    if (pEmail) pEmail.textContent = currentUser.email || currentUser.username;
    if (pRole) pRole.textContent = currentUser.role || "OFFICER";
    if (pDistrict) pDistrict.textContent = currentUser.district || "NER Command";
  }

  function updateFreshnessTimestamp(lastUpdateIso) {
    const freshnessEl = document.getElementById("topbarFreshnessTime");
    if (!freshnessEl) return;
    const format = window.LW.format || {};
    freshnessEl.textContent = lastUpdateIso ? format.relativeTime(lastUpdateIso) : "Live Telemetry";
  }

  // =========================================================================
  // Event Listeners & Global Search
  // =========================================================================
  function setupEventListeners() {
    // Topbar Search Handler
    const searchInput = document.getElementById("topbarSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterDashboardData(query);
      });
    }

    // Mobile Sidebar Toggle
    const mobileToggle = document.getElementById("topbarMobileToggle");
    const sidebar = document.getElementById("dashboardSidebar");
    if (mobileToggle && sidebar) {
      mobileToggle.onclick = () => {
        sidebar.classList.toggle("mobile-open");
      };
    }

    // Logout Buttons
    const logoutBtns = document.querySelectorAll("[data-action='logout']");
    logoutBtns.forEach(btn => {
      btn.onclick = async () => {
        await window.LW.authService?.logout();
        window.location.replace("login.html");
      };
    });

    // Web Push Enable Button in Settings Tab
    const enablePushBtn = document.getElementById("btnSettingsPush");
    if (enablePushBtn) {
      enablePushBtn.onclick = async () => {
        await window.LW.push?.enable();
      };
    }
  }

  function filterDashboardData(query) {
    if (!query) {
      renderReportsTable(allReports);
      renderLocationsTable(allRegions);
      return;
    }

    const filteredReports = allReports.filter(r =>
      r.title.toLowerCase().includes(query) ||
      r.area.toLowerCase().includes(query) ||
      r.district.toLowerCase().includes(query)
    );
    renderReportsTable(filteredReports);

    const filteredRegions = allRegions.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.district.toLowerCase().includes(query) ||
      r.state.toLowerCase().includes(query)
    );
    renderLocationsTable(filteredRegions);
  }
});
