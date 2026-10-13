package com.slopeguard.controller;

import com.slopeguard.config.OpenMeteoProperties;
import com.slopeguard.dto.OpenMeteoForecastResponse;
import com.slopeguard.exception.EnvironmentalProviderException;
import com.slopeguard.service.OpenMeteoClient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EnvironmentalRainfallTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OpenMeteoProperties properties;

    @MockBean
    private OpenMeteoClient openMeteoClient;

    private OpenMeteoForecastResponse createMockForecastResponse(Double precip, Double rain) {
        OpenMeteoForecastResponse response = new OpenMeteoForecastResponse();
        response.setLatitude(25.5536);
        response.setLongitude(91.9544);
        response.setElevation(1436.0);
        response.setTimezone("Asia/Kolkata");
        response.setCurrentUnits(Map.of("precipitation", "mm", "rain", "mm"));

        OpenMeteoForecastResponse.CurrentData current = new OpenMeteoForecastResponse.CurrentData();
        current.setTime("2026-10-12T23:45");
        current.setInterval(900);
        current.setPrecipitation(precip);
        current.setRain(rain);
        response.setCurrent(current);

        OpenMeteoForecastResponse.HourlyData hourly = new OpenMeteoForecastResponse.HourlyData();
        hourly.setTime(List.of("2026-10-12T00:00", "2026-10-12T01:00", "2026-10-12T02:00"));
        hourly.setPrecipitation(List.of(0.0, 0.4, 1.2));
        hourly.setRain(List.of(0.0, 0.2, 1.0));
        response.setHourly(hourly);

        return response;
    }

    // 1. Valid coordinate requests return current rainfall measurements
    @Test
    @DisplayName("1. GET /api/environmental/rainfall with valid coordinates returns structured measurement")
    void getCurrentRainfall_whenValidCoordinates_shouldReturnMeasurement() throws Exception {
        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble()))
                .thenReturn(createMockForecastResponse(1.5, 1.2));

        mockMvc.perform(get("/api/environmental/rainfall")
                        .param("latitude", "25.5788")
                        .param("longitude", "91.8933")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider", is("Open-Meteo")))
                .andExpect(jsonPath("$.requestedLatitude", is(25.5788)))
                .andExpect(jsonPath("$.requestedLongitude", is(91.8933)))
                .andExpect(jsonPath("$.gridLatitude", is(25.5536)))
                .andExpect(jsonPath("$.gridLongitude", is(91.9544)))
                .andExpect(jsonPath("$.elevationMeters", is(1436.0)))
                .andExpect(jsonPath("$.measurementType", is("CURRENT_MODEL_ESTIMATE")))
                .andExpect(jsonPath("$.precipitation", is(1.5)))
                .andExpect(jsonPath("$.rain", is(1.2)))
                .andExpect(jsonPath("$.unit", is("mm")))
                .andExpect(jsonPath("$.observationTimestamp", is("2026-10-12T23:45")))
                .andExpect(jsonPath("$.retrievedAt", notNullValue()))
                .andExpect(jsonPath("$.dataFreshness", notNullValue()))
                .andExpect(jsonPath("$.dataQuality", is("VALIDATED")))
                .andExpect(jsonPath("$.sampleData", is(false)))
                .andExpect(jsonPath("$.sourceAttribution", containsString("Open-Meteo")))
                .andExpect(jsonPath("$.disclaimer", containsString("Weather-model estimate")));
    }

    // 2. Invalid coordinate rejection
    @Test
    @DisplayName("2. GET /api/environmental/rainfall rejects invalid coordinates with 400 Bad Request")
    void getCurrentRainfall_whenInvalidCoordinates_shouldReturn400() throws Exception {
        // Latitude out of bounds (> 90)
        mockMvc.perform(get("/api/environmental/rainfall")
                        .param("latitude", "95.0")
                        .param("longitude", "91.8933")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));

        // Longitude out of bounds (< -180)
        mockMvc.perform(get("/api/environmental/rainfall")
                        .param("latitude", "25.5788")
                        .param("longitude", "-190.0")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));

        // Missing coordinates
        mockMvc.perform(get("/api/environmental/rainfall")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    // 3. Hourly forecast endpoint distinct from current measurement
    @Test
    @DisplayName("3. GET /api/environmental/rainfall/forecast returns hourly projections distinct from current data")
    void getRainfallForecast_whenValid_shouldReturnHourlyProjection() throws Exception {
        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble()))
                .thenReturn(createMockForecastResponse(0.0, 0.0));

        mockMvc.perform(get("/api/environmental/rainfall/forecast")
                        .param("latitude", "25.5788")
                        .param("longitude", "91.8933")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider", is("Open-Meteo")))
                .andExpect(jsonPath("$.forecastType", is("HOURLY_FORECAST")))
                .andExpect(jsonPath("$.unit", is("mm")))
                .andExpect(jsonPath("$.sampleData", is(false)))
                .andExpect(jsonPath("$.hourlyForecasts", hasSize(3)))
                .andExpect(jsonPath("$.hourlyForecasts[0].timestamp", is("2026-10-12T00:00")))
                .andExpect(jsonPath("$.hourlyForecasts[0].precipitation", is(0.0)))
                .andExpect(jsonPath("$.hourlyForecasts[1].precipitation", is(0.4)))
                .andExpect(jsonPath("$.hourlyForecasts[2].precipitation", is(1.2)));
    }

    // 4. Null and missing precipitation values preservation
    @Test
    @DisplayName("4. Null precipitation values are preserved as null instead of replacing with zero")
    void getCurrentRainfall_whenNullPrecipitation_shouldPreserveNull() throws Exception {
        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble()))
                .thenReturn(createMockForecastResponse(null, null));

        mockMvc.perform(get("/api/environmental/rainfall")
                        .param("latitude", "26.1234")
                        .param("longitude", "92.5678")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precipitation", nullValue()))
                .andExpect(jsonPath("$.rain", nullValue()))
                .andExpect(jsonPath("$.dataQuality", is("INCOMPLETE_DATA")));
    }

    // 5. Provider HTTP error handling (502 Bad Gateway)
    @Test
    @DisplayName("5. External provider error maps to 502 Bad Gateway without leaking internal details")
    void getCurrentRainfall_whenProviderError_shouldReturn502() throws Exception {
        when(openMeteoClient.fetchForecast(anyDouble(), anyDouble()))
                .thenThrow(new EnvironmentalProviderException("Open-Meteo API returned error status: 500"));

        mockMvc.perform(get("/api/environmental/rainfall")
                        .param("latitude", "27.3389")
                        .param("longitude", "88.6065")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status", is(502)))
                .andExpect(jsonPath("$.error", is("Bad Gateway")))
                .andExpect(jsonPath("$.message", containsString("External environmental data provider (Open-Meteo)")));
    }

    // 6. Provider status reporting
    @Test
    @DisplayName("6. GET /api/environmental/status reports operational status without live network calls")
    void getEnvironmentalStatus_shouldReportStatus() throws Exception {
        mockMvc.perform(get("/api/environmental/status")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.providerName", is("Open-Meteo")))
                .andExpect(jsonPath("$.enabled", is(true)))
                .andExpect(jsonPath("$.attribution", containsString("Open-Meteo")))
                .andExpect(jsonPath("$.documentation", containsString("open-meteo.com")));
    }

    // 7. Disabled provider behavior (503 Service Unavailable)
    @Test
    @DisplayName("7. Disabled provider returns 503 Service Unavailable")
    void getCurrentRainfall_whenDisabled_shouldReturn503() throws Exception {
        properties.setEnabled(false);
        try {
            mockMvc.perform(get("/api/environmental/rainfall")
                            .param("latitude", "25.5788")
                            .param("longitude", "91.8933")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isServiceUnavailable())
                    .andExpect(jsonPath("$.status", is(503)))
                    .andExpect(jsonPath("$.error", is("Service Unavailable")));
        } finally {
            properties.setEnabled(true);
        }
    }
}
