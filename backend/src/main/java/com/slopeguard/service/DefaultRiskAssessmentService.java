package com.slopeguard.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slopeguard.dto.*;
import com.slopeguard.exception.AiServiceUnavailableException;
import com.slopeguard.exception.EnvironmentalProviderException;
import com.slopeguard.exception.InvalidCoordinateException;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.EarlyWarningAlert;
import com.slopeguard.model.RiskAssessmentRecord;
import com.slopeguard.repository.RiskAssessmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Orchestrates multi-source environmental gathering, missing-feature safety checks,
 * AI inference dispatching, early-warning alert deduplication, and database persistence.
 */
@Service
public class DefaultRiskAssessmentService implements RiskAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(DefaultRiskAssessmentService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static final String DISTINCTION_NOTICE =
            "DISTINCTION NOTICE: 1) Long-term susceptibility reflects static terrain morphology and lithology. "
            + "2) Current environmental conditions represent numerical weather precipitation estimates. "
            + "3) Short-term hazard estimates represent mathematical prototype projections. "
            + "4) Official public warnings are issued solely by designated disaster management authorities (NDMA/SDMA) "
            + "and are NOT generated or declared by this experimental software.";

    private static final String DISCLAIMER_TEXT =
            "EXPERIMENTAL PROTOTYPE: This risk assessment is an uncalibrated demonstration estimate based on a research pipeline. "
            + "It is not a certified disaster warning, evacuation trigger, or geotechnical guarantee of slope stability.";

    private final EnvironmentalDataService environmentalDataService;
    private final AiServiceClient aiServiceClient;
    private final AlertService alertService;
    private final TerrainService terrainService;
    private final RiskAssessmentRepository riskAssessmentRepository;

    public DefaultRiskAssessmentService(EnvironmentalDataService environmentalDataService,
                                        AiServiceClient aiServiceClient,
                                        AlertService alertService,
                                        TerrainService terrainService,
                                        RiskAssessmentRepository riskAssessmentRepository) {
        this.environmentalDataService = environmentalDataService;
        this.aiServiceClient = aiServiceClient;
        this.alertService = alertService;
        this.terrainService = terrainService;
        this.riskAssessmentRepository = riskAssessmentRepository;
    }

    @Override
    @Transactional
    public RiskAssessmentResponse assessRisk(RiskAssessmentRequest request) {
        validateCoordinates(request.getLatitude(), request.getLongitude());

        String requestId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        String timestamp = now.format(DateTimeFormatter.ISO_DATE_TIME);

        RiskAssessmentResponse response = new RiskAssessmentResponse();
        response.setRequestId(requestId);
        response.setAssessmentTimestamp(timestamp);
        response.setDistinctionNotice(DISTINCTION_NOTICE);
        response.setDisclaimer(DISCLAIMER_TEXT);
        response.setModelVersion("0.1.0-prototype");
        response.setModelStatus("DEMO_NOT_VALIDATED");
        response.setOutputType("UNCALIBRATED_HAZARD_SCORE");
        response.setCalibrationStatus("CALIBRATION_DEFERRED");
        response.setThresholdReviewStatus("PENDING_EXPERT_REVIEW");

        Map<String, Object> locationMap = new HashMap<>();
        locationMap.put("requested_latitude", request.getLatitude());
        locationMap.put("requested_longitude", request.getLongitude());
        response.setLocation(locationMap);

        Map<String, FeatureProvenanceInfo> featureMap = new HashMap<>();
        List<String> unavailableInputs = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> limitations = new ArrayList<>();

        Double observedPrecipitation = null;
        Double forecastPrecipitation = null;

        // 1. Environmental Data Gathering (Open-Meteo)
        RainfallMeasurementResponse rainfall = null;
        try {
            rainfall = environmentalDataService.getCurrentRainfall(request.getLatitude(), request.getLongitude());
            if (rainfall != null) {
                locationMap.put("grid_latitude", rainfall.getGridLatitude());
                locationMap.put("grid_longitude", rainfall.getGridLongitude());
                locationMap.put("elevation_m", rainfall.getElevationMeters());
                observedPrecipitation = rainfall.getPrecipitation();

                featureMap.put("observed_precipitation", new FeatureProvenanceInfo(
                        "precipitation",
                        rainfall.getPrecipitation(),
                        rainfall.getUnit(),
                        rainfall.getObservationTimestamp(),
                        rainfall.getProvider(),
                        rainfall.getDataQuality(),
                        "OBSERVED"
                ));

                response.setDataFreshness(rainfall.getDataFreshness());
                response.setDataQuality(rainfall.getDataQuality());
            }
        } catch (EnvironmentalProviderException ex) {
            log.warn("Environmental provider error during assessment: {}", ex.getMessage());
            unavailableInputs.add("observed_precipitation (Open-Meteo upstream provider temporarily unreachable)");
            warnings.add("Real-time environmental weather data could not be retrieved from provider.");
            response.setDataFreshness("UNAVAILABLE");
            response.setDataQuality("DEGRADED");
        }

        // Gather Forecast Rainfall (distinct from observed)
        try {
            RainfallForecastResponse forecast = environmentalDataService.getRainfallForecast(request.getLatitude(), request.getLongitude());
            if (forecast != null && forecast.getHourlyForecasts() != null && !forecast.getHourlyForecasts().isEmpty()) {
                double forecast24hSum = forecast.getHourlyForecasts().stream()
                        .mapToDouble(p -> p.getPrecipitation() != null ? p.getPrecipitation() : 0.0)
                        .sum();
                forecastPrecipitation = round(forecast24hSum, 2);

                featureMap.put("forecast_24h_precipitation", new FeatureProvenanceInfo(
                        "forecast_24h_precipitation",
                        forecastPrecipitation,
                        "mm",
                        forecast.getRetrievedAt() != null ? forecast.getRetrievedAt().toString() : timestamp,
                        forecast.getProvider(),
                        "NUMERICAL_WEATHER_PROJECTION",
                        "FORECAST"
                ));
            }
        } catch (Exception ex) {
            log.debug("Forecast gathering optional failure: {}", ex.getMessage());
            unavailableInputs.add("forecast_hourly_precipitation (Forecast projection currently unavailable)");
        }

        // 2. Terrain & Topographic Features (Phase 8 DEM Integration)
        Double slopeDeg = request.getSlopeDeg();
        Double elevationM = request.getElevationM();

        if (slopeDeg == null) {
            try {
                TerrainFeaturesResponse terrain = terrainService.getTerrainFeatures(request.getLatitude(), request.getLongitude());
                if (terrain != null && "AVAILABLE".equalsIgnoreCase(terrain.getAvailabilityStatus()) && terrain.getSlopeDegrees() != null) {
                    slopeDeg = terrain.getSlopeDegrees();
                    featureMap.put("slope_deg", new FeatureProvenanceInfo(
                            "slope_deg",
                            slopeDeg,
                            "degrees",
                            terrain.getRetrievalTimestamp(),
                            terrain.getDemProvider() + " (" + terrain.getProductVersion() + ")",
                            terrain.getDataQuality(),
                            "RASTER_DERIVED"
                    ));

                    if (elevationM == null && terrain.getElevationMeters() != null) {
                        elevationM = terrain.getElevationMeters();
                        featureMap.put("elevation_m", new FeatureProvenanceInfo(
                                "elevation_m",
                                elevationM,
                                "metres",
                                terrain.getRetrievalTimestamp(),
                                terrain.getDemProvider() + " (" + terrain.getProductVersion() + ")",
                                terrain.getDataQuality(),
                                "RASTER_DERIVED"
                        ));
                    }
                    if (terrain.getGridLatitude() != null && terrain.getGridLongitude() != null) {
                        locationMap.put("dem_grid_latitude", terrain.getGridLatitude());
                        locationMap.put("dem_grid_longitude", terrain.getGridLongitude());
                    }
                } else if (terrain != null) {
                    if ("OUT_OF_COVERAGE".equalsIgnoreCase(terrain.getAvailabilityStatus())) {
                        unavailableInputs.add("slope_deg (Location falls outside active DEM raster coverage)");
                        warnings.add("Topographic DEM coverage is unavailable for requested location.");
                    } else if ("NODATA_PIXEL".equalsIgnoreCase(terrain.getAvailabilityStatus())) {
                        unavailableInputs.add("slope_deg (Target cell contains NODATA void pixel)");
                        warnings.add("Target cell contains NODATA elevation void.");
                    } else if ("PROVIDER_UNAVAILABLE".equalsIgnoreCase(terrain.getAvailabilityStatus())) {
                        unavailableInputs.add("slope_deg (DEM terrain provider is currently uninitialized or unavailable)");
                        warnings.add("DEM terrain provider offline.");
                    } else {
                        unavailableInputs.add("slope_deg (DEM slope derivation incomplete)");
                    }
                    if (terrain.getWarnings() != null && !terrain.getWarnings().isEmpty()) {
                        warnings.addAll(terrain.getWarnings());
                    }
                } else {
                    unavailableInputs.add("slope_deg (Topographic slope gradient angle in degrees: required by geotechnical model but not supplied in request or DEM survey)");
                }
            } catch (Exception ex) {
                log.warn("Terrain feature extraction error: {}", ex.getMessage());
                unavailableInputs.add("slope_deg (Topographic slope gradient angle in degrees: required by geotechnical model but not supplied in request or DEM survey)");
                warnings.add("Terrain feature service could not extract slope gradient.");
            }
        } else {
            featureMap.put("slope_deg", new FeatureProvenanceInfo(
                    "slope_deg",
                    slopeDeg,
                    "degrees",
                    timestamp,
                    "Client / Geotechnical Survey Input",
                    "USER_OR_SURVEY_SUPPLIED",
                    "CLIENT_SUPPLIED"
            ));
        }

        if (elevationM == null) {
            elevationM = (rainfall != null ? rainfall.getElevationMeters() : null);
            if (elevationM != null) {
                featureMap.put("elevation_m", new FeatureProvenanceInfo(
                        "elevation_m",
                        elevationM,
                        "metres",
                        timestamp,
                        "Open-Meteo / Copernicus DEM",
                        "DIGITAL_ELEVATION_MODEL",
                        "TOPOGRAPHIC_MODEL"
                ));
            } else {
                unavailableInputs.add("elevation_m (Elevation in metres not available)");
            }
        } else if (!featureMap.containsKey("elevation_m")) {
            featureMap.put("elevation_m", new FeatureProvenanceInfo(
                    "elevation_m",
                    elevationM,
                    "metres",
                    timestamp,
                    "Client / Geotechnical Survey Input",
                    "USER_OR_SURVEY_SUPPLIED",
                    "CLIENT_SUPPLIED"
            ));
        }

        if (request.getLithology() != null) {
            featureMap.put("lithology", new FeatureProvenanceInfo(
                    "lithology", request.getLithology(), "categorical", timestamp, "Client Survey", "SURVEY_SUPPLIED", "CLIENT_SUPPLIED"
            ));
        }
        if (request.getSoilType() != null) {
            featureMap.put("soil_type", new FeatureProvenanceInfo(
                    "soil_type", request.getSoilType(), "categorical", timestamp, "Client Survey", "SURVEY_SUPPLIED", "CLIENT_SUPPLIED"
            ));
        }

        response.setAvailableInputFeatures(featureMap);
        response.setUnavailableInputs(unavailableInputs);

        // 3. Model Pre-Flight Validation
        if (slopeDeg == null) {
            log.info("Assessment {}: Required feature 'slope_deg' missing. Halting without fabricating risk.", requestId);
            response.setRiskStatus("UNAVAILABLE_MISSING_FEATURES");
            response.setRiskScore(null);
            response.setRiskCategory("UNAVAILABLE");
            warnings.add("Topographic slope angle (slope_deg) is required for slope stability estimation. Cannot generate risk score without terrain morphology.");
            limitations.add("Atmospheric rainfall alone does not constitute a landslide prediction without slope angle and geotechnical parameters.");
            response.setWarnings(warnings);
            response.setLimitations(limitations);

            persistAssessmentRecord(requestId, request, now, response, observedPrecipitation, forecastPrecipitation, slopeDeg, elevationM);
            return response;
        }

        if (rainfall == null || rainfall.getPrecipitation() == null) {
            log.info("Assessment {}: Precipitation data missing. Halting without fabricating risk.", requestId);
            response.setRiskStatus("UNAVAILABLE_ENVIRONMENTAL_OFFLINE");
            response.setRiskScore(null);
            response.setRiskCategory("UNAVAILABLE");
            warnings.add("Observed precipitation features are unavailable from upstream weather providers.");
            response.setWarnings(warnings);
            response.setLimitations(limitations);

            persistAssessmentRecord(requestId, request, now, response, observedPrecipitation, forecastPrecipitation, slopeDeg, elevationM);
            return response;
        }

        // 4. Dispatch to Python AI Service
        AiPredictionRequest aiRequest = new AiPredictionRequest();
        aiRequest.setLatitude(request.getLatitude());
        aiRequest.setLongitude(request.getLongitude());
        aiRequest.setRainfall24hMm(rainfall.getPrecipitation());
        aiRequest.setSlopeDeg(slopeDeg);
        aiRequest.setElevationM(elevationM);
        aiRequest.setLithology(request.getLithology());
        aiRequest.setSoilType(request.getSoilType());

        try {
            AiPredictionResponse aiResponse = aiServiceClient.predict(aiRequest);

            response.setRiskStatus("ASSESSED");
            response.setModelVersion(aiResponse.getModelVersion());
            response.setModelStatus(aiResponse.getModelStatus());
            response.setRiskScore(aiResponse.getRiskScore());
            response.setRiskCategory(aiResponse.getRiskCategory());
            response.setIsProvisionalCategory(aiResponse.getIsProvisionalCategory());
            response.setTopContributingFeatures(aiResponse.getTopContributingFeatures());

            if (aiResponse.getOutputType() != null) {
                response.setOutputType(aiResponse.getOutputType());
            }
            if (aiResponse.getCalibrationStatus() != null) {
                response.setCalibrationStatus(aiResponse.getCalibrationStatus());
            }
            if (aiResponse.getThresholdReviewStatus() != null) {
                response.setThresholdReviewStatus(aiResponse.getThresholdReviewStatus());
            }

            if (aiResponse.getWarnings() != null) {
                warnings.addAll(aiResponse.getWarnings());
            }

            // 5. Early Warning Alert Evaluation
            if ("HIGH".equalsIgnoreCase(aiResponse.getRiskCategory()) || "SEVERE".equalsIgnoreCase(aiResponse.getRiskCategory())) {
                AlertSeverity severity = "SEVERE".equalsIgnoreCase(aiResponse.getRiskCategory())
                        ? AlertSeverity.CRITICAL
                        : AlertSeverity.HIGH;

                Map<String, Object> evidence = new HashMap<>();
                evidence.put("risk_score", aiResponse.getRiskScore());
                evidence.put("risk_category", aiResponse.getRiskCategory());
                evidence.put("rainfall_24h_mm", rainfall.getPrecipitation());
                evidence.put("slope_deg", slopeDeg);
                evidence.put("model_version", aiResponse.getModelVersion());

                EarlyWarningAlert alertCandidate = new EarlyWarningAlert(
                        null,
                        "Sector (" + request.getLatitude() + ", " + request.getLongitude() + ")",
                        request.getLatitude(),
                        request.getLongitude(),
                        severity,
                        "DEMO_ASSESSMENT",
                        "DEMO_EXPERIMENTAL",
                        LocalDateTime.now(),
                        evidence,
                        "SlopeGuard Risk Assessment Engine v7.0"
                );
                alertCandidate.setAssessmentId(requestId);

                EarlyWarningAlert alert = alertService.createAlertIfEligible(alertCandidate);
                response.setAlertTriggered(true);
                response.setAlertId(alert.getId());
                warnings.add("Hazard threshold reached: provisional demonstration alert registered (id: " + alert.getId() + ").");
            }

        } catch (AiServiceUnavailableException ex) {
            log.error("AI service failure during assessment {}: {}", requestId, ex.getMessage());
            response.setRiskStatus("UNAVAILABLE_AI_OFFLINE");
            response.setRiskScore(null);
            response.setRiskCategory("UNAVAILABLE");
            warnings.add("SlopeGuard AI prediction microservice is currently unreachable. No unverified fallback prediction was generated.");
        }

        limitations.add("Predictions are based on numerical model estimates and do not incorporate sub-surface pore water pressure sensors.");
        response.setWarnings(warnings);
        response.setLimitations(limitations);

        persistAssessmentRecord(requestId, request, now, response, observedPrecipitation, forecastPrecipitation, slopeDeg, elevationM);

        return response;
    }

    private void persistAssessmentRecord(String requestId,
                                        RiskAssessmentRequest request,
                                        LocalDateTime timestamp,
                                        RiskAssessmentResponse response,
                                        Double observedPrecip,
                                        Double forecastPrecip,
                                        Double slopeDeg,
                                        Double elevationM) {
        try {
            Map<String, Object> provenance = new HashMap<>();
            provenance.put("available_features", response.getAvailableInputFeatures());
            provenance.put("unavailable_inputs", response.getUnavailableInputs());
            provenance.put("warnings", response.getWarnings());
            provenance.put("limitations", response.getLimitations());
            provenance.put("top_contributing_features", response.getTopContributingFeatures());

            String provenanceJson = MAPPER.writeValueAsString(provenance);

            RiskAssessmentRecord record = new RiskAssessmentRecord(
                    requestId,
                    request.getLatitude(),
                    request.getLongitude(),
                    timestamp,
                    response.getModelVersion(),
                    response.getModelStatus(),
                    response.getRiskStatus(),
                    response.getRiskScore(),
                    response.getRiskCategory(),
                    response.getIsProvisionalCategory(),
                    response.getDataFreshness(),
                    response.getDataQuality(),
                    observedPrecip,
                    forecastPrecip,
                    slopeDeg,
                    elevationM,
                    request.getLithology(),
                    request.getSoilType(),
                    response.getAlertTriggered(),
                    response.getAlertId(),
                    provenanceJson
            );

            riskAssessmentRepository.save(record);
            log.info("Persisted risk assessment record {} to MySQL with status {}", requestId, response.getRiskStatus());
        } catch (Exception ex) {
            log.error("Failed to persist risk assessment record {}: {}", requestId, ex.getMessage(), ex);
        }
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || latitude < -90.0 || latitude > 90.0) {
            throw new InvalidCoordinateException("Invalid latitude: must be between -90.0 and 90.0");
        }
        if (longitude == null || longitude < -180.0 || longitude > 180.0) {
            throw new InvalidCoordinateException("Invalid longitude: must be between -180.0 and 180.0");
        }
    }

    private double round(double val, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
    }
}
