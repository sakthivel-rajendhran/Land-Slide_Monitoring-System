/**
 * SlopeGuard — Shared UI Component Manager (ui.js)
 * Toasts, confirmation modals, slide-out drawer, banners, and state renderers
 */

window.LW = window.LW || {};

window.LW.ui = (function() {
  // Ensure Toast Container Exists
  function getToastContainer() {
    let container = document.getElementById("lw-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "lw-toast-container";
      container.className = "lw-toast-container";
      document.body.appendChild(container);
    }
    return container;
  }

  return {
    toast(message, type = "info", duration = 4000) {
      const container = getToastContainer();
      const toast = document.createElement("div");
      toast.className = `lw-toast lw-toast--${type}`;
      toast.innerHTML = `
        <span>${message}</span>
        <button type="button" aria-label="Close" style="background:none;border:none;color:var(--lw-text-muted);cursor:pointer;padding:2px;">&times;</button>
      `;

      const closeBtn = toast.querySelector("button");
      closeBtn.onclick = () => removeToast();

      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add("visible"));

      const timeout = setTimeout(removeToast, duration);

      function removeToast() {
        clearTimeout(timeout);
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 250);
      }
    },

    confirm(title, message, onConfirm) {
      const modal = document.createElement("div");
      modal.className = "lw-drawer-backdrop active";
      modal.style.display = "flex";
      modal.style.alignItems = "center";
      modal.style.justifyContent = "center";
      modal.innerHTML = `
        <div class="lw-card" style="max-width: 420px; width: 90%; background: var(--lw-surface-glass-strong); box-shadow: var(--lw-shadow-lg);">
          <h3 class="lw-card__title" style="margin-bottom: 8px;">${title}</h3>
          <p style="font-size: 0.875rem; color: var(--lw-text-secondary); margin-bottom: 20px;">${message}</p>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="lw-btn lw-btn--outline" id="lw-modal-cancel">Cancel</button>
            <button class="lw-btn lw-btn--danger" id="lw-modal-confirm">Confirm</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector("#lw-modal-cancel").onclick = () => modal.remove();
      modal.querySelector("#lw-modal-confirm").onclick = () => {
        modal.remove();
        if (typeof onConfirm === "function") onConfirm();
      };
    },

    state: {
      render(el, stateType, opts = {}) {
        if (!el) return;
        const content = window.LW.content || {};

        if (stateType === "loading") {
          el.innerHTML = `
            <div class="lw-state">
              <div class="lw-skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
              <p class="lw-state__title">${opts.message || content.loadingRegions || "Loading..."}</p>
            </div>
          `;
        } else if (stateType === "empty") {
          el.innerHTML = `
            <div class="lw-state">
              <svg class="lw-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h4 class="lw-state__title">${opts.title || "No data available"}</h4>
              <p class="lw-state__desc">${opts.message || content.noRegionsAvailable}</p>
              ${opts.action ? `<button class="lw-btn lw-btn--outline lw-btn--sm" id="lw-state-action">${opts.action.label}</button>` : ""}
            </div>
          `;
          if (opts.action?.onClick) {
            el.querySelector("#lw-state-action")?.addEventListener("click", opts.action.onClick);
          }
        } else if (stateType === "error") {
          el.innerHTML = `
            <div class="lw-state">
              <svg class="lw-state__icon" style="color: var(--lw-risk-crit);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h4 class="lw-state__title">${opts.title || "Data Unavailable"}</h4>
              <p class="lw-state__desc">${opts.message || content.dataFailed}</p>
              ${opts.onRetry ? `<button class="lw-btn lw-btn--primary lw-btn--sm" id="lw-state-retry">Retry</button>` : ""}
            </div>
          `;
          if (opts.onRetry) {
            el.querySelector("#lw-state-retry")?.addEventListener("click", opts.onRetry);
          }
        } else if (stateType === "offline") {
          el.innerHTML = `
            <div class="lw-state">
              <svg class="lw-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
              </svg>
              <h4 class="lw-state__title">Working Offline</h4>
              <p class="lw-state__desc">${opts.message || content.cachedDataWarning}</p>
            </div>
          `;
        }
      }
    }
  };
})();
