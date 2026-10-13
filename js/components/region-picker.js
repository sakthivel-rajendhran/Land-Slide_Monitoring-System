/**
 * SlopeGuard — Reusable Region Picker Component (region-picker.js)
 * Implements the frozen contract:
 * LW.RegionPicker.mount(el, { onChange(region) }) // region = { id, name, district, lat, lng }
 */

window.LW = window.LW || {};

window.LW.RegionPicker = {
  async mount(el, options = {}) {
    if (!el) return null;
    const onChange = options.onChange || (() => {});

    el.className = "lw-region-picker-container";
    el.innerHTML = `
      <div class="lw-search" style="position: relative;">
        <svg class="lw-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input type="text" class="lw-search__input" placeholder="Search region or district..." autocomplete="off" />
        <div class="lw-picker-dropdown" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; max-height: 240px; overflow-y: auto; background: var(--lw-surface-glass-strong); backdrop-filter: blur(20px); border: 1px solid var(--lw-border); border-radius: var(--lw-r-sm); z-index: 1000; box-shadow: var(--lw-shadow-md);"></div>
      </div>
    `;

    const input = el.querySelector(".lw-search__input");
    const dropdown = el.querySelector(".lw-picker-dropdown");

    let allRegions = [];
    try {
      if (window.LW.regionsService) {
        allRegions = await window.LW.regionsService.getAll();
      }
    } catch (e) {
      console.warn("[LW.RegionPicker] Failed to preload regions", e);
    }

    function renderOptions(query = "") {
      const q = query.toLowerCase().trim();
      const filtered = allRegions.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        dropdown.innerHTML = `<div style="padding: 10px 14px; font-size: 0.8125rem; color: var(--lw-text-muted);">No matching regions</div>`;
      } else {
        dropdown.innerHTML = filtered.map(r => `
          <div class="lw-picker-option" data-id="${r.id}" style="padding: 10px 14px; font-size: 0.875rem; border-bottom: 1px solid rgba(215,245,160,0.06); cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--lw-text);">${r.name}</strong>
              <div style="font-size: 0.75rem; color: var(--lw-text-muted);">${r.district}, ${r.state}</div>
            </div>
            <span class="lw-risk lw-risk--${r.risk_level || 'none'}" style="font-size: 0.6875rem;">${(r.risk_level || 'none').toUpperCase()}</span>
          </div>
        `).join("");

        dropdown.querySelectorAll(".lw-picker-option").forEach(opt => {
          opt.onclick = () => {
            const id = parseInt(opt.dataset.id, 10);
            const selected = allRegions.find(r => r.id === id);
            if (selected) {
              input.value = `${selected.name} (${selected.district})`;
              dropdown.style.display = "none";
              onChange(selected);
            }
          };
        });
      }
      dropdown.style.display = "block";
    }

    input.onfocus = () => renderOptions(input.value);
    input.oninput = () => renderOptions(input.value);

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!el.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    return {
      setValue(region) {
        if (region) {
          input.value = `${region.name} (${region.district})`;
        } else {
          input.value = "";
        }
      }
    };
  }
};
