package com.slopeguard.controller;

import com.slopeguard.dto.AuditEventResponse;
import com.slopeguard.model.AuditEventType;
import com.slopeguard.service.AuditService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

/**
 * Controller providing administrative oversight of security and lifecycle audit records.
 * <p>
 * Security Policy:
 * Restricted strictly to users possessing the ADMIN role via Spring Security filter chain.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
public class AdminAuditController {

    private final AuditService auditService;

    public AdminAuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    /**
     * Queries administrative audit logs with optional filters (eventType, actorId, relatedReportId, date range)
     * and in-memory pagination.
     */
    @GetMapping
    public ResponseEntity<List<AuditEventResponse>> getAuditLogs(
            @RequestParam(required = false) AuditEventType eventType,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) Long relatedReportId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {

        List<AuditEventResponse> logs = auditService.getAuditLogs(
                eventType,
                actorId,
                relatedReportId,
                startDate,
                endDate,
                page,
                size
        );

        return ResponseEntity.ok(logs);
    }
}
