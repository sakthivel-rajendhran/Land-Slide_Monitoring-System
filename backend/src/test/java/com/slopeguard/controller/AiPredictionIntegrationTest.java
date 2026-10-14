package com.slopeguard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slopeguard.config.AiServiceProperties;
import com.slopeguard.dto.AiModelStatusResponse;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;
import com.slopeguard.dto.RainfallMeasurementResponse;
import com.slopeguard.service.AiServiceClient;
import com.slopeguard.service.DefaultAiServiceClient;
import com.slopeguard.service.EnvironmentalDataService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AiPredictionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiServiceClient aiServiceClient;

    @MockBean
    private EnvironmentalDataService environmentalDataService;

    @Test
    @DisplayName("1. POST /api/risks/predict with valid features returns structured prediction response")
    void testPredictWithValidFeatures() throws Exception {
        AiPredictionResponse mockResponse = new AiPredictionResponse();
        mockResponse.setPredictionStatus("DEMO_PREDICTION");
        mockResponse.setModelVersion("0.1.0-prototype");
        mockResponse.setModelStatus("DEMO_NOT_VALIDATED");
        mockResponse.setRiskScore(0.82);
        mockResponse.setRiskCategory("SEVERE");
        mockResponse.setIsProvisionalCategory(true);
        mockResponse.setWarnings(List.of("Model trained on synthetic demonstration fixtures only."));
        mockResponse.setDisclaimer("EXPERIMENTAL PROTOTYPE: Not certified for disaster warnings.");

        when(aiServiceClient.predict(any(AiPredictionRequest.class))).thenReturn(mockResponse);

        AiPredictionRequest req = new AiPredictionRequest();
        req.setLatitude(25.5788);
        req.setLongitude(91.8933);
        req.setRainfall24hMm(100.0);
        req.setSlopeDeg(40.0);
        req.setRainfall72hMm(200.0);

        mockMvc.perform(post("/api/risks/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.prediction_status").value("DEMO_PREDICTION"))
                .andExpect(jsonPath("$.model_status").value("DEMO_NOT_VALIDATED"))
                .andExpect(jsonPath("$.risk_score").value(0.82))
                .andExpect(jsonPath("$.risk_category").value("SEVERE"))
                .andExpect(jsonPath("$.is_provisional_category").value(true))
                .andExpect(jsonPath("$.disclaimer", containsString("EXPERIMENTAL PROTOTYPE")));
    }

    @Test
    @DisplayName("2. POST /api/risks/predict rejects out-of-bounds coordinates with 400 Bad Request")
    void testPredictRejectsInvalidCoordinates() throws Exception {
        AiPredictionRequest req = new AiPredictionRequest();
        req.setLatitude(95.0); // Invalid > 90
        req.setLongitude(91.8933);
        req.setRainfall24hMm(50.0);
        req.setSlopeDeg(30.0);

        mockMvc.perform(post("/api/risks/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("3. POST /api/risks/predict rejects inconsistent precipitation (72h < 24h) with 400 Bad Request")
    void testPredictRejectsInconsistentRainfall() throws Exception {
        AiPredictionRequest req = new AiPredictionRequest();
        req.setLatitude(25.5788);
        req.setLongitude(91.8933);
        req.setRainfall24hMm(100.0);
        req.setRainfall72hMm(20.0); // Physically impossible
        req.setSlopeDeg(30.0);

        mockMvc.perform(post("/api/risks/predict")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot be less than rainfall_24h_mm")));
    }

    @Test
    @DisplayName("4. GET /api/risks/model-status propagates model status and governance flags")
    void testGetModelStatus() throws Exception {
        AiModelStatusResponse mockStatus = new AiModelStatusResponse();
        mockStatus.setServiceStatus("ready");
        mockStatus.setModelVersion("0.1.0-prototype");
        mockStatus.setModelStatus("DEMO_NOT_VALIDATED");
        mockStatus.setArtifactLoaded(true);
        mockStatus.setTrainingDatasetType("SYNTHETIC_FIXTURES");
        mockStatus.setOutputType("UNCALIBRATED_HAZARD_SCORE");
        mockStatus.setCalibrationStatus("CALIBRATION_DEFERRED");
        mockStatus.setThresholdSetVersion("1.0.0-candidate");
        mockStatus.setThresholdReviewStatus("PENDING_EXPERT_REVIEW");
        mockStatus.setDisclaimer("EXPERIMENTAL PROTOTYPE");

        when(aiServiceClient.getModelStatus()).thenReturn(mockStatus);

        mockMvc.perform(get("/api/risks/model-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service_status").value("ready"))
                .andExpect(jsonPath("$.model_status").value("DEMO_NOT_VALIDATED"))
                .andExpect(jsonPath("$.output_type").value("UNCALIBRATED_HAZARD_SCORE"))
                .andExpect(jsonPath("$.calibration_status").value("CALIBRATION_DEFERRED"))
                .andExpect(jsonPath("$.threshold_set_version").value("1.0.0-candidate"))
                .andExpect(jsonPath("$.threshold_review_status").value("PENDING_EXPERT_REVIEW"))
                .andExpect(jsonPath("$.artifact_loaded").value(true));
    }

    @Test
    @DisplayName("5. POST /api/risks/predict/live combines Open-Meteo rainfall and terrain inputs")
    void testPredictLiveRisk() throws Exception {
        RainfallMeasurementResponse rainResp = new RainfallMeasurementResponse();
        rainResp.setPrecipitation(75.0);
        rainResp.setElevationMeters(1450.0);

        when(environmentalDataService.getCurrentRainfall(eq(25.5788), eq(91.8933))).thenReturn(rainResp);

        AiPredictionResponse mockPred = new AiPredictionResponse();
        mockPred.setPredictionStatus("DEMO_PREDICTION");
        mockPred.setRiskScore(0.72);
        mockPred.setRiskCategory("HIGH");

        when(aiServiceClient.predict(any(AiPredictionRequest.class))).thenReturn(mockPred);

        mockMvc.perform(post("/api/risks/predict/live")
                        .param("latitude", "25.5788")
                        .param("longitude", "91.8933")
                        .param("slopeDeg", "38.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.risk_score").value(0.72))
                .andExpect(jsonPath("$.risk_category").value("HIGH"));
    }

    @Test
    @DisplayName("6. DefaultAiServiceClient handles AI service downtime with 503 / exception mapping")
    void testClientHandlesServiceDown() {
        RestClient.Builder builder = RestClient.builder().baseUrl("http://localhost:8000");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();

        AiServiceProperties props = new AiServiceProperties();
        props.setEnabled(true);
        props.setBaseUrl("http://localhost:8000");

        DefaultAiServiceClient client = new DefaultAiServiceClient(props, restClient);

        server.expect(requestTo("http://localhost:8000/predict"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        AiPredictionRequest req = new AiPredictionRequest(25.5788, 91.8933, 50.0, 30.0);

        org.junit.jupiter.api.Assertions.assertThrows(
                com.slopeguard.exception.AiServiceUnavailableException.class,
                () -> client.predict(req)
        );
    }
}
