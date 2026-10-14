package com.slopeguard.service;

import com.slopeguard.dto.AlertPageResponse;
import com.slopeguard.model.AlertLifecycleStatus;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.EarlyWarningAlert;

import java.util.Optional;

/**
 * Service interface managing early-warning alerts and operational lifecycles.
 */
public interface AlertService {

    /**
     * Creates a new alert or returns an existing one if within the deduplication window.
     */
    EarlyWarningAlert createAlertIfEligible(EarlyWarningAlert newAlert);

    /**
     * Lists alerts with optional filtering and pagination.
     */
    AlertPageResponse getAlerts(AlertSeverity severity, AlertLifecycleStatus status, int page, int size);

    /**
     * Retrieves an alert by its unique identifier.
     */
    Optional<EarlyWarningAlert> getAlertById(String id);

    /**
     * Adjudicates alert lifecycle status with administrative audit notes.
     */
    EarlyWarningAlert updateAlertStatus(String id, AlertLifecycleStatus targetStatus, String adminNote, Long adminUserId);
}

