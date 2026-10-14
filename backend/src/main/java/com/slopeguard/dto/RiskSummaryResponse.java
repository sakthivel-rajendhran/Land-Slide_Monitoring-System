package com.slopeguard.dto;

import com.slopeguard.model.RiskCategory;

import java.util.Map;

/**
 * Summary statistics of landslide risk monitoring across Northeast India regions.
 */
public class RiskSummaryResponse {

    private int totalMonitoredLocations;
    private Map<RiskCategory, Long> categoryCounts;
    private String highestRiskLocation;
    private Double highestRiskScore;
    private boolean sampleData;
    private String note;

    public RiskSummaryResponse() {
    }

    public RiskSummaryResponse(int totalMonitoredLocations, Map<RiskCategory, Long> categoryCounts,
                               String highestRiskLocation, Double highestRiskScore,
                               boolean sampleData, String note) {
        this.totalMonitoredLocations = totalMonitoredLocations;
        this.categoryCounts = categoryCounts;
        this.highestRiskLocation = highestRiskLocation;
        this.highestRiskScore = highestRiskScore;
        this.sampleData = sampleData;
        this.note = note;
    }

    public int getTotalMonitoredLocations() {
        return totalMonitoredLocations;
    }

    public void setTotalMonitoredLocations(int totalMonitoredLocations) {
        this.totalMonitoredLocations = totalMonitoredLocations;
    }

    public Map<RiskCategory, Long> getCategoryCounts() {
        return categoryCounts;
    }

    public void setCategoryCounts(Map<RiskCategory, Long> categoryCounts) {
        this.categoryCounts = categoryCounts;
    }

    public String getHighestRiskLocation() {
        return highestRiskLocation;
    }

    public void setHighestRiskLocation(String highestRiskLocation) {
        this.highestRiskLocation = highestRiskLocation;
    }

    public Double getHighestRiskScore() {
        return highestRiskScore;
    }

    public void setHighestRiskScore(Double highestRiskScore) {
        this.highestRiskScore = highestRiskScore;
    }

    public boolean isSampleData() {
        return sampleData;
    }

    public void setSampleData(boolean sampleData) {
        this.sampleData = sampleData;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
