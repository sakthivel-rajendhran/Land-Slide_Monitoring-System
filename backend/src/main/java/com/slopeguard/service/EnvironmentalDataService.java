package com.slopeguard.service;

import com.slopeguard.dto.EnvironmentalStatusResponse;
import com.slopeguard.dto.RainfallForecastResponse;
import com.slopeguard.dto.RainfallMeasurementResponse;

/**
 * Service contract for environmental data queries, caching, and provider health monitoring.
 */
public interface EnvironmentalDataService {

    /**
     * Retrieves the current precipitation measurement estimate for the requested coordinates.
     */
    RainfallMeasurementResponse getCurrentRainfall(double latitude, double longitude);

    /**
     * Retrieves the hourly rainfall forecast projection for the requested coordinates.
     */
    RainfallForecastResponse getRainfallForecast(double latitude, double longitude);

    /**
     * Inspects operational status and connectivity metrics of the environmental provider.
     */
    EnvironmentalStatusResponse getProviderStatus();
}
