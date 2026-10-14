/**
 * SlopeGuard — Synchronization Engine (sync.js)
 * Background synchronization, outbox flush, exponential backoff, and connectivity integration.
 */

window.LW = window.LW || {};

window.LW.sync = (function() {
  let isSyncing = false;
  let backoffMs = 30000; // 30s initial backoff
  const MAX_BACKOFF_MS = 600000; // 10 min

  async function trigger() {
    if (isSyncing || !navigator.onLine) return;
    isSyncing = true;

    if (window.LW.connectivity) {
      window.LW.connectivity.setState("syncing");
    }

    try {
      // 1. Fetch remote notifications feed
      const meta = await window.LW.store?.get("meta", "cursor");
      const cursor = meta?.value || "";
      const path = cursor ? `/api/notifications?since=${encodeURIComponent(cursor)}` : "/api/notifications";

      const res = await window.LW.api.get(path);

      if (res && res.data) {
        const notifications = Array.isArray(res.data) ? res.data : [];
        for (const notif of notifications) {
          await window.LW.notifications.upsertAlert(notif);
        }

        // Update cursor
        if (res.cursor) {
          await window.LW.store?.put("meta", { name: "cursor", value: res.cursor });
        }
      }

      // 2. Flush local outbox
      await flushOutbox();

      // Reset backoff on success
      backoffMs = 30000;

      if (window.LW.connectivity) {
        window.LW.connectivity.setState("sync_complete");
      }

      const unread = await window.LW.notifications.getUnreadCount();
      document.dispatchEvent(new CustomEvent("lw:notifications-changed", { detail: { unread } }));
    } catch (err) {
      console.warn("[LW.sync] Sync encounter issue:", err.message);

      if (window.LW.connectivity) {
        window.LW.connectivity.setState("sync_failed");
      }

      // Exponential backoff
      setTimeout(trigger, backoffMs);
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
    } finally {
      isSyncing = false;
    }
  }

  async function flushOutbox() {
    const store = window.LW.store;
    if (!store) return;

    const outboxItems = await store.list("outbox");
    for (const item of outboxItems) {
      try {
        if (item.type === "read") {
          await window.LW.api.put(`/api/notifications/${item.alert_id}/read`);
        } else if (item.type === "unread") {
          await window.LW.api.put(`/api/notifications/${item.alert_id}/unread`);
        }
        await store.delete("outbox", item.autoId);
      } catch (e) {
        console.warn("[LW.sync] Failed to flush outbox item", item, e);
        break; // Retry next sync cycle
      }
    }
  }

  // Setup auto-sync triggers
  function init() {
    // 1. On page visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && navigator.onLine) {
        trigger();
      }
    });

    // 2. Initial sync
    setTimeout(trigger, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { trigger };
})();
