package com.slopeguard.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Domain entity representing an environmental risk assessment execution.
 * Persisted in MySQL via Spring Data JPA.
 */
@Entity
@Table(name = "risk_assessments")
public class RiskAssessmentRecord {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "assessment_timestamp", nullable = false)
    private LocalDateTime assessmentTimestamp;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @Column(name = "model_status", nullable = false, length = 50)
    private String modelStatus;

    @Column(name = "risk_status", nullable = false, length = 50)
    private String riskStatus;

    @Column(name = "risk_score")
    private Double riskScore;

    @Column(name = "risk_category", length = 50)
    private String riskCategory;

    @Column(name = "is_provisional_category", nullable = false)
    private Boolean isProvisionalCategory = true;

    @Column(name = "data_freshness", length = 50)
    private String dataFreshness;

    @Column(name = "data_quality", length = 50)
    private String dataQuality;

    @Column(name = "observed_precipitation")
    private Double observedPrecipitation;

    @Column(name = "forecast_precipitation")
    private Double forecastPrecipitation;

    @Column(name = "slope_deg")
    private Double slopeDeg;

    @Column(name = "elevation_m")
    private Double elevationM;

    @Column(name = "lithology", length = 100)
    private String lithology;

    @Column(name = "soil_type", length = 100)
    private String soilType;

    @Column(name = "alert_triggered", nullable = false)
    private Boolean alertTriggered = false;

    @Column(name = "alert_id", length = 64)
    private String alertId;

    @Column(name = "provenance_json", columnDefinition = "TEXT")
    private String provenanceJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public RiskAssessmentRecord() {
        this.createdAt = LocalDateTime.now();
        this.assessmentTimestamp = LocalDateTime.now();
    }

    public RiskAssessmentRecord(String id, Double latitude, Double longitude, LocalDateTime assessmentTimestamp,
                                String modelVersion, String modelStatus, String riskStatus, Double riskScore,
                                String riskCategory, Boolean isProvisionalCategory, String dataFreshness,
                                String dataQuality, Double observedPrecipitation, Double forecastPrecipitation,
                                Double slopeDeg, Double elevationM, String lithology, String soilType,
                                Boolean alertTriggered, String alertId, String provenanceJson) {
        this.id = id;
        this.latitude = latitude;
        this.longitude = longitude;
        this.assessmentTimestamp = assessmentTimestamp != null ? assessmentTimestamp : LocalDateTime.now();
        this.modelVersion = modelVersion;
        this.modelStatus = modelStatus;
        this.riskStatus = riskStatus;
        this.riskScore = riskScore;
        this.riskCategory = riskCategory;
        this.isProvisionalCategory = isProvisionalCategory != null ? isProvisionalCategory : true;
        this.dataFreshness = dataFreshness;
        this.dataQuality = dataQuality;
        this.observedPrecipitation = observedPrecipitation;
        this.forecastPrecipitation = forecastPrecipitation;
        this.slopeDeg = slopeDeg;
        this.elevationM = elevationM;
        this.lithology = lithology;
        this.soilType = soilType;
        this.alertTriggered = alertTriggered != null ? alertTriggered : false;
        this.alertId = alertId;
        this.provenanceJson = provenanceJson;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.assessmentTimestamp == null) {
            this.assessmentTimestamp = LocalDateTime.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public LocalDateTime getAssessmentTimestamp() {
        return assessmentTimestamp;
    }

    public void setAssessmentTimestamp(LocalDateTime assessmentTimestamp) {
        this.assessmentTimestamp = assessmentTimestamp;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getModelStatus() {
        return modelStatus;
    }

    public void setModelStatus(String modelStatus) {
        this.modelStatus = modelStatus;
    }

    public String getRiskStatus() {
        return riskStatus;
    }

    public void setRiskStatus(String riskStatus) {
        this.riskStatus = riskStatus;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskCategory() {
        return riskCategory;
    }

    public void setRiskCategory(String riskCategory) {
        this.riskCategory = riskCategory;
    }

    public Boolean getIsProvisionalCategory() {
        return isProvisionalCategory;
    }

    public void setIsProvisionalCategory(Boolean isProvisionalCategory) {
        this.isProvisionalCategory = isProvisionalCategory;
    }

    public String getDataFreshness() {
        return dataFreshness;
    }

    public void setDataFreshness(String dataFreshness) {
        this.dataFreshness = dataFreshness;
    }

    public String getDataQuality() {
        return dataQuality;
    }

    public void setDataQuality(String dataQuality) {
        this.dataQuality = dataQuality;
    }

    public Double getObservedPrecipitation() {
        return observedPrecipitation;
    }

    public void setObservedPrecipitation(Double observedPrecipitation) {
        this.observedPrecipitation = observedPrecipitation;
    }

    public Double getForecastPrecipitation() {
        return forecastPrecipitation;
    }

    public void setForecastPrecipitation(Double forecastPrecipitation) {
        this.forecastPrecipitation = forecastPrecipitation;
    }

    public Double getSlopeDeg() {
        return slopeDeg;
    }

    public void setSlopeDeg(Double slopeDeg) {
        this.slopeDeg = slopeDeg;
    }

    public Double getElevationM() {
        return elevationM;
    }

    public void setElevationM(Double elevationM) {
        this.elevationM = elevationM;
    }

    public String getLithology() {
        return lithology;
    }

    public void setLithology(String lithology) {
        this.lithology = lithology;
    }

    public String getSoilType() {
        return soilType;
    }

    public void setSoilType(String soilType) {
        this.soilType = soilType;
    }

    public Boolean getAlertTriggered() {
        return alertTriggered;
    }

    public void setAlertTriggered(Boolean alertTriggered) {
        this.alertTriggered = alertTriggered;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public String getProvenanceJson() {
        return provenanceJson;
    }

    public void setProvenanceJson(String provenanceJson) {
        this.provenanceJson = provenanceJson;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
