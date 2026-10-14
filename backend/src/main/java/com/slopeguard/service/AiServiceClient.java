package com.slopeguard.service;

import com.slopeguard.dto.AiModelStatusResponse;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;

/**
 * Client interface for communicating with the external Python AI prediction service.
 */
public interface AiServiceClient {

    /**
     * Dispatches an inference evaluation request to the AI service.
     */
    AiPredictionResponse predict(AiPredictionRequest request);

    /**
     * Queries model governance status and training metadata from the AI service.
     */
    AiModelStatusResponse getModelStatus();
}
