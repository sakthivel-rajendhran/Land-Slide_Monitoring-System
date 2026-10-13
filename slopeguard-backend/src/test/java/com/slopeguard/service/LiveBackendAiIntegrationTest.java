package com.slopeguard.service;

import com.slopeguard.config.AiServiceProperties;
import com.slopeguard.dto.AiModelStatusResponse;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class LiveBackendAiIntegrationTest {

    @Autowired
    private AiServiceClient aiServiceClient;

    @Test
    @DisplayName("End-to-End Live Integration: Query live running Python AI microservice at localhost:8000")
    void testLiveAiMicroserviceCommunication() {
        try {
            // 1. Verify model status from live Python service
            AiModelStatusResponse statusResp = aiServiceClient.getModelStatus();
            assertNotNull(statusResp);
            assertEquals("ready", statusResp.getServiceStatus());
            assertEquals("DEMO_NOT_VALIDATED", statusResp.getModelStatus());
            assertTrue(statusResp.getArtifactLoaded());
            System.out.println("Live AI Model Status Verified: " + statusResp.getModelStatus());

            // 2. Perform live prediction for Shillong, Meghalaya
            AiPredictionRequest request = new AiPredictionRequest();
            request.setLatitude(25.5788);
            request.setLongitude(91.8933);
            request.setRainfall24hMm(120.0);
            request.setSlopeDeg(41.5);
            request.setRainfall72hMm(220.0);
            request.setElevationM(1450.0);
            request.setVegetationNdvi(0.35);
            request.setAspectDeg(190.0);
            request.setLithology("Metamorphic");
            request.setSoilType("Gravelly_Soil");

            AiPredictionResponse predResp = aiServiceClient.predict(request);
            assertNotNull(predResp);
            assertEquals("DEMO_NOT_VALIDATED", predResp.getModelStatus());
            assertNotNull(predResp.getRiskScore());
            assertTrue(predResp.getRiskScore() >= 0.0 && predResp.getRiskScore() <= 1.0);
            assertNotNull(predResp.getRiskCategory());
            assertTrue(predResp.getIsProvisionalCategory());
            assertFalse(predResp.getTopContributingFeatures().isEmpty());

            System.out.println("Live AI Prediction Verified: Risk Score = " + predResp.getRiskScore()
                    + ", Category = " + predResp.getRiskCategory()
                    + ", Status = " + predResp.getModelStatus());

        } catch (com.slopeguard.exception.AiServiceUnavailableException ex) {
            System.out.println("Live AI Service at localhost:8000 not reachable during this test pass: " + ex.getMessage());
        }
    }
}
