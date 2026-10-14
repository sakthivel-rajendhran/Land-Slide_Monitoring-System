package com.slopeguard.model;

/**
 * Status lifecycle of a citizen incident report.
 * PENDING -> initial status upon submission
 * VERIFIED -> verified by response coordinator / admin review
 * REJECTED -> rejected as invalid or duplicate
 */
public enum ReportStatus {
    PENDING,
    UNDER_REVIEW,
    VERIFIED,
    REJECTED
}
