/**
 * SlopeGuard Field Officer Unified Sidebar Navigation
 * Standardizes navigation order, labels, active routing, and session controls.
 */
(function () {
  'use strict';

  function resolveActiveNavId() {
    const path = window.location.pathname.toLowerCase().split('/').pop() || 'dashboard.html';
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get('tab') || '').toLowerCase();

    if (path.includes('report-incident')) {
      return 'report-incident';
    }
    if (path.includes('my-reports')) {
      return 'my-reports';
    }
    if (path.includes('settings')) {
      return 'settings';
    }
    if (path.includes('my-areas')) {
      return 'locations';
    }
    if (path.includes('history')) {
      return 'reports';
    }
    if (path.includes('map.html')) {
      return 'risk-map';
    }

    // Default or dashboard page
    if (path.includes('dashboard') || path === '' || path === 'index.html') {
      if (tab === 'map') return 'risk-map';
      if (tab === 'reports') return 'reports';
      if (tab === 'locations') return 'locations';
      if (tab === 'profile') return 'profile';
      if (tab === 'settings') return 'settings';
      return 'dashboard';
    }

    return 'dashboard';
  }

  function syncActiveNavState() {
    const activeId = resolveActiveNavId();
    const navItems = document.querySelectorAll('.sidebar-nav .sidebar-nav-item');
    if (!navItems || navItems.length === 0) return;

    navItems.forEach(item => {
      const navId = item.getAttribute('data-nav-id') || item.getAttribute('data-nav-tab');
      let matches = false;

      if (navId) {
        if (activeId === 'dashboard' && (navId === 'dashboard' || navId === 'overview')) matches = true;
        else if (activeId === 'risk-map' && (navId === 'risk-map' || navId === 'map')) matches = true;
        else if (activeId === 'reports' && navId === 'reports') matches = true;
        else if (activeId === 'locations' && navId === 'locations') matches = true;
        else if (activeId === 'report-incident' && navId === 'report-incident') matches = true;
        else if (activeId === 'my-reports' && navId === 'my-reports') matches = true;
        else if (activeId === 'profile' && navId === 'profile') matches = true;
        else if (activeId === 'settings' && navId === 'settings') matches = true;
      } else {
        // Fallback matching on href or text
        const href = (item.getAttribute('href') || '').toLowerCase();
        const text = (item.textContent || '').trim().toLowerCase();

        if (activeId === 'dashboard' && (href.includes('dashboard.html') && !href.includes('tab='))) matches = true;
        else if (activeId === 'risk-map' && (href.includes('tab=map') || href.includes('map.html') || text.includes('risk map'))) matches = true;
        else if (activeId === 'reports' && (href.includes('tab=reports') || href.includes('history.html') || text === 'reports')) matches = true;
        else if (activeId === 'locations' && (href.includes('tab=locations') || href.includes('my-areas.html') || text.includes('monitored locations'))) matches = true;
        else if (activeId === 'report-incident' && href.includes('report-incident')) matches = true;
        else if (activeId === 'my-reports' && href.includes('my-reports')) matches = true;
        else if (activeId === 'profile' && (href.includes('tab=profile') || text.includes('officer profile'))) matches = true;
        else if (activeId === 'settings' && (href.includes('settings.html') || href.includes('tab=settings') || text.includes('settings'))) matches = true;
      }

      if (matches) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function initSidebarUserAndLogout() {
    let currentUser = null;
    try {
      const raw = sessionStorage.getItem('sg_user') || localStorage.getItem('sg_user');
      if (raw) currentUser = JSON.parse(raw);
    } catch (_) {}

    const name = currentUser?.name || currentUser?.username || 'NER Field Officer';
    const role = (currentUser?.role || 'OFFICER').toUpperCase();
    const initial = name.charAt(0).toUpperCase() || 'O';

    ['sidebarAvatar', 'sidebarUserAvatar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = initial;
    });

    ['sidebarName', 'sidebarUserName'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = name;
    });

    ['sidebarRole', 'sidebarUserRole'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `${role} &bull; NER Command`;
    });

    // Sign out handlers
    const logoutBtns = document.querySelectorAll('#sidebarLogout, #sidebarLogoutBtn, [data-action="logout"]');
    logoutBtns.forEach(btn => {
      if (!btn.__hasLogoutBound) {
        btn.__hasLogoutBound = true;
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          try {
            sessionStorage.removeItem('sg_user');
            localStorage.removeItem('sg_user');
            sessionStorage.removeItem('sg_auth_token');
          } catch (_) {}
          window.location.href = 'login.html';
        });
      }
    });

    // Mobile Sidebar Drawer Toggle
    const toggleBtns = document.querySelectorAll('#mobileToggle, #topbarMobileToggle, .topbar-mobile-toggle');
    const sidebar = document.getElementById('dashboardSidebar');
    if (sidebar && toggleBtns.length > 0) {
      toggleBtns.forEach(toggle => {
        if (!toggle.__hasToggleBound) {
          toggle.__hasToggleBound = true;
          toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-open');
          });
        }
      });

      // Close drawer on clicking outside
      document.addEventListener('click', function (e) {
        if (sidebar.classList.contains('mobile-open')) {
          if (!sidebar.contains(e.target) && !e.target.closest('.topbar-mobile-toggle, #mobileToggle, #topbarMobileToggle')) {
            sidebar.classList.remove('mobile-open');
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncActiveNavState();
      initSidebarUserAndLogout();
    });
  } else {
    syncActiveNavState();
    initSidebarUserAndLogout();
  }

  // Also listen for popstate for client-side navigation
  window.addEventListener('popstate', syncActiveNavState);

  // Expose global helper if other scripts want to trigger it
  window.SlopeGuardNav = {
    syncActiveState: syncActiveNavState,
    resolveActiveNavId: resolveActiveNavId
  };
})();
