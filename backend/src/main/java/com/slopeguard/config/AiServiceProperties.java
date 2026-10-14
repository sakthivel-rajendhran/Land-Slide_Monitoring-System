package com.slopeguard.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for communicating with the Python AI microservice.
 */
@Component
@ConfigurationProperties(prefix = "slopeguard.ai-service")
public class AiServiceProperties {

    /**
     * Whether communication with the AI service is enabled.
     */
    private boolean enabled = true;

    /**
     * Base URL of the Python FastAPI prediction service.
     */
    private String baseUrl = "http://localhost:8000";

    /**
     * HTTP connect timeout in seconds.
     */
    private int connectTimeoutSeconds = 5;

    /**
     * HTTP read/response timeout in seconds.
     */
    private int readTimeoutSeconds = 5;

    public AiServiceProperties() {
    }

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
}
