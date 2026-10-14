package com.slopeguard.controller;

import com.slopeguard.dto.RiskSummaryResponse;
import com.slopeguard.model.RiskRecord;
import com.slopeguard.service.RiskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller exposing landslide risk assessment data for Northeast Indian hill areas.
 * All records returned in Phase 1 are identified sample records for development purposes.
 */
@RestController
@RequestMapping("/api/risks")
public class RiskController {

    private final RiskService riskService;
    private final com.slopeguard.service.AiPredictionService aiPredictionService;

    public RiskController(RiskService riskService, com.slopeguard.service.AiPredictionService aiPredictionService) {
        this.riskService = riskService;
        this.aiPredictionService = aiPredictionService;
    }

    /**
     * Lists all monitored risk records.
     */
    @GetMapping
    public ResponseEntity<List<RiskRecord>> getAllRisks() {
        List<RiskRecord> risks = riskService.getAllRisks();
        return ResponseEntity.ok(risks);
    }

    /**
     * Retrieves aggregated risk summary across Northeast India monitored sectors.
     */
    @GetMapping("/summary")
    public ResponseEntity<RiskSummaryResponse> getRiskSummary() {
        RiskSummaryResponse summary = riskService.getRiskSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * Dispatches an explicit feature prediction request to the SlopeGuard AI microservice.
     */
    @org.springframework.web.bind.annotation.PostMapping("/predict")
    public ResponseEntity<com.slopeguard.dto.AiPredictionResponse> predictRisk(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.slopeguard.dto.AiPredictionRequest request) {
        com.slopeguard.dto.AiPredictionResponse response = aiPredictionService.evaluateRisk(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Queries model governance status and training metadata from the SlopeGuard AI microservice.
     */
    @GetMapping("/model-status")
    public ResponseEntity<com.slopeguard.dto.AiModelStatusResponse> getModelStatus() {
        com.slopeguard.dto.AiModelStatusResponse status = aiPredictionService.getModelStatus();
        return ResponseEntity.ok(status);
    }

    /**
     * Evaluates live landslide risk by combining real Open-Meteo precipitation with topographic terrain inputs.
     */
    @org.springframework.web.bind.annotation.PostMapping("/predict/live")
    public ResponseEntity<com.slopeguard.dto.AiPredictionResponse> predictLiveRisk(
            @org.springframework.web.bind.annotation.RequestParam Double latitude,
            @org.springframework.web.bind.annotation.RequestParam Double longitude,
            @org.springframework.web.bind.annotation.RequestParam Double slopeDeg,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double elevationM,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String lithology,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String soilType) {
        com.slopeguard.dto.AiPredictionResponse response = aiPredictionService.evaluateLiveRisk(
                latitude, longitude, slopeDeg, elevationM, lithology, soilType);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a single risk record by ID.
     * Returns 404 Not Found if ID does not exist.
     */
    @GetMapping("/{id}")
    public ResponseEntity<RiskRecord> getRiskById(@PathVariable Long id) {
        RiskRecord record = riskService.getRiskById(id);
        return ResponseEntity.ok(record);
    }
}
