package com.slopeguard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slopeguard.dto.*;
import com.slopeguard.exception.AiServiceUnavailableException;
import com.slopeguard.exception.EnvironmentalProviderException;
import com.slopeguard.model.AlertLifecycleStatus;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.EarlyWarningAlert;
import com.slopeguard.model.User;
import com.slopeguard.service.AiServiceClient;
import com.slopeguard.service.AlertService;
import com.slopeguard.service.EnvironmentalDataService;
import com.slopeguard.service.JwtService;
import com.slopeguard.service.TerrainService;
import com.slopeguard.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RiskAssessmentAndAlertTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    @MockBean
    private EnvironmentalDataService environmentalDataService;

    @MockBean
    private AiServiceClient aiServiceClient;

    @MockBean
    private TerrainService terrainService;

    @Autowired
    private AlertService alertService;

    @Test
    @DisplayName("1. POST /api/risk-assessments with full features returns ASSESSED status with feature provenance")
    void testAssessRiskCompleteSuccess() throws Exception {
        RainfallMeasurementResponse rainResp = new RainfallMeasurementResponse();
        rainResp.setPrecipitation(115.0);
        rainResp.setUnit("mm");
        rainResp.setObservationTimestamp("2026-10-13T00:00:00Z");
        rainResp.setProvider("Open-Meteo");
        rainResp.setDataQuality("VERIFIED_NUMERICAL_WEATHER_MODEL");
        rainResp.setDataFreshness("FRESH");
        rainResp.setGridLatitude(25.55);
        rainResp.setGridLongitude(91.95);
        rainResp.setElevationMeters(1436.0);

        when(environmentalDataService.getCurrentRainfall(eq(25.5788), eq(91.8933))).thenReturn(rainResp);

        AiPredictionResponse aiResp = new AiPredictionResponse();
        aiResp.setPredictionStatus("DEMO_PREDICTION");
        aiResp.setModelVersion("0.1.0-prototype");
        aiResp.setModelStatus("DEMO_NOT_VALIDATED");
        aiResp.setRiskScore(0.85);
        aiResp.setRiskCategory("SEVERE");
        aiResp.setIsProvisionalCategory(true);
        aiResp.setTopContributingFeatures(List.of(
                new AiFeatureImportanceItem("slope_deg", 0.1847, "Slope gradient split")
        ));

        when(aiServiceClient.predict(any(AiPredictionRequest.class))).thenReturn(aiResp);

        RiskAssessmentRequest req = new RiskAssessmentRequest(25.5788, 91.8933);
        req.setSlopeDeg(42.0); // Required slope provided

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_status").value("ASSESSED"))
                .andExpect(jsonPath("$.model_status").value("DEMO_NOT_VALIDATED"))
                .andExpect(jsonPath("$.risk_score").value(0.85))
                .andExpect(jsonPath("$.risk_category").value("SEVERE"))
                .andExpect(jsonPath("$.available_input_features.observed_precipitation.value").value(115.0))
                .andExpect(jsonPath("$.available_input_features.slope_deg.value").value(42.0))
                .andExpect(jsonPath("$.distinction_notice", containsString("DISTINCTION NOTICE")))
                .andExpect(jsonPath("$.alert_triggered").value(true));
    }

    @Test
    @DisplayName("2. POST /api/risk-assessments without slope_deg returns UNAVAILABLE_MISSING_FEATURES without fabricating risk")
    void testAssessRiskMissingSlopeReturnsUnavailable() throws Exception {
        RainfallMeasurementResponse rainResp = new RainfallMeasurementResponse();
        rainResp.setPrecipitation(80.0);
        rainResp.setObservationTimestamp("2026-10-13T00:00:00Z");
        rainResp.setDataFreshness("FRESH");

        when(environmentalDataService.getCurrentRainfall(eq(25.5788), eq(91.8933))).thenReturn(rainResp);
        when(terrainService.getTerrainFeatures(eq(25.5788), eq(91.8933))).thenReturn(null);

        // Request with NO slopeDeg provided
        RiskAssessmentRequest req = new RiskAssessmentRequest(25.5788, 91.8933);

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_status").value("UNAVAILABLE_MISSING_FEATURES"))
                .andExpect(jsonPath("$.risk_score").doesNotExist())
                .andExpect(jsonPath("$.risk_category").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.unavailable_inputs", hasItem(containsString("slope_deg"))))
                .andExpect(jsonPath("$.warnings", hasItem(containsString("Topographic slope angle (slope_deg) is required"))));
    }

    @Test
    @DisplayName("3. POST /api/risk-assessments with invalid coordinates rejects with 400 Bad Request")
    void testAssessRiskRejectsInvalidCoordinates() throws Exception {
        RiskAssessmentRequest req = new RiskAssessmentRequest(95.0, 91.8933); // Lat > 90

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("4. POST /api/risk-assessments when AI service is down returns UNAVAILABLE_AI_OFFLINE without fallback score")
    void testAssessRiskAiOfflineReturnsUnavailable() throws Exception {
        RainfallMeasurementResponse rainResp = new RainfallMeasurementResponse();
        rainResp.setPrecipitation(60.0);
        rainResp.setDataFreshness("FRESH");

        when(environmentalDataService.getCurrentRainfall(eq(25.5788), eq(91.8933))).thenReturn(rainResp);
        when(aiServiceClient.predict(any(AiPredictionRequest.class)))
                .thenThrow(new AiServiceUnavailableException("Connection refused to AI service"));

        RiskAssessmentRequest req = new RiskAssessmentRequest(25.5788, 91.8933);
        req.setSlopeDeg(35.0);

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_status").value("UNAVAILABLE_AI_OFFLINE"))
                .andExpect(jsonPath("$.risk_score").doesNotExist())
                .andExpect(jsonPath("$.risk_category").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.warnings", hasItem(containsString("AI prediction microservice is currently unreachable"))));
    }

    @Test
    @DisplayName("5. POST /api/risk-assessments when weather provider fails returns UNAVAILABLE_ENVIRONMENTAL_OFFLINE")
    void testAssessRiskWeatherOfflineReturnsUnavailable() throws Exception {
        when(environmentalDataService.getCurrentRainfall(eq(25.5788), eq(91.8933)))
                .thenThrow(new EnvironmentalProviderException("Open-Meteo timeout"));

        RiskAssessmentRequest req = new RiskAssessmentRequest(25.5788, 91.8933);
        req.setSlopeDeg(35.0);

        mockMvc.perform(post("/api/risk-assessments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_status").value("UNAVAILABLE_ENVIRONMENTAL_OFFLINE"))
                .andExpect(jsonPath("$.risk_score").doesNotExist())
                .andExpect(jsonPath("$.risk_category").value("UNAVAILABLE"));
    }

    @Test
    @DisplayName("6. Alert deduplication suppresses duplicate alerts for identical proximity within window")
    void testAlertDeduplication() {
        LocalDateTime now = LocalDateTime.now();
        EarlyWarningAlert alert1 = new EarlyWarningAlert(
                null, "Deduplication Sector", 27.33, 88.61, AlertSeverity.CRITICAL,
                "DEMO_ASSESSMENT", "DEMO_EXPERIMENTAL", now, Map.of("score", 0.9), "Engine"
        );

        EarlyWarningAlert created1 = alertService.createAlertIfEligible(alert1);

        // Immediate duplicate candidate at virtually identical coordinate
        EarlyWarningAlert alert2 = new EarlyWarningAlert(
                null, "Deduplication Sector", 27.331, 88.611, AlertSeverity.CRITICAL,
                "DEMO_ASSESSMENT", "DEMO_EXPERIMENTAL", now, Map.of("score", 0.92), "Engine"
        );

        EarlyWarningAlert created2 = alertService.createAlertIfEligible(alert2);

        // Deduplication must return the identical existing alert ID
        org.junit.jupiter.api.Assertions.assertEquals(created1.getId(), created2.getId(),
                "Duplicate alert was erroneously created within deduplication window!");
    }

    @Test
    @DisplayName("7. GET /api/alerts public access returns paged alert list")
    void testGetAlertsPublic() throws Exception {
        mockMvc.perform(get("/api/alerts?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").isNumber());
    }

    @Test
    @DisplayName("8. GET /api/alerts/{id} returns specific alert or 404")
    void testGetAlertById() throws Exception {
        mockMvc.perform(get("/api/alerts/ALERT-1791830000-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("ALERT-1791830000-1"))
                .andExpect(jsonPath("$.severity").value("HIGH"));

        mockMvc.perform(get("/api/alerts/NON_EXISTENT_ALERT"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("9. PATCH /api/alerts/{id}/status denies unauthenticated caller with 401")
    void testUpdateAlertStatusUnauthenticated() throws Exception {
        UpdateAlertStatusRequest req = new UpdateAlertStatusRequest(AlertLifecycleStatus.ACKNOWLEDGED, "Field verified");

        mockMvc.perform(patch("/api/alerts/ALERT-1791830000-1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("10. PATCH /api/alerts/{id}/status denies citizen with 403 Forbidden")
    void testUpdateAlertStatusCitizenForbidden() throws Exception {
        User citizen = userService.registerCitizen(new com.slopeguard.dto.RegisterRequest(
                "Citizen Alert Tester",
                "citizen.alert.forbidden@example.org",
                "CitizenPass123!Test",
                null
        ));
        String citizenToken = jwtService.generateToken(citizen);
        UpdateAlertStatusRequest req = new UpdateAlertStatusRequest(AlertLifecycleStatus.ACKNOWLEDGED, "Citizen attempt");

        mockMvc.perform(patch("/api/alerts/ALERT-1791830000-1/status")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("11. PATCH /api/alerts/{id}/status allows administrator to adjudicate alert status (200 OK)")
    void testUpdateAlertStatusAdminSuccess() throws Exception {
        User admin = userService.provisionAdmin(
                "Admin Alert Tester",
                "admin.alert.authorized@slopeguard.gov.in",
                "AdminPassword123!Secure"
        );
        String adminToken = jwtService.generateToken(admin);
        UpdateAlertStatusRequest req = new UpdateAlertStatusRequest(AlertLifecycleStatus.ACKNOWLEDGED, "Disaster management notified");

        mockMvc.perform(patch("/api/alerts/ALERT-1791830000-1/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycleStatus").value("ACKNOWLEDGED"))
                .andExpect(jsonPath("$.adminReviewNote").value("Disaster management notified"));
    }

    @Test
    @DisplayName("12. GET /api/alerts with invalid page size (> 50) rejects with 400 Bad Request")
    void testGetAlertsInvalidPageSize() throws Exception {
        mockMvc.perform(get("/api/alerts?page=0&size=100"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Page size must be between 1 and 50")));
    }
}
