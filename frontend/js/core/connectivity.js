/**
 * SlopeGuard — Connectivity & Network State Machine (connectivity.js)
 * Tracks connection health: online, offline, syncing, sync_failed, data_outdated
 * Emits document event 'lw:connectivity'
 */

window.LW = window.LW || {};

window.LW.connectivity = (function() {
  let currentState = navigator.onLine ? "online" : "offline";
  let lastSyncAt = null;

  async function init() {
    // Restore last sync time from metadata store if available
    try {
      if (window.LW.store) {
        const meta = await window.LW.store.get("meta", "last_sync_at");
        if (meta && meta.value) {
          lastSyncAt = meta.value;
        }
      }
    } catch (e) {
      // Ignore initial storage read error
    }

    window.addEventListener("online", () => {
      setState("online");
      if (window.LW.sync && typeof window.LW.sync.trigger === "function") {
        window.LW.sync.trigger();
      }
    });

    window.addEventListener("offline", () => {
      setState("offline");
    });
  }

  function setState(state, meta = {}) {
    currentState = state;
    if (state === "sync_complete") {
      lastSyncAt = new Date().toISOString();
      if (window.LW.store) {
        window.LW.store.put("meta", { name: "last_sync_at", value: lastSyncAt });
      }
    }

    const detail = {
      state: currentState,
      isOnline: currentState !== "offline",
      lastSyncAt,
      ...meta
    };

    document.dispatchEvent(new CustomEvent("lw:connectivity", { detail }));
    updateBanner(detail);
  }

  function updateBanner(detail) {
    let bannerEl = document.getElementById("lw-connectivity-banner");
    if (!bannerEl) {
      bannerEl = document.createElement("div");
      bannerEl.id = "lw-connectivity-banner";
      bannerEl.className = "lw-banner";
      bannerEl.style.display = "none";
      const header = document.querySelector("header.site-header") || document.body.firstChild;
      if (header && header.parentNode) {
        header.parentNode.insertBefore(bannerEl, header.nextSibling);
      } else {
        document.body.prepend(bannerEl);
      }
    }

    if (detail.state === "offline") {
      bannerEl.className = "lw-banner lw-banner--offline";
      bannerEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path><path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
        <span>Offline mode. Displaying cached slope data (${detail.lastSyncAt ? window.LW.format?.relativeTime(detail.lastSyncAt) : "local"}). Data updates paused.</span>
      `;
      bannerEl.style.display = "flex";
    } else if (detail.state === "data_outdated") {
      bannerEl.className = "lw-banner lw-banner--warning";
      bannerEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>Warning: Real-time telemetry delayed. Telemetry sync may be outdated.</span>
      `;
      bannerEl.style.display = "flex";
    } else {
      bannerEl.style.display = "none";
    }
  }

  // Auto-init on script load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    getState: () => currentState,
    isOnline: () => currentState !== "offline",
    getLastSyncAt: () => lastSyncAt,
    setState
  };
})();
