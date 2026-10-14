package com.slopeguard.controller;

import com.slopeguard.dto.RiskAssessmentRequest;
import com.slopeguard.dto.RiskAssessmentResponse;
import com.slopeguard.service.RiskAssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller exposing multi-source environmental risk assessment and hazard estimation.
 */
@RestController
@RequestMapping("/api/risk-assessments")
public class RiskAssessmentController {

    private final RiskAssessmentService riskAssessmentService;

    public RiskAssessmentController(RiskAssessmentService riskAssessmentService) {
        this.riskAssessmentService = riskAssessmentService;
    }

    /**
     * Executes an environmental landslide risk assessment for specified coordinates.
     */
    @PostMapping
    public ResponseEntity<RiskAssessmentResponse> createRiskAssessment(
            @Valid @RequestBody RiskAssessmentRequest request) {
        RiskAssessmentResponse response = riskAssessmentService.assessRisk(request);
        return ResponseEntity.ok(response);
    }
}
