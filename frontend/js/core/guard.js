/**
 * SlopeGuard — Client Route & Role Guard (guard.js)
 * Protects authenticated routes and enforces roles: USER, OFFICER, ADMIN
 */

window.LW = window.LW || {};

window.LW.guard = (function() {
  function getCurrentUser() {
    try {
      const stored = sessionStorage.getItem("sg_user") || localStorage.getItem("sg_user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function isInAdmin() {
    return window.location.pathname.includes("/admin/") || window.location.pathname.startsWith("admin/");
  }

  function getTargetDestination() {
    const filename = window.location.pathname.split("/").pop() || "dashboard.html";
    const target = isInAdmin() ? `admin/${filename}` : filename;
    return encodeURIComponent(target + window.location.search);
  }

  function getLoginUrl() {
    return isInAdmin() ? "../login.html" : "login.html";
  }

  function getDashboardUrl() {
    return isInAdmin() ? "../dashboard.html" : "dashboard.html";
  }

  // Setup bfcache/pageshow listener to recheck authentication when user navigates back
  if (typeof window !== "undefined") {
    window.addEventListener("pageshow", function(event) {
      if (event.persisted) {
        const user = getCurrentUser();
        if (!user) {
          window.location.replace(`${getLoginUrl()}?next=${getTargetDestination()}`);
        }
      }
    });
  }

  return {
    getUser: getCurrentUser,

    requireAuth() {
      const user = getCurrentUser();
      if (!user) {
        window.location.replace(`${getLoginUrl()}?next=${getTargetDestination()}`);
        return false;
      }
      return true;
    },

    requireRole(allowedRoles = []) {
      if (!this.requireAuth()) return false;
      const user = getCurrentUser();
      const userRole = (user.role || "USER").toUpperCase();
      const rolesUpper = allowedRoles.map(r => r.toUpperCase());

      if (!rolesUpper.includes(userRole)) {
        if (window.LW.ui?.toast) {
          window.LW.ui.toast("Access denied: Administrative privileges required.", "error");
        }
        setTimeout(() => {
          window.location.replace(getDashboardUrl());
        }, 120);
        return false;
      }
      return true;
    }
  };
})();
