package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Request payload sent to the SlopeGuard AI microservice for landslide risk prediction.
 */
public class AiPredictionRequest {

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    @NotNull(message = "rainfall_24h_mm is required")
    @PositiveOrZero(message = "rainfall_24h_mm must be >= 0.0")
    @JsonProperty("rainfall_24h_mm")
    private Double rainfall24hMm;

    @NotNull(message = "slope_deg is required")
    @DecimalMin(value = "0.0", message = "slope_deg must be >= 0.0")
    @DecimalMax(value = "90.0", message = "slope_deg must be <= 90.0")
    @JsonProperty("slope_deg")
    private Double slopeDeg;

    @PositiveOrZero(message = "rainfall_72h_mm must be >= 0.0")
    @JsonProperty("rainfall_72h_mm")
    private Double rainfall72hMm;

    @JsonProperty("elevation_m")
    private Double elevationM;

    @DecimalMin(value = "-1.0", message = "vegetation_ndvi must be >= -1.0")
    @DecimalMax(value = "1.0", message = "vegetation_ndvi must be <= 1.0")
    @JsonProperty("vegetation_ndvi")
    private Double vegetationNdvi;

    @DecimalMin(value = "0.0", message = "aspect_deg must be >= 0.0")
    @DecimalMax(value = "360.0", message = "aspect_deg must be <= 360.0")
    @JsonProperty("aspect_deg")
    private Double aspectDeg;

    private String lithology;

    @JsonProperty("soil_type")
    private String soilType;

    public AiPredictionRequest() {
    }

    public AiPredictionRequest(Double latitude, Double longitude, Double rainfall24hMm, Double slopeDeg) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.rainfall24hMm = rainfall24hMm;
        this.slopeDeg = slopeDeg;
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

    public Double getRainfall24hMm() {
        return rainfall24hMm;
    }

    public void setRainfall24hMm(Double rainfall24hMm) {
        this.rainfall24hMm = rainfall24hMm;
    }

    public Double getSlopeDeg() {
        return slopeDeg;
    }

    public void setSlopeDeg(Double slopeDeg) {
        this.slopeDeg = slopeDeg;
    }

    public Double getRainfall72hMm() {
        return rainfall72hMm;
    }

    public void setRainfall72hMm(Double rainfall72hMm) {
        this.rainfall72hMm = rainfall72hMm;
    }

    public Double getElevationM() {
        return elevationM;
    }

    public void setElevationM(Double elevationM) {
        this.elevationM = elevationM;
    }

    public Double getVegetationNdvi() {
        return vegetationNdvi;
    }

    public void setVegetationNdvi(Double vegetationNdvi) {
        this.vegetationNdvi = vegetationNdvi;
    }

    public Double getAspectDeg() {
        return aspectDeg;
    }

    public void setAspectDeg(Double aspectDeg) {
        this.aspectDeg = aspectDeg;
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
