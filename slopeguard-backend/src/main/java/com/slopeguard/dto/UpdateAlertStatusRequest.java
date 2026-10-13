package com.slopeguard.dto;

import com.slopeguard.model.AlertLifecycleStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload for administrative adjudication of an early-warning alert's lifecycle status.
 */
public class UpdateAlertStatusRequest {

    @NotNull(message = "Target lifecycle status is required")
    private AlertLifecycleStatus status;

    @Size(max = 1000, message = "Admin review note cannot exceed 1000 characters")
    private String adminNote;

    public UpdateAlertStatusRequest() {
    }

    public UpdateAlertStatusRequest(AlertLifecycleStatus status, String adminNote) {
        this.status = status;
        this.adminNote = adminNote;
    }

    public AlertLifecycleStatus getStatus() {
        return status;
    }

    public void setStatus(AlertLifecycleStatus status) {
        this.status = status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public void setAdminNote(String adminNote) {
        this.adminNote = adminNote;
    }
}
