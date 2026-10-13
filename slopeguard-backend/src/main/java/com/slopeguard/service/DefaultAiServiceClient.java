package com.slopeguard.service;

import com.slopeguard.config.AiServiceProperties;
import com.slopeguard.dto.AiModelStatusResponse;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;
import com.slopeguard.exception.AiServiceDisabledException;
import com.slopeguard.exception.AiServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;

/**
 * Spring 6 RestClient implementation of AiServiceClient communicating with FastAPI AI service.
 */
@Service
public class DefaultAiServiceClient implements AiServiceClient {

    private static final Logger log = LoggerFactory.getLogger(DefaultAiServiceClient.class);

    private final AiServiceProperties properties;
    private final RestClient restClient;

    @Autowired
    public DefaultAiServiceClient(AiServiceProperties properties) {
        this.properties = properties;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()));
        factory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(properties.getBaseUrl())
                .build();
    }

    /**
     * Testing constructor allowing injection of a customized RestClient (e.g. for MockRestServiceServer).
     */
    public DefaultAiServiceClient(AiServiceProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    @Override
    public AiPredictionResponse predict(AiPredictionRequest request) {
        if (!properties.isEnabled()) {
            throw new AiServiceDisabledException("SlopeGuard AI prediction microservice integration is currently disabled.");
        }

        log.info("Sending prediction request to AI service at {}/predict for coordinates ({}, {})",
                properties.getBaseUrl(), request.getLatitude(), request.getLongitude());

        try {
            AiPredictionResponse response = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(AiPredictionResponse.class);

            if (response == null) {
                throw new AiServiceUnavailableException("Received empty response payload from AI prediction service.");
            }

            return response;

        } catch (RestClientResponseException ex) {
            log.error("AI service HTTP error (status {}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceUnavailableException("AI prediction service returned error status " + ex.getStatusCode(), ex);
        } catch (Exception ex) {
            log.error("Network or timeout failure communicating with AI prediction service: {}", ex.getMessage());
            throw new AiServiceUnavailableException("Failed to reach AI prediction service at " + properties.getBaseUrl(), ex);
        }
    }

    @Override
    public AiModelStatusResponse getModelStatus() {
        if (!properties.isEnabled()) {
            throw new AiServiceDisabledException("SlopeGuard AI prediction microservice integration is currently disabled.");
        }

        log.info("Querying AI model status at {}/model/status", properties.getBaseUrl());

        try {
            AiModelStatusResponse response = restClient.get()
                    .uri("/model/status")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(AiModelStatusResponse.class);

            if (response == null) {
                throw new AiServiceUnavailableException("Received empty status payload from AI prediction service.");
            }

            return response;

        } catch (RestClientResponseException ex) {
            log.error("AI service status HTTP error (status {}): {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new AiServiceUnavailableException("AI prediction service status returned HTTP " + ex.getStatusCode(), ex);
        } catch (Exception ex) {
            log.error("Network failure communicating with AI prediction service: {}", ex.getMessage());
            throw new AiServiceUnavailableException("Failed to reach AI prediction service at " + properties.getBaseUrl(), ex);
        }
    }
}
