package com.slopeguard.controller;

import com.slopeguard.dto.AlertPageResponse;
import com.slopeguard.dto.UpdateAlertStatusRequest;
import com.slopeguard.exception.ResourceNotFoundException;
import com.slopeguard.model.AlertLifecycleStatus;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.EarlyWarningAlert;
import com.slopeguard.service.AlertService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Controller providing public early-warning alert observation and administrative status adjudication.
 */
@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    /**
     * Lists early-warning alerts with optional filtering and pagination.
     */
    @GetMapping
    public ResponseEntity<AlertPageResponse> getAlerts(
            @RequestParam(required = false) AlertSeverity severity,
            @RequestParam(required = false) AlertLifecycleStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page < 0) {
            throw new IllegalArgumentException("Page index cannot be negative");
        }
        if (size <= 0 || size > 50) {
            throw new IllegalArgumentException("Page size must be between 1 and 50");
        }

        AlertPageResponse alerts = alertService.getAlerts(severity, status, page, size);

        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Total-Count", String.valueOf(alerts.getTotalElements()));
        headers.add("X-Page-Number", String.valueOf(alerts.getPage()));
        headers.add("X-Page-Size", String.valueOf(alerts.getSize()));
        headers.add("X-Total-Pages", String.valueOf(alerts.getTotalPages()));

        return ResponseEntity.ok().headers(headers).body(alerts);
    }

    /**
     * Retrieves specific early-warning alert details by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<EarlyWarningAlert> getAlertById(@PathVariable String id) {
        EarlyWarningAlert alert = alertService.getAlertById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert record with ID '" + id + "' was not found."));
        return ResponseEntity.ok(alert);
    }

    /**
     * Adjudicates an alert's lifecycle status. Restricted to administrators.
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EarlyWarningAlert> updateAlertStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateAlertStatusRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        Long adminUserId = null;
        if (jwt != null) {
            Object userIdClaim = jwt.getClaim("userId");
            if (userIdClaim instanceof Number) {
                adminUserId = ((Number) userIdClaim).longValue();
            } else if (userIdClaim instanceof String) {
                try {
                    adminUserId = Long.parseLong((String) userIdClaim);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        EarlyWarningAlert updated = alertService.updateAlertStatus(
                id, request.getStatus(), request.getAdminNote(), adminUserId);
        return ResponseEntity.ok(updated);
    }
}
