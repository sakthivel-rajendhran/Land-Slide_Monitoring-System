package com.slopeguard.service;

import com.slopeguard.dto.AiModelStatusResponse;
import com.slopeguard.dto.AiPredictionRequest;
import com.slopeguard.dto.AiPredictionResponse;
import com.slopeguard.dto.RainfallMeasurementResponse;
import com.slopeguard.exception.InvalidCoordinateException;
import com.slopeguard.exception.InvalidPredictionFeatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Implementation of AiPredictionService orchestrating input validation,
 * Open-Meteo environmental retrieval, and AI client communication.
 */
@Service
public class DefaultAiPredictionService implements AiPredictionService {

    private static final Logger log = LoggerFactory.getLogger(DefaultAiPredictionService.class);

    private final AiServiceClient aiServiceClient;
    private final EnvironmentalDataService environmentalDataService;

    public DefaultAiPredictionService(AiServiceClient aiServiceClient, EnvironmentalDataService environmentalDataService) {
        this.aiServiceClient = aiServiceClient;
        this.environmentalDataService = environmentalDataService;
    }

    @Override
    public AiPredictionResponse evaluateRisk(AiPredictionRequest request) {
        validateRequest(request);
        return aiServiceClient.predict(request);
    }

    @Override
    public AiPredictionResponse evaluateLiveRisk(Double latitude, Double longitude, Double slopeDeg,
                                                 Double elevationM, String lithology, String soilType) {
        if (latitude == null || latitude < -90.0 || latitude > 90.0) {
            throw new InvalidCoordinateException("Invalid latitude: must be between -90.0 and 90.0");
        }
        if (longitude == null || longitude < -180.0 || longitude > 180.0) {
            throw new InvalidCoordinateException("Invalid longitude: must be between -180.0 and 180.0");
        }
        if (slopeDeg == null || slopeDeg < 0.0 || slopeDeg > 90.0) {
            throw new InvalidPredictionFeatureException("Slope angle (slope_deg) must be between 0.0 and 90.0 degrees.");
        }

        log.info("Evaluating live landslide risk for coordinates ({}, {}) with slope {}", latitude, longitude, slopeDeg);

        // Fetch genuine atmospheric rainfall from Open-Meteo provider
        RainfallMeasurementResponse rainfall = environmentalDataService.getCurrentRainfall(latitude, longitude);
        Double rain24h = rainfall.getPrecipitation() != null ? rainfall.getPrecipitation() : 0.0;
        Double elevation = elevationM != null ? elevationM : rainfall.getElevationMeters();

        AiPredictionRequest request = new AiPredictionRequest();
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        request.setRainfall24hMm(rain24h);
        request.setSlopeDeg(slopeDeg);
        request.setElevationM(elevation);
        request.setLithology(lithology);
        request.setSoilType(soilType);

        return aiServiceClient.predict(request);
    }

    @Override
    public AiModelStatusResponse getModelStatus() {
        return aiServiceClient.getModelStatus();
    }

    private void validateRequest(AiPredictionRequest request) {
        if (request.getLatitude() == null || request.getLatitude() < -90.0 || request.getLatitude() > 90.0) {
            throw new InvalidCoordinateException("Invalid latitude: must be between -90.0 and 90.0");
        }
        if (request.getLongitude() == null || request.getLongitude() < -180.0 || request.getLongitude() > 180.0) {
            throw new InvalidCoordinateException("Invalid longitude: must be between -180.0 and 180.0");
        }
        if (request.getSlopeDeg() == null || request.getSlopeDeg() < 0.0 || request.getSlopeDeg() > 90.0) {
            throw new InvalidPredictionFeatureException("Slope angle (slope_deg) must be between 0.0 and 90.0 degrees.");
        }
        if (request.getRainfall24hMm() == null || request.getRainfall24hMm() < 0.0) {
            throw new InvalidPredictionFeatureException("rainfall_24h_mm must be >= 0.0 mm.");
        }
        if (request.getRainfall72hMm() != null) {
            if (request.getRainfall72hMm() < 0.0) {
                throw new InvalidPredictionFeatureException("rainfall_72h_mm must be >= 0.0 mm.");
            }
            if (request.getRainfall72hMm() < request.getRainfall24hMm()) {
                throw new InvalidPredictionFeatureException(
                        "Physically inconsistent precipitation: rainfall_72h_mm (" + request.getRainfall72hMm()
                                + " mm) cannot be less than rainfall_24h_mm (" + request.getRainfall24hMm() + " mm).");
            }
        }
    }
}
