package com.slopeguard.dto;

import java.time.Instant;

/**
 * Public response DTO representing current atmospheric precipitation estimates
 * retrieved from the Open-Meteo environmental provider.
 */
public class RainfallMeasurementResponse {

    private String provider;
    private Double requestedLatitude;
    private Double requestedLongitude;
    private Double gridLatitude;
    private Double gridLongitude;
    private Double elevationMeters;
    private String measurementType;
    private Double precipitation;
    private Double rain;
    private String unit;
    private String observationTimestamp;
    private Instant retrievedAt;
    private String dataFreshness;
    private String dataQuality;
    private boolean sampleData;
    private String sourceAttribution;
    private String sourceDocumentation;
    private String disclaimer;

    public RainfallMeasurementResponse() {
    }

    public RainfallMeasurementResponse(String provider,
                                       Double requestedLatitude,
                                       Double requestedLongitude,
                                       Double gridLatitude,
                                       Double gridLongitude,
                                       Double elevationMeters,
                                       String measurementType,
                                       Double precipitation,
                                       Double rain,
                                       String unit,
                                       String observationTimestamp,
                                       Instant retrievedAt,
                                       String dataFreshness,
                                       String dataQuality,
                                       boolean sampleData,
                                       String sourceAttribution,
                                       String sourceDocumentation,
                                       String disclaimer) {
        this.provider = provider;
        this.requestedLatitude = requestedLatitude;
        this.requestedLongitude = requestedLongitude;
        this.gridLatitude = gridLatitude;
        this.gridLongitude = gridLongitude;
        this.elevationMeters = elevationMeters;
        this.measurementType = measurementType;
        this.precipitation = precipitation;
        this.rain = rain;
        this.unit = unit;
        this.observationTimestamp = observationTimestamp;
        this.retrievedAt = retrievedAt;
        this.dataFreshness = dataFreshness;
        this.dataQuality = dataQuality;
        this.sampleData = sampleData;
        this.sourceAttribution = sourceAttribution;
        this.sourceDocumentation = sourceDocumentation;
        this.disclaimer = disclaimer;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public Double getRequestedLatitude() {
        return requestedLatitude;
    }

    public void setRequestedLatitude(Double requestedLatitude) {
        this.requestedLatitude = requestedLatitude;
    }

    public Double getRequestedLongitude() {
        return requestedLongitude;
    }

    public void setRequestedLongitude(Double requestedLongitude) {
        this.requestedLongitude = requestedLongitude;
    }

    public Double getGridLatitude() {
        return gridLatitude;
    }

    public void setGridLatitude(Double gridLatitude) {
        this.gridLatitude = gridLatitude;
    }

    public Double getGridLongitude() {
        return gridLongitude;
    }

    public void setGridLongitude(Double gridLongitude) {
        this.gridLongitude = gridLongitude;
    }

    public Double getElevationMeters() {
        return elevationMeters;
    }

    public void setElevationMeters(Double elevationMeters) {
        this.elevationMeters = elevationMeters;
    }

    public String getMeasurementType() {
        return measurementType;
    }

    public void setMeasurementType(String measurementType) {
        this.measurementType = measurementType;
    }

    public Double getPrecipitation() {
        return precipitation;
    }

    public void setPrecipitation(Double precipitation) {
        this.precipitation = precipitation;
    }

    public Double getRain() {
        return rain;
    }

    public void setRain(Double rain) {
        this.rain = rain;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getObservationTimestamp() {
        return observationTimestamp;
    }

    public void setObservationTimestamp(String observationTimestamp) {
        this.observationTimestamp = observationTimestamp;
    }

    public Instant getRetrievedAt() {
        return retrievedAt;
    }

    public void setRetrievedAt(Instant retrievedAt) {
        this.retrievedAt = retrievedAt;
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

    public boolean isSampleData() {
        return sampleData;
    }

    public void setSampleData(boolean sampleData) {
        this.sampleData = sampleData;
    }

    public String getSourceAttribution() {
        return sourceAttribution;
    }

    public void setSourceAttribution(String sourceAttribution) {
        this.sourceAttribution = sourceAttribution;
    }

    public String getSourceDocumentation() {
        return sourceDocumentation;
    }

    public void setSourceDocumentation(String sourceDocumentation) {
        this.sourceDocumentation = sourceDocumentation;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}
