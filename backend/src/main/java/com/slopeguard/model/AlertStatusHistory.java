package com.slopeguard.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

/**
 * Domain entity recording append-only status transitions for early-warning alerts.
 * Persisted in MySQL via Spring Data JPA.
 */
@Entity
@Table(name = "alert_status_history")
public class AlertStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false, length = 64)
    private String alertId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "previous_status", length = 30)
    private AlertLifecycleStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "new_status", nullable = false, length = 30)
    private AlertLifecycleStatus newStatus;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "actor_email", length = 255)
    private String actorEmail;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "transition_timestamp", nullable = false)
    private LocalDateTime transitionTimestamp;

    public AlertStatusHistory() {
        this.transitionTimestamp = LocalDateTime.now();
    }

    public AlertStatusHistory(String alertId, AlertLifecycleStatus previousStatus, AlertLifecycleStatus newStatus,
                              Long actorUserId, String actorEmail, String reason) {
        this.alertId = alertId;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.actorUserId = actorUserId;
        this.actorEmail = actorEmail;
        this.reason = reason;
        this.transitionTimestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.transitionTimestamp == null) {
            this.transitionTimestamp = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public AlertLifecycleStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(AlertLifecycleStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public AlertLifecycleStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(AlertLifecycleStatus newStatus) {
        this.newStatus = newStatus;
    }

    public Long getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(Long actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public LocalDateTime getTransitionTimestamp() {
        return transitionTimestamp;
    }

    public void setTransitionTimestamp(LocalDateTime transitionTimestamp) {
        this.transitionTimestamp = transitionTimestamp;
    }
}
