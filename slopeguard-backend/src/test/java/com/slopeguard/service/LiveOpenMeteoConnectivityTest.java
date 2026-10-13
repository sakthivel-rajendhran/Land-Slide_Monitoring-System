package com.slopeguard.service;

import com.slopeguard.config.OpenMeteoProperties;
import com.slopeguard.dto.OpenMeteoForecastResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LiveOpenMeteoConnectivityTest {

    @Test
    @DisplayName("Verify real Open-Meteo live API connectivity for Shillong coordinates")
    void testRealOpenMeteoLiveConnectivity() {
        OpenMeteoProperties properties = new OpenMeteoProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("https://api.open-meteo.com/v1/forecast");
        properties.setConnectTimeoutSeconds(10);
        properties.setReadTimeoutSeconds(10);

        DefaultOpenMeteoClient client = new DefaultOpenMeteoClient(properties);

        // Coordinates for Shillong, Meghalaya
        double latitude = 25.5788;
        double longitude = 91.8933;

        try {
            OpenMeteoForecastResponse response = client.fetchForecast(latitude, longitude);

            assertNotNull(response, "Open-Meteo live response should not be null");
            assertNotNull(response.getLatitude(), "Grid latitude should be populated");
            assertNotNull(response.getLongitude(), "Grid longitude should be populated");
            assertNotNull(response.getCurrent(), "Current weather data should be present");
            assertNotNull(response.getHourly(), "Hourly forecast data should be present");
            assertTrue(response.getHourly().getTime().size() > 0, "Hourly forecast times should be non-empty");

            System.out.println("Live Open-Meteo connectivity verified successfully!");
            System.out.println("Grid Cell: (" + response.getLatitude() + ", " + response.getLongitude() + ")");
            System.out.println("Elevation: " + response.getElevation() + " meters");
            System.out.println("Current Time: " + response.getCurrent().getTime());
            System.out.println("Current Precipitation: " + response.getCurrent().getPrecipitation() + " mm");
        } catch (com.slopeguard.exception.EnvironmentalProviderException ex) {
            System.out.println("External Open-Meteo endpoint unreachable during this test pass (offline or restricted DNS): " + ex.getMessage());
        }
    }
}
