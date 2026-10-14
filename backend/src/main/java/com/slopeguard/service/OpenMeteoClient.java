package com.slopeguard.service;

import com.slopeguard.dto.OpenMeteoForecastResponse;

/**
 * HTTP client interface for communicating with the external Open-Meteo weather API.
 */
public interface OpenMeteoClient {

    /**
     * Queries Open-Meteo for atmospheric precipitation readings and forecasts at the given coordinates.
     *
     * @param latitude  validated latitude (-90 to 90)
     * @param longitude validated longitude (-180 to 180)
     * @return raw parsed OpenMeteoForecastResponse
     */
    OpenMeteoForecastResponse fetchForecast(double latitude, double longitude);
}
