/**
 * SlopeGuard — Core Configuration (config.js)
 * Single place for runtime config, API endpoints, tile providers and app state
 */

window.LW = window.LW || {};

window.LW.config = {
  appVersion: "1.0.0",
  // If hosted directly on backend port 8080 use relative /api, otherwise target live backend on http://localhost:8080/api
  apiBase: (typeof window !== "undefined" && window.location && window.location.port === "8080")
    ? "/api"
    : "http://localhost:8080/api",
  useMock: false, // Live persistence against Spring Boot & MySQL

  tileProvider: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
  },

  // Limits in minutes for data freshness calculations
  freshnessThresholds: {
    delayedAfterMinutes: 180, // 3 hours
    unavailableAfterMinutes: 720 // 12 hours
  },

  defaultCenter: [25.7500, 92.8000], // North Eastern Region (NER Corridor)
  defaultZoom: 7,
  nerCenter: [25.7500, 92.8000],
  westernGhatsCenter: [11.4102, 76.6950]
};
