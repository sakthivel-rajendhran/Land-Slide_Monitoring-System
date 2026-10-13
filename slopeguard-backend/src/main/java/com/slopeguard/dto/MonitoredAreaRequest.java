package com.slopeguard.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MonitoredAreaRequest {

    @NotBlank(message = "Area name is required")
    private String name;

    @NotBlank(message = "State or region is required")
    private String stateRegion;

    @NotBlank(message = "District is required")
    private String district;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    private String description;

    private String monitoringStatus = "ACTIVE";

    public MonitoredAreaRequest() {}

    public MonitoredAreaRequest(String name, String stateRegion, String district, Double latitude, Double longitude, String description) {
        this(name, stateRegion, district, latitude, longitude, description, "ACTIVE");
    }

    public MonitoredAreaRequest(String name, String stateRegion, String district, Double latitude, Double longitude, String description, String monitoringStatus) {
        this.name = name;
        this.stateRegion = stateRegion;
        this.district = district;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.monitoringStatus = monitoringStatus != null ? monitoringStatus : "ACTIVE";
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStateRegion() {
        return stateRegion;
    }

    public void setStateRegion(String stateRegion) {
        this.stateRegion = stateRegion;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMonitoringStatus() {
        return monitoringStatus;
    }

    public void setMonitoringStatus(String monitoringStatus) {
        this.monitoringStatus = monitoringStatus;
    }
}
