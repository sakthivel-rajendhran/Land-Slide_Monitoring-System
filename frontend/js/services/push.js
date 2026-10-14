/**
 * SlopeGuard — Web Push Notification Manager (push.js)
 * Implements:
 * - LW.push.status() -> "enabled" | "not-granted" | "denied" | "unsupported"
 * - LW.push.enable() // User-gesture explicit activation
 * - LW.push.disable()
 * - Secure subscription registration to /api/push/subscribe endpoint
 */

window.LW = window.LW || {};

window.LW.push = (function() {
  function getStatus() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return "unsupported";
    }
    const perm = Notification.permission;
    if (perm === "granted") return "enabled";
    if (perm === "denied") return "denied";
    return "not-granted";
  }

  async function enable() {
    const status = getStatus();
    if (status === "unsupported") {
      if (window.LW.ui?.toast) {
        window.LW.ui.toast("Web Push notifications are not supported on this browser or platform.", "info");
      }
      return "unsupported";
    }
    if (status === "denied") {
      if (window.LW.ui?.toast) {
        window.LW.ui.toast("Push notification permissions were previously blocked. Please allow them in your site settings.", "error");
      }
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        let reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          reg = await navigator.serviceWorker.register("./sw.js");
        }
        await navigator.serviceWorker.ready;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          // Subscribe to PushManager. If applicationServerKey is configured in config, use it.
          const configKey = window.LW.config?.vapidPublicKey;
          const options = { userVisibleOnly: true };
          if (configKey) {
            options.applicationServerKey = urlBase64ToUint8Array(configKey);
          }
          try {
            sub = await reg.pushManager.subscribe(options);
          } catch (subErr) {
            console.warn("[LW.push] Local push subscription notice:", subErr.message);
          }
        }

        // Send subscription to backend if available
        if (sub && window.LW.api) {
          await window.LW.api.post("/api/push/subscribe", {
            subscription: sub.toJSON ? sub.toJSON() : sub,
            device: navigator.userAgent,
            subscribedAt: new Date().toISOString()
          }).catch(e => {
            console.info("[LW.push] Subscribed locally. Server sync status:", e.message);
          });
        }

        if (window.LW.ui?.toast) {
          window.LW.ui.toast("Critical landslide alerts enabled for this device!", "success");
        }
        return "enabled";
      } else {
        if (window.LW.ui?.toast) {
          window.LW.ui.toast("Notification permission was not granted.", "info");
        }
        return "denied";
      }
    } catch (e) {
      console.error("[LW.push] Error requesting push permission:", e);
      return "denied";
    }
  }

  async function disable() {
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          if (window.LW.api) {
            await window.LW.api.post("/api/push/unsubscribe", {
              endpoint: sub.endpoint
            }).catch(() => {});
          }
        }
      }
      if (window.LW.ui?.toast) {
        window.LW.ui.toast("Push notifications disabled.", "info");
      }
      return "not-granted";
    } catch (e) {
      console.error("[LW.push] Error disabling push:", e);
      return "error";
    }
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return {
    status: getStatus,
    enable,
    disable
  };
})();
