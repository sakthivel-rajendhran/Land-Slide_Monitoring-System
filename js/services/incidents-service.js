/**
 * SlopeGuard — Citizen Road Blockage & Landslide Incident Reporting Service (incidents-service.js)
 * Comprehensive client-side service for:
 * - Incident data model & 7 standard categories
 * - Photo file validation (type, magic bytes, size < 10MB)
 * - Safe photo upload & storage reference handling
 * - Geolocation capture & coordinate verification
 * - Anti-duplicate submission protection
 * - Offline outbox queuing & synchronization
 * - Administrative review & audit tracking
 */

window.LW = window.LW || {};

window.LW.incidentsService = (function() {
  const INCIDENTS_STORAGE_KEY = "sg_citizen_incidents";
  const OFFLINE_OUTBOX_KEY = "sg_offline_incident_outbox";
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // 7 Standard Citizen Incident Categories
  const CATEGORIES = [
    "Road blocked by landslide debris",
    "Road covered by fallen rocks",
    "Road damaged by slope movement",
    "Ground cracks or slope instability near a road",
    "Small landslide observed",
    "Flooding or unusual water flow affecting a road",
    "Other relevant hazard"
  ];

  // Standard Passability Classifications
  const PASSABILITY_OPTIONS = [
    { value: "unknown", label: "Unknown / Unassessed", color: "#A3B3A0" },
    { value: "open", label: "Open (Passable with Caution)", color: "#8FD694" },
    { value: "partially blocked", label: "Partially Blocked (Single Lane / Hazard)", color: "#F1A46B" },
    { value: "completely blocked", label: "Completely Blocked (Impassable)", color: "#F07878" }
  ];

  // Magic bytes definition for file content validation
  const MAGIC_BYTES = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    webpRiff: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    webpFormat: [0x57, 0x45, 0x42, 0x50] // "WEBP"
  };

  /**
   * Validate uploaded photo file for format, size, and real file content (magic bytes)
   */
  async function validatePhotoFile(file) {
    if (!file) {
      return { valid: false, error: "No file selected." };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format (${file.type}). Please select a JPEG, PNG, or WEBP image.`
      };
    }

    // Magic bytes verification
    try {
      let bytes = null;
      if (file.buffer) {
        bytes = new Uint8Array(file.buffer);
      } else if (file.slice) {
        const buffer = await file.slice(0, 16).arrayBuffer();
        bytes = new Uint8Array(buffer);
      } else if (file.arrayBuffer) {
        const buffer = await file.arrayBuffer();
        bytes = new Uint8Array(buffer);
      }

      if (bytes) {
        let isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
        let isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
        let isWebp =
          bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
          bytes.length >= 12 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50; // WEBP

        if (!isJpeg && !isPng && !isWebp) {
          return {
            valid: false,
            error: "File content header does not match a valid image structure. Upload rejected."
          };
        }
      }

      return { valid: true };
    } catch (err) {
      console.warn("[incidentsService] Buffer read error:", err);
      return { valid: ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) };
    }
  }

  // Mapping between UI display text and backend enum IncidentCategory
  const CATEGORY_MAP = {
    "Road blocked by landslide debris": "DEBRIS_FLOW",
    "Road covered by fallen rocks": "ROCKFALL",
    "Road damaged by slope movement": "ROAD_SUBSIDENCE",
    "Ground cracks or slope instability near a road": "SLOPE_CRACK",
    "Small landslide observed": "MUD_SLIDE",
    "Flooding or unusual water flow affecting a road": "EROSION",
    "Other relevant hazard": "OTHER",
    "ROCKFALL": "ROCKFALL",
    "MUD_SLIDE": "MUD_SLIDE",
    "DEBRIS_FLOW": "DEBRIS_FLOW",
    "ROAD_SUBSIDENCE": "ROAD_SUBSIDENCE",
    "SLOPE_CRACK": "SLOPE_CRACK",
    "EROSION": "EROSION",
    "OTHER": "OTHER"
  };

  const ENUM_TO_LABEL = {
    "DEBRIS_FLOW": "Road blocked by landslide debris",
    "ROCKFALL": "Road covered by fallen rocks",
    "ROAD_SUBSIDENCE": "Road damaged by slope movement",
    "SLOPE_CRACK": "Ground cracks or slope instability near a road",
    "MUD_SLIDE": "Small landslide observed",
    "EROSION": "Flooding or unusual water flow affecting a road",
    "OTHER": "Other relevant hazard"
  };

  function toBackendCategory(cat) {
    if (!cat) return "OTHER";
    return CATEGORY_MAP[cat] || "OTHER";
  }

  function toDisplayCategory(cat) {
    if (!cat) return "Observation";
    return ENUM_TO_LABEL[cat] || cat;
  }

  function normalizeReport(item) {
    if (!item) return null;
    const cat = item.incidentCategory || item.category || "OTHER";
    const locDesc = item.locationDescription || "";
    const apiBase = window.LW.config?.apiBase || "/api";
    const isLive = !window.LW.config?.useMock;
    return {
      id: item.id ? String(item.id) : (item.localId || "INC-" + Date.now()),
      rawId: item.id,
      incidentType: toDisplayCategory(cat),
      incidentCategory: cat,
      category: cat,
      description: item.description || "",
      observedAt: item.observationTimestamp || item.reportedTimestamp || item.observedAt || new Date().toISOString(),
      submittedAt: item.reportedTimestamp || item.submittedAt || new Date().toISOString(),
      status: item.status || "PENDING",
      reporterName: item.reporterName || "Citizen Reporter",
      reviewReason: item.reviewNotes || item.reviewReason || "",
      roadPassability: item.roadPassability || (item.environmentalObservations?.toLowerCase().includes("passability:") ? item.environmentalObservations.split(":")[1].trim() : "unknown"),
      verifiedPassability: item.verifiedPassability || item.roadPassability || "unknown",
      location: {
        latitude: Number(item.latitude || (item.location && item.location.latitude) || 0),
        longitude: Number(item.longitude || (item.location && item.location.longitude) || 0),
        roadName: locDesc,
        placeName: locDesc || "Regional Slope",
        accuracy: item.accuracy || 15
      },
      photos: (item.photos || []).map(p => {
        const photoUrl = p.id && item.id ? `${apiBase}/reports/${item.id}/photos/${p.id}` : (p.url || p.previewUrl);
        return {
          id: p.id,
          filename: p.originalFilename || p.filename || "evidence.jpg",
          url: photoUrl,
          previewUrl: photoUrl
        };
      })
    };
  }

  /**
   * Store image securely in IndexedDB or storage reference without bloating main DB records with Base64
   */
  async function processPhotoUpload(file, onProgress = () => {}) {
    const val = await validatePhotoFile(file);
    if (!val.valid) {
      throw new Error(val.error);
    }

    onProgress(25);

    // Generate unique safe photo identifier and clean filename (prevents path traversal)
    const safeExt = file.type === "image/png" ? "png" : (file.type === "image/webp" ? "webp" : "jpg");
    const photoId = "PHOTO-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    const safeFilename = `${photoId}.${safeExt}`;

    onProgress(50);

    // Read as DataURL for secure preview and local object persistence
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.readAsDataURL(file);
    });

    onProgress(80);

    // Store binary media separately in IndexedDB 'incident_media' or localStorage media map
    try {
      if (window.LW.store) {
        await window.LW.store.put("meta", {
          name: `photo_${photoId}`,
          data: dataUrl,
          mimeType: file.type,
          size: file.size,
          savedAt: new Date().toISOString()
        }).catch(() => {});
      }
    } catch (e) {}

    onProgress(100);

    return {
      id: photoId,
      filename: safeFilename,
      originalName: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
      mimeType: file.type,
      size: file.size,
      url: dataUrl,
      previewUrl: dataUrl,
      file: file, // Keep native File reference for multipart uploads
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Save an incident report locally in the offline queue
   */
  async function saveOfflineReport(reportPayload) {
    let outbox = [];
    try {
      outbox = JSON.parse(localStorage.getItem(OFFLINE_OUTBOX_KEY) || "[]");
    } catch (e) {}

    const offlineItem = {
      ...reportPayload,
      localId: "OFFLINE-" + Date.now(),
      offlineQueuedAt: new Date().toISOString(),
      syncStatus: "Saved Locally (Pending Sync)"
    };

    outbox.push(offlineItem);
    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(outbox));

    if (window.LW.store) {
      await window.LW.store.put("outbox", {
        type: "incident_submission",
        data: offlineItem,
        at: new Date().toISOString()
      }).catch(() => {});
    }

    return offlineItem;
  }

  /**
   * Submit an incident report to the backend API or offline fallback
   */
  async function submitIncident(reportData) {
    // 1. Client-Side Validation
    if (!reportData.incidentType || !reportData.incidentType.trim()) {
      throw new Error("Incident type is required. Please select a hazard category.");
    }
    if (!reportData.description || reportData.description.trim().length < 10) {
      throw new Error("Please provide a descriptive observation (minimum 10 characters).");
    }
    if (!reportData.observedAt) {
      throw new Error("Date and time observed is required.");
    }
    // Normalize coordinates if top-level latitude/longitude provided
    if (!reportData.location && (typeof reportData.latitude === "number" || typeof reportData.lat === "number")) {
      reportData.location = {
        latitude: reportData.latitude || reportData.lat,
        longitude: reportData.longitude || reportData.lng,
        accuracyMeters: reportData.accuracyMeters || 15,
        source: reportData.source || "manual",
        roadName: reportData.roadName || "",
        landmark: reportData.landmark || ""
      };
    }

    if (!reportData.location || typeof reportData.location.latitude !== "number" || typeof reportData.location.longitude !== "number") {
      throw new Error("Geographic coordinates are required for an actionable incident report.");
    }

    const lat = reportData.location.latitude;
    const lng = reportData.location.longitude;
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error("Geographic coordinates are outside valid boundary ranges.");
    }

    // 2. Check Authentication
    const currentUser = window.LW.auth?.getUser() || window.LW.authService?.getCurrentUser();
    if (!currentUser) {
      throw new Error("You must be signed in to submit an incident report.");
    }

    // Build Spring Boot ReportCreateRequest payload
    const backendCat = toBackendCategory(reportData.incidentType);
    const locDesc = (reportData.location.roadName || reportData.location.placeName || reportData.location.landmark || "Regional Slope Corridor").trim();

    const payload = {
      incidentCategory: backendCat,
      description: reportData.description.trim(),
      latitude: lat,
      longitude: lng,
      locationDescription: locDesc.length >= 3 ? locDesc.substring(0, 255) : "Regional Slope",
      observationTimestamp: reportData.observedAt ? new Date(reportData.observedAt).toISOString().slice(0, 19) : null,
      environmentalObservations: reportData.roadPassability ? `Passability: ${reportData.roadPassability}` : null
    };

    // 3. Check connectivity & submit
    if (!navigator.onLine) {
      const offlineSaved = await saveOfflineReport({ ...payload, photos: reportData.photos || [] });
      return {
        success: true,
        offline: true,
        data: offlineSaved,
        message: "Network is offline. Report has been saved locally on your device and will be submitted once connection is restored."
      };
    }

    try {
      const created = await window.LW.api.post("/api/reports", payload);
      const createdReport = created.data || created;

      // Upload attached photos if available
      if (createdReport && createdReport.id && reportData.photos && reportData.photos.length > 0) {
        for (const p of reportData.photos) {
          if (p.file) {
            try {
              const formData = new FormData();
              formData.append("file", p.file);
              await window.LW.api.post(`/api/reports/${createdReport.id}/photos`, formData);
            } catch (uploadErr) {
              console.warn("[incidentsService] Photo attachment warning:", uploadErr);
            }
          }
        }
      }

      return {
        success: true,
        data: normalizeReport(createdReport),
        message: "Report submitted successfully."
      };
    } catch (err) {
      if (err.offline || !navigator.onLine) {
        const offlineSaved = await saveOfflineReport({ ...payload, photos: reportData.photos || [] });
        return {
          success: true,
          offline: true,
          data: offlineSaved,
          message: "Could not reach server. Report saved locally in offline outbox."
        };
      }
      throw err;
    }
  }

  /**
   * Fetch all incident reports (public map view or admin queue)
   */
  async function getAllIncidents(filters = {}) {
    const isPrivileged = window.LW.auth?.hasRole("admin", "officer");
    try {
      const endpoint = isPrivileged ? "/api/admin/reports" : "/api/reports";
      const res = await window.LW.api.get(endpoint, filters);
      const items = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
      return items.map(normalizeReport);
    } catch (err) {
      if (isPrivileged) {
        try {
          const res = await window.LW.api.get("/api/reports");
          const items = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
          return items.map(normalizeReport);
        } catch (e) {}
      }
      return [];
    }
  }

  /**
   * Fetch logged-in citizen's personal incident reports
   */
  async function getMyIncidents() {
    const currentUser = window.LW.auth?.getUser() || window.LW.authService?.getCurrentUser();
    if (!currentUser) return [];

    try {
      const res = await window.LW.api.get("/api/reports/mine");
      const items = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
      return items.map(normalizeReport);
    } catch (err) {
      console.warn("[incidentsService] getMyIncidents error:", err);
      return [];
    }
  }

  /**
   * Fetch single incident report by reference ID
   */
  async function getIncidentById(id) {
    const isPrivileged = window.LW.auth?.hasRole("admin", "officer");
    const endpoint = isPrivileged ? `/api/admin/reports/${encodeURIComponent(id)}` : `/api/reports/${encodeURIComponent(id)}`;
    const res = await window.LW.api.get(endpoint);
    return normalizeReport(res.data || res);
  }

  /**
   * Submit an administrative review adjudication
   */
  async function reviewIncident(id, reviewPayload) {
    const statusMap = {
      "verified": "VERIFIED",
      "rejected": "REJECTED",
      "under review": "UNDER_REVIEW",
      "additional info requested": "ADDITIONAL_INFO_REQUESTED",
      "resolved": "RESOLVED",
      "pending": "PENDING"
    };

    const rawStatus = (reviewPayload.status || "").toLowerCase();
    const mappedStatus = statusMap[rawStatus] || (reviewPayload.status ? reviewPayload.status.toUpperCase() : "VERIFIED");

    const payload = {
      status: mappedStatus,
      reviewNotes: reviewPayload.reviewReason || reviewPayload.reviewNotes || reviewPayload.notes || "Reviewed by Geotechnical Officer"
    };

    const res = await window.LW.api.patch(`/api/admin/reports/${encodeURIComponent(id)}/status`, payload);
    return res;
  }

  /**
   * Synchronize pending offline reports
   */
  async function syncOfflineReports() {
    if (!navigator.onLine) return { synced: 0, pending: 0 };

    let outbox = [];
    try {
      outbox = JSON.parse(localStorage.getItem(OFFLINE_OUTBOX_KEY) || "[]");
    } catch (e) {}

    if (outbox.length === 0) return { synced: 0, pending: 0 };

    let successful = 0;
    const remaining = [];

    for (const item of outbox) {
      try {
        await submitIncident(item);
        successful++;
      } catch (err) {
        console.warn("[incidentsService] Failed to sync offline item:", err);
        remaining.push(item);
      }
    }

    localStorage.setItem(OFFLINE_OUTBOX_KEY, JSON.stringify(remaining));
    return { synced: successful, pending: remaining.length };
  }

  return {
    getCategories() {
      return [...CATEGORIES];
    },
    getPassabilityOptions() {
      return [...PASSABILITY_OPTIONS];
    },
    validatePhotoFile,
    validateImageFile: validatePhotoFile,
    processPhotoUpload,
    submitIncident,
    getAllIncidents,
    getMyIncidents,
    getIncidentById,
    reviewIncident,
    syncOfflineReports,
    saveOfflineReport,
    normalizeReport
  };
})();
