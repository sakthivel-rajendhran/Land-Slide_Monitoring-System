package com.slopeguard.service;

import com.slopeguard.dto.AlertPageResponse;
import com.slopeguard.exception.ResourceNotFoundException;
import com.slopeguard.model.AlertLifecycleStatus;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.AlertStatusHistory;
import com.slopeguard.model.EarlyWarningAlert;
import com.slopeguard.repository.AlertStatusHistoryRepository;
import com.slopeguard.repository.EarlyWarningAlertRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Production MySQL-backed implementation of {@link AlertService}.
 * Manages early warning hazard alerts and transactional status transitions with append-only history.
 */
@Service
@Primary
public class JpaAlertService implements AlertService {

    private static final Logger log = LoggerFactory.getLogger(JpaAlertService.class);

    private final EarlyWarningAlertRepository alertRepository;
    private final AlertStatusHistoryRepository historyRepository;
    private final AtomicLong alertCounter = new AtomicLong(100);

    @Value("${slopeguard.alerts.deduplication-interval-minutes:60}")
    private long deduplicationIntervalMinutes = 60;

    public JpaAlertService(EarlyWarningAlertRepository alertRepository,
                           AlertStatusHistoryRepository historyRepository) {
        this.alertRepository = alertRepository;
        this.historyRepository = historyRepository;
    }

    @PostConstruct
    @Transactional
    public void init() {
        if (alertRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            EarlyWarningAlert sampleAlert = new EarlyWarningAlert(
                    "ALERT-1791830000-1",
                    "Shillong East Slope (Mawkhar)",
                    25.5788,
                    91.8933,
                    AlertSeverity.HIGH,
                    "DEMO_ASSESSMENT",
                    "DEMO_EXPERIMENTAL",
                    now.minusMinutes(45),
                    Map.of("rainfall24hMm", 110.0, "slopeDeg", 42.0, "riskScore", 0.82),
                    "SlopeGuard Risk Assessment Engine v7.0"
            );
            alertRepository.save(sampleAlert);
            log.info("Seeded initial demonstration alert: {}", sampleAlert.getId());
        }
    }

    @Override
    @Transactional
    public synchronized EarlyWarningAlert createAlertIfEligible(EarlyWarningAlert newAlert) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusMinutes(deduplicationIntervalMinutes);

        // Deduplication check: active alert of same severity within ~500m (0.005 deg)
        double minLat = newAlert.getLatitude() - 0.005;
        double maxLat = newAlert.getLatitude() + 0.005;
        double minLon = newAlert.getLongitude() - 0.005;
        double maxLon = newAlert.getLongitude() + 0.005;

        List<EarlyWarningAlert> candidates = alertRepository.findActiveInProximity(
                AlertLifecycleStatus.ACTIVE,
                newAlert.getSeverity(),
                minLat,
                maxLat,
                minLon,
                maxLon,
                windowStart
        );

        if (!candidates.isEmpty()) {
            EarlyWarningAlert existing = candidates.get(0);
            log.info("Deduplication matched: alert {} already active at ({}, {}). Suppressing duplicate.",
                    existing.getId(), existing.getLatitude(), existing.getLongitude());
            existing.setEvidence(newAlert.getEvidence());
            existing.setUpdatedAt(now);
            return alertRepository.save(existing);
        }

        // Generate unique alert ID
        String id = "ALERT-" + System.currentTimeMillis() + "-" + alertCounter.incrementAndGet();
        newAlert.setId(id);
        newAlert.setCreationTimestamp(now);
        newAlert.setUpdatedAt(now);
        newAlert.setLifecycleStatus(AlertLifecycleStatus.ACTIVE);

        EarlyWarningAlert saved = alertRepository.save(newAlert);

        // Record initial history record
        AlertStatusHistory initialHistory = new AlertStatusHistory(
                saved.getId(),
                null,
                AlertLifecycleStatus.ACTIVE,
                null,
                "SYSTEM",
                "Initial early warning hazard alert generated"
        );
        historyRepository.save(initialHistory);

        log.info("Registered new early-warning alert: id={}, location=({}, {}), severity={}",
                saved.getId(), saved.getLatitude(), saved.getLongitude(), saved.getSeverity());

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public AlertPageResponse getAlerts(AlertSeverity severity, AlertLifecycleStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "creationTimestamp"));
        Page<EarlyWarningAlert> alertPage = alertRepository.findByFilters(severity, status, pageable);

        return new AlertPageResponse(
                alertPage.getContent(),
                (int) alertPage.getTotalElements(),
                page,
                size,
                alertPage.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EarlyWarningAlert> getAlertById(String id) {
        return alertRepository.findById(id);
    }

    @Override
    @Transactional
    public EarlyWarningAlert updateAlertStatus(String id, AlertLifecycleStatus targetStatus, String adminNote, Long adminUserId) {
        EarlyWarningAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert record with ID '" + id + "' was not found."));

        AlertLifecycleStatus previousStatus = alert.getLifecycleStatus();
        LocalDateTime now = LocalDateTime.now();

        alert.setLifecycleStatus(targetStatus);
        alert.setUpdatedAt(now);
        if (adminNote != null && !adminNote.isBlank()) {
            alert.setAdminReviewNote(adminNote);
        }
        if (adminUserId != null) {
            alert.setAcknowledgedByUserId(adminUserId);
        }

        EarlyWarningAlert updated = alertRepository.save(alert);

        // Append to history table in the same transaction
        AlertStatusHistory history = new AlertStatusHistory(
                id,
                previousStatus,
                targetStatus,
                adminUserId,
                null,
                adminNote
        );
        historyRepository.save(history);

        log.info("Alert {} status updated from {} to {} by admin user {}", id, previousStatus, targetStatus, adminUserId);
        return updated;
    }

    public void setDeduplicationIntervalMinutes(long minutes) {
        this.deduplicationIntervalMinutes = minutes;
    }
}
