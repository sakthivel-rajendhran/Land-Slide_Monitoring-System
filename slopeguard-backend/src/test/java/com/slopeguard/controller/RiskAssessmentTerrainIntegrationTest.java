package com.slopeguard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slopeguard.dto.AiFeatureImportanceItem;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;
import com.slopeguard.dto.RainfallMeasurementResponse;
import com.slopeguard.dto.RiskAssessmentRequest;
import com.slopeguard.service.AiServiceClient;
import com.slopeguard.service.EnvironmentalDataService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RiskAssessmentTerrainIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EnvironmentalDataService environmentalDataService;

    @MockBean
    private AiServiceClient aiServiceClient;

    @Test
    @DisplayName("1. POST /api/risk-assessments automatically extracts slope from Copernicus DEM when slopeDeg omitted")
    void testAssessRiskAutomaticSlopeExtractionFromDem() throws Exception {
        double lat = 25.5788;
        double lon = 91.8933;

        RainfallMeasurementResponse rainResp = new RainfallMeasurementResponse();
        rainResp.setPrecipitation(95.0);
        rainResp.setUnit("mm");
        rainResp.setObservationTimestamp("2026-10-13T01:00:00Z");
        rainResp.setProvider("Open-Meteo");
        rainResp.setDataQuality("VERIFIED_NUMERICAL_WEATHER_MODEL");
        rainResp.setDataFreshness("FRESH");
        rainResp.setGridLatitude(25.55);
        rainResp.setGridLongitude(91.95);
        rainResp.setElevationMeters(1436.0);

        when(environmentalDataService.getCurrentRainfall(eq(lat), eq(lon))).thenReturn(rainResp);

        AiPredictionResponse aiResp = new AiPredictionResponse();
        aiResp.setPredictionStatus("DEMO_PREDICTION");
        aiResp.setModelVersion("0.1.0-prototype");
        aiResp.setModelStatus("DEMO_NOT_VALIDATED");
        aiResp.setRiskScore(0.72);
        aiResp.setRiskCategory("HIGH");
        aiResp.setIsProvisionalCategory(true);
        aiResp.setTopContributingFeatures(List.of(
                new AiFeatureImportanceItem("slope_deg", 0.18, "Extracted raster slope split")
        ));

        when(aiServiceClient.predict(any(AiPredictionRequest.class))).thenReturn(aiResp);

        // Request with NO slopeDeg provided - engine must extract it automatically from Copernicus DEM!
        RiskAssessmentRequest req = new RiskAssessmentRequest(lat, lon);

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_status").value("ASSESSED"))
                .andExpect(jsonPath("$.risk_score").value(0.72))
                .andExpect(jsonPath("$.risk_category").value("HIGH"))
                .andExpect(jsonPath("$.available_input_features.slope_deg.value").isNumber())
                .andExpect(jsonPath("$.available_input_features.slope_deg.provider", containsString("Copernicus DEM")))
                .andExpect(jsonPath("$.available_input_features.slope_deg.forecast_or_observed").value("RASTER_DERIVED"))
                .andExpect(jsonPath("$.distinction_notice", containsString("DISTINCTION NOTICE")));
    }

    @Test
    @DisplayName("2. POST /api/risk-assessments outside DEM coverage safely fails without fabricating missing slope")
    void testAssessRiskOutsideDemCoverageSafeFailure() throws Exception {
        // Location outside active DEM tile: 28.0°N, 95.0°E
        double lat = 28.0;
        double lon = 95.0;

        RainfallMeasurementResponse rainResp = new RainfallMeasurementResponse();
        rainResp.setPrecipitation(50.0);
        rainResp.setDataFreshness("FRESH");

        when(environmentalDataService.getCurrentRainfall(eq(lat), eq(lon))).thenReturn(rainResp);

        RiskAssessmentRequest req = new RiskAssessmentRequest(lat, lon);

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_status").value("UNAVAILABLE_MISSING_FEATURES"))
                .andExpect(jsonPath("$.risk_score").doesNotExist())
                .andExpect(jsonPath("$.unavailable_inputs", hasItem(containsString("Location falls outside active DEM raster coverage"))))
                .andExpect(jsonPath("$.warnings", hasItem(containsString("Topographic slope angle (slope_deg) is required"))));
    }
}
