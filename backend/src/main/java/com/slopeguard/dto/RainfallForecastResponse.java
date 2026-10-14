package com.slopeguard.dto;

import java.time.Instant;
import java.util.List;

/**
 * Public response DTO representing hourly precipitation forecast projections
 * retrieved from the Open-Meteo environmental provider.
 */
public class RainfallForecastResponse {

    private String provider;
    private Double requestedLatitude;
    private Double requestedLongitude;
    private Double gridLatitude;
    private Double gridLongitude;
    private Double elevationMeters;
    private String forecastType;
    private String unit;
    private Instant retrievedAt;
    private String dataFreshness;
    private boolean sampleData;
    private String sourceAttribution;
    private String sourceDocumentation;
    private String disclaimer;
    private List<HourlyPrecipitationPoint> hourlyForecasts;

    public RainfallForecastResponse() {
    }

    public RainfallForecastResponse(String provider,
                                    Double requestedLatitude,
                                    Double requestedLongitude,
                                    Double gridLatitude,
                                    Double gridLongitude,
                                    Double elevationMeters,
                                    String forecastType,
                                    String unit,
                                    Instant retrievedAt,
                                    String dataFreshness,
                                    boolean sampleData,
                                    String sourceAttribution,
                                    String sourceDocumentation,
                                    String disclaimer,
                                    List<HourlyPrecipitationPoint> hourlyForecasts) {
        this.provider = provider;
        this.requestedLatitude = requestedLatitude;
        this.requestedLongitude = requestedLongitude;
        this.gridLatitude = gridLatitude;
        this.gridLongitude = gridLongitude;
        this.elevationMeters = elevationMeters;
        this.forecastType = forecastType;
        this.unit = unit;
        this.retrievedAt = retrievedAt;
        this.dataFreshness = dataFreshness;
        this.sampleData = sampleData;
        this.sourceAttribution = sourceAttribution;
        this.sourceDocumentation = sourceDocumentation;
        this.disclaimer = disclaimer;
        this.hourlyForecasts = hourlyForecasts;
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

    public String getForecastType() {
        return forecastType;
    }

    public void setForecastType(String forecastType) {
        this.forecastType = forecastType;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
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

    public List<HourlyPrecipitationPoint> getHourlyForecasts() {
        return hourlyForecasts;
    }

    public void setHourlyForecasts(List<HourlyPrecipitationPoint> hourlyForecasts) {
        this.hourlyForecasts = hourlyForecasts;
    }
}
