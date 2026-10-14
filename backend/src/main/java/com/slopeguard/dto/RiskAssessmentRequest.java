package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/**
 * Payload for requesting a comprehensive environmental landslide risk assessment.
 */
public class RiskAssessmentRequest {

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    /**
     * Optional slope angle in degrees if known from local surveying or high-resolution DEM.
     * If absent, risk assessment notes terrain slope as unavailable.
     */
    @DecimalMin(value = "0.0", message = "slope_deg must be >= 0.0")
    @DecimalMax(value = "90.0", message = "slope_deg must be <= 90.0")
    @JsonProperty("slope_deg")
    private Double slopeDeg;

    @JsonProperty("elevation_m")
    private Double elevationM;

    private String lithology;

    @JsonProperty("soil_type")
    private String soilType;

    public RiskAssessmentRequest() {
    }

    public RiskAssessmentRequest(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
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
}
