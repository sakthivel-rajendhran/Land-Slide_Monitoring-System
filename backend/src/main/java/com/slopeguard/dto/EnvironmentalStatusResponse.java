package com.slopeguard.dto;

import java.time.Instant;

/**
 * Public response DTO reporting the operational connectivity and health status
 * of the external environmental data integration.
 */
public class EnvironmentalStatusResponse {

    private String providerName;
    private boolean enabled;
    private Instant lastSuccessfulRetrieval;
    private Instant lastAttemptedRetrieval;
    private String latestFailureReason;
    private boolean usableDataAvailable;
    private boolean dataStale;
    private String attribution;
    private String documentation;

    public EnvironmentalStatusResponse() {
    }

    public EnvironmentalStatusResponse(String providerName,
                                       boolean enabled,
                                       Instant lastSuccessfulRetrieval,
                                       Instant lastAttemptedRetrieval,
                                       String latestFailureReason,
                                       boolean usableDataAvailable,
                                       boolean dataStale,
                                       String attribution,
                                       String documentation) {
        this.providerName = providerName;
        this.enabled = enabled;
        this.lastSuccessfulRetrieval = lastSuccessfulRetrieval;
        this.lastAttemptedRetrieval = lastAttemptedRetrieval;
        this.latestFailureReason = latestFailureReason;
        this.usableDataAvailable = usableDataAvailable;
        this.dataStale = dataStale;
        this.attribution = attribution;
        this.documentation = documentation;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public Instant getLastSuccessfulRetrieval() {
        return lastSuccessfulRetrieval;
    }

    public void setLastSuccessfulRetrieval(Instant lastSuccessfulRetrieval) {
        this.lastSuccessfulRetrieval = lastSuccessfulRetrieval;
    }

    public Instant getLastAttemptedRetrieval() {
        return lastAttemptedRetrieval;
    }

    public void setLastAttemptedRetrieval(Instant lastAttemptedRetrieval) {
        this.lastAttemptedRetrieval = lastAttemptedRetrieval;
    }

    public String getLatestFailureReason() {
        return latestFailureReason;
    }

    public void setLatestFailureReason(String latestFailureReason) {
        this.latestFailureReason = latestFailureReason;
    }

    public boolean isUsableDataAvailable() {
        return usableDataAvailable;
    }

    public void setUsableDataAvailable(boolean usableDataAvailable) {
        this.usableDataAvailable = usableDataAvailable;
    }

    public boolean isDataStale() {
        return dataStale;
    }

    public void setDataStale(boolean dataStale) {
        this.dataStale = dataStale;
    }

    public String getAttribution() {
        return attribution;
    }

    public void setAttribution(String attribution) {
        this.attribution = attribution;
    }

    public String getDocumentation() {
        return documentation;
    }

    public void setDocumentation(String documentation) {
        this.documentation = documentation;
    }
}
