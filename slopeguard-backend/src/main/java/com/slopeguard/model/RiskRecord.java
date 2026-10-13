package com.slopeguard.model;

import java.time.LocalDateTime;

/**
 * Domain model representing a landslide risk assessment record for a specific location.
 * <p>
 * In Phase 1, instances represent carefully identified sample records for Northeast India
 * hill regions. All records are explicitly flagged with sampleData=true to maintain scientific
 * integrity and transparency.
 */
public class RiskRecord {

    private Long id;
    private String locationName;
    private String state;
    private Double latitude;
    private Double longitude;
    private RiskCategory riskCategory;
    private Double riskScore; // 0.0 to 100.0
    private Double rainfallValue; // in millimeters (e.g. 24h cumulative rainfall)
    private LocalDateTime observationTimestamp;
    private String dataSource;
    private boolean sampleData;

    public RiskRecord() {
    }

    public RiskRecord(Long id, String locationName, String state, Double latitude, Double longitude,
                      RiskCategory riskCategory, Double riskScore, Double rainfallValue,
                      LocalDateTime observationTimestamp, String dataSource, boolean sampleData) {
        this.id = id;
        this.locationName = locationName;
        this.state = state;
        this.latitude = latitude;
        this.longitude = longitude;
        this.riskCategory = riskCategory;
        this.riskScore = riskScore;
        this.rainfallValue = rainfallValue;
        this.observationTimestamp = observationTimestamp;
        this.dataSource = dataSource;
        this.sampleData = sampleData;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public RiskCategory getRiskCategory() {
        return riskCategory;
    }

    public void setRiskCategory(RiskCategory riskCategory) {
        this.riskCategory = riskCategory;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public Double getRainfallValue() {
        return rainfallValue;
    }

    public void setRainfallValue(Double rainfallValue) {
        this.rainfallValue = rainfallValue;
    }

    public LocalDateTime getObservationTimestamp() {
        return observationTimestamp;
    }

    public void setObservationTimestamp(LocalDateTime observationTimestamp) {
        this.observationTimestamp = observationTimestamp;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public boolean isSampleData() {
        return sampleData;
    }

    public void setSampleData(boolean sampleData) {
        this.sampleData = sampleData;
    }

    @Override
    public String toString() {
        return "RiskRecord{" +
                "id=" + id +
                ", locationName='" + locationName + '\'' +
                ", state='" + state + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", riskCategory=" + riskCategory +
                ", riskScore=" + riskScore +
                ", rainfallValue=" + rainfallValue +
                ", observationTimestamp=" + observationTimestamp +
                ", dataSource='" + dataSource + '\'' +
                ", sampleData=" + sampleData +
                '}';
    }
}
