package com.slopeguard.controller;

import com.slopeguard.dto.ApiInfoResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller providing discovery information and route catalog for the SlopeGuard REST API.
 */
@RestController
@RequestMapping("/api")
public class ApiController {

    private static final List<String> ENDPOINTS = List.of(
            "GET   /api - API discovery and service metadata",
            "GET   /api/health - System health check (reports databaseConfigured: false)",
            "POST  /api/auth/register - Citizen user account registration (assigns CITIZEN role)",
            "POST  /api/auth/login - User authentication; issues signed JWT bearer token",
            "GET   /api/auth/me - Authenticated user profile and role verification [Requires Bearer Token]",
            "POST  /api/auth/logout - Client token discard acknowledgement",
            "GET   /api/risks - List monitored sample landslide risk locations",
            "GET   /api/risks/{id} - Get specific risk location details by ID",
            "GET   /api/risks/summary - Aggregate risk statistics across Northeast India",
            "POST  /api/reports - Submit a citizen landslide hazard incident report [Requires Bearer Token]",
            "GET   /api/reports - List recent incident reports (public privacy-filtered view)",
            "GET   /api/reports/mine - List incident reports submitted by authenticated citizen [Requires Bearer Token]",
            "GET   /api/reports/{id} - Get report details (enforces citizen ownership or ADMIN) [Requires Bearer Token]",
            "POST  /api/reports/{id}/photos - Upload geotagged incident photograph [Requires Bearer Token (Owner or Admin)]",
            "GET   /api/reports/{id}/photos - List photo attachments metadata [Requires Bearer Token (Owner or Admin)]",
            "GET   /api/reports/{id}/photos/{photoId} - Stream photo binary safely [Requires Bearer Token (Owner or Admin)]",
            "GET   /api/admin/reports - Administrative review queue with filtering and pagination [Requires ADMIN Role]",
            "GET   /api/admin/reports/{id} - Administrative report detail inspection [Requires ADMIN Role]",
            "GET   /api/admin/reports/pending - Filtered review queue for pending reports [Requires ADMIN Role]",
            "GET   /api/admin/reports/{id}/photos - Inspect associated photo attachments [Requires ADMIN Role]",
            "PATCH /api/admin/reports/{id}/status - Adjudicate report status with transition rules [Requires ADMIN Role]",
            "POST  /api/admin/reports/{id}/review - Submit administrative review notes [Requires ADMIN Role]",
            "GET   /api/admin/audit-logs - Administrative audit event history and filtering [Requires ADMIN Role]",
            "GET   /api/admin/reports/{id}/audit-logs - Lifecycle audit trail for specific incident report [Requires ADMIN Role]",
            "GET   /api/environmental/rainfall - Current atmospheric precipitation estimation from Open-Meteo [Public]",
            "GET   /api/environmental/rainfall/forecast - Hourly precipitation forecast projection from Open-Meteo [Public]",
            "GET   /api/environmental/terrain - Digital elevation and calculated slope features from Copernicus DEM GLO-30 [Public]",
            "GET   /api/environmental/status - Real-time environmental provider operational connectivity metrics [Public]",
            "POST  /api/risks/predict - Evaluate landslide hazard risk via Python AI Random Forest microservice [Public]",
            "GET   /api/risks/model-status - Query AI model governance, validation status, and metrics [Public]",
            "POST  /api/risks/predict/live - Evaluate live risk combining real Open-Meteo rainfall and terrain inputs [Public]",
            "POST  /api/risk-assessments - Multi-source environmental risk assessment and feature provenance gathering [Public]",
            "GET   /api/alerts - Early-warning hazard alert queue with pagination and filtering [Public]",
            "GET   /api/alerts/{id} - Detailed early-warning alert inspection [Public]",
            "PATCH /api/alerts/{id}/status - Adjudicate early-warning alert lifecycle status [Requires ADMIN Role]"
    );

    @GetMapping
    public ResponseEntity<ApiInfoResponse> getApiInfo() {
        ApiInfoResponse info = new ApiInfoResponse(
                "SlopeGuard Backend API",
                "8.0.0-phase8",
                "Phase 8: Real DEM Integration and Automatic Terrain Feature Extraction (Without Database)",
                "AI-assisted Landslide Risk Monitoring and Early Warning System for Northeast India",
                ENDPOINTS
        );
        return ResponseEntity.ok(info);
    }
}
