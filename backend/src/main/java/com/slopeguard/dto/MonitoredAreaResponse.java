package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class MonitoredAreaResponse {

    private Long id;
    private String name;

    @JsonProperty("state_region")
    private String stateRegion;

    private String district;
    private Double latitude;
    private Double longitude;
    private String description;

    @JsonProperty("monitoring_status")
    private String monitoringStatus;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    public MonitoredAreaResponse() {}

    public MonitoredAreaResponse(Long id, String name, String stateRegion, String district, Double latitude, Double longitude, String description, String monitoringStatus, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.stateRegion = stateRegion;
        this.district = district;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.monitoringStatus = monitoringStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @JsonProperty("active")
    public boolean isActive() {
        return "ACTIVE".equalsIgnoreCase(monitoringStatus);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
