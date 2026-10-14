package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Metadata capturing the origin, timestamp, units, and quality of an individual feature.
 */
public class FeatureProvenanceInfo {

    @JsonProperty("feature_name")
    private String featureName;

    private Object value;
    private String unit;
    private String timestamp;
    private String provider;
    private String quality;

    @JsonProperty("forecast_or_observed")
    private String forecastOrObserved; // "OBSERVED", "FORECAST", "TOPOGRAPHIC_MODEL", "CLIENT_SUPPLIED"

    public FeatureProvenanceInfo() {
    }

    public FeatureProvenanceInfo(String featureName, Object value, String unit, String timestamp,
                                 String provider, String quality, String forecastOrObserved) {
        this.featureName = featureName;
        this.value = value;
        this.unit = unit;
        this.timestamp = timestamp;
        this.provider = provider;
        this.quality = quality;
        this.forecastOrObserved = forecastOrObserved;
    }

    public String getFeatureName() {
        return featureName;
    }

    public void setFeatureName(String featureName) {
        this.featureName = featureName;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getQuality() {
        return quality;
    }

    public void setQuality(String quality) {
        this.quality = quality;
    }

    public String getForecastOrObserved() {
        return forecastOrObserved;
    }

    public void setForecastOrObserved(String forecastOrObserved) {
        this.forecastOrObserved = forecastOrObserved;
    }
}
