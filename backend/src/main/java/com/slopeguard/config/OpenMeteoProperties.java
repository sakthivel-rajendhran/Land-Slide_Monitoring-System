package com.slopeguard.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration settings for the Open-Meteo environmental rainfall integration.
 */
@Component
@ConfigurationProperties(prefix = "slopeguard.environmental.open-meteo")
public class OpenMeteoProperties {

    /**
     * Whether the Open-Meteo external provider is enabled.
     */
    private boolean enabled = true;

    /**
     * Base URL for the Open-Meteo forecast API endpoint.
     */
    private String baseUrl = "https://api.open-meteo.com/v1/forecast";

    /**
     * Connection timeout in seconds.
     */
    private int connectTimeoutSeconds = 5;

    /**
     * Read / response timeout in seconds.
     */
    private int readTimeoutSeconds = 5;

    /**
     * In-memory cache time-to-live in minutes for grid-cell readings.
     */
    private int cacheTtlMinutes = 15;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getConnectTimeoutSeconds() {
        return connectTimeoutSeconds;
    }

    public void setConnectTimeoutSeconds(int connectTimeoutSeconds) {
        this.connectTimeoutSeconds = connectTimeoutSeconds;
    }

    public int getReadTimeoutSeconds() {
        return readTimeoutSeconds;
    }

    public void setReadTimeoutSeconds(int readTimeoutSeconds) {
        this.readTimeoutSeconds = readTimeoutSeconds;
    }

    public int getCacheTtlMinutes() {
        return cacheTtlMinutes;
    }

    public void setCacheTtlMinutes(int cacheTtlMinutes) {
        this.cacheTtlMinutes = cacheTtlMinutes;
    }
}
