/**
 * SlopeGuard — Progressive Web App Service Worker (sw.js)
 * Version: 2.1.0
 * 
 * Strategy:
 * - Versioned cache cleanup on activate.
 * - Stale-while-revalidate for local static CSS, JS, and UI icons.
 * - Network-only with 503 fallback for dynamic /api/ requests.
 * - Sensitive auth requests (/api/auth/*) are NEVER cached.
 * - Map tiles: Network-first with limited offline cache (max 60 tiles) without unlimited scraping.
 * - Navigation fallback to offline.html when network is down.
 * - Web Push notification dispatcher with action routing.
 */

const CACHE_VERSION = "slopeguard-pwa-v2.1.0";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const TILES_CACHE = `${CACHE_VERSION}-tiles`;
const MAX_TILE_COUNT = 60;

// Pre-cached core application shell assets
const CORE_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./login.html",
  "./signup.html",
  "./forgot-password.html",
  "./reset-password.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./css/tokens.css",
  "./css/components.css",
  "./css/shells.css",
  "./css/leaflet.css",
  "./js/leaflet.js",
  "./js/main.js",
  "./js/core/config.js",
  "./js/core/content.js",
  "./js/core/format.js",
  "./js/core/store.js",
  "./js/core/connectivity.js",
  "./js/core/api.js",
  "./js/core/auth.js",
  "./js/core/ui.js",
  "./js/core/guard.js",
  "./js/core/shell.js",
  "./js/services/regions-service.js",
  "./js/services/notifications-store.js",
  "./js/services/sync.js",
  "./js/services/push.js",
  "./assets/icons/icon-192x192.png",
  "./assets/icons/icon-512x512.png",
  "./assets/icons/maskable-icon-192x192.png",
  "./assets/icons/maskable-icon-512x512.png"
];

// Install: pre-cache static application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(CORE_SHELL_ASSETS).catch((err) => {
        console.warn("[sw.js] Warning during pre-cache installation:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up previous version caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("slopeguard-") && !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.info("[sw.js] Cleaning obsolete cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Trim tile cache to prevent unbounded storage
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (e) {}
}

// Fetch event handler
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests (POST, PUT, DELETE) - Never cache
  if (request.method !== "GET") {
    return;
  }

  // 2. Strict Security: NEVER cache authentication, password-recovery, or user endpoints
  if (url.pathname.includes("/api/auth/")) {
    return;
  }

  // 3. API telemetry requests: Network-only, return 503 offline envelope if unavailable
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({
          success: false,
          code: "OFFLINE",
          message: "Network offline. Real-time telemetry currently paused.",
          offline: true
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // 4. Map Tiles (e.g. OpenStreetMap / CartoDB / Tile providers)
  if (url.hostname.includes("tile.openstreetmap.org") || url.pathname.includes("/tile/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(TILES_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(TILES_CACHE, MAX_TILE_COUNT);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Return empty 204 or transparent fallback when tile is unavailable offline
            return new Response("", { status: 204, statusText: "Offline Tile Unavailable" });
          });
        })
    );
    return;
  }

  // 5. HTML Navigation requests: Network-first with offline.html fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const offlinePage = await caches.match("./offline.html");
          return offlinePage || new Response("Offline mode active. Please reconnect to network.", {
            headers: { "Content-Type": "text/html" }
          });
        })
    );
    return;
  }

  // 6. Static local assets (CSS, JS, Fonts, Images, Icons): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});

// Web Push Event Handler
self.addEventListener("push", (event) => {
  let data = {
    id: Date.now(),
    title: "SlopeGuard Early Warning",
    body: "Critical telemetry update received for North Eastern Region slopes.",
    severity: "critical"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.description,
    icon: "assets/icons/icon-192x192.png",
    badge: "assets/icons/icon-192x192.png",
    tag: `slopeguard-alert-${data.id}`,
    renotify: true,
    data: {
      alertId: data.id,
      url: `notifications.html?alert=${data.id}`
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click: open alert bulletin
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "notifications.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes("notifications.html") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
