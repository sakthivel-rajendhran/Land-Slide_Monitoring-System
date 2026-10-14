package com.slopeguard.service;

import com.slopeguard.dto.AiModelStatusResponse;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;

/**
 * Domain service interface managing AI landslide risk evaluations.
 */
public interface AiPredictionService {

    /**
     * Evaluates landslide risk for explicit input features.
     */
    AiPredictionResponse evaluateRisk(AiPredictionRequest request);

    /**
     * Evaluates live landslide risk by retrieving genuine precipitation from Open-Meteo
     * and combining it with topographic features.
     */
    AiPredictionResponse evaluateLiveRisk(Double latitude, Double longitude, Double slopeDeg,
                                         Double elevationM, String lithology, String soilType);

    /**
     * Retrieves AI model governance and readiness status.
     */
    AiModelStatusResponse getModelStatus();
}
