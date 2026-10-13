package com.slopeguard.service;

import com.slopeguard.dto.RiskAssessmentRequest;
import com.slopeguard.dto.RiskAssessmentResponse;

/**
 * Service interface for environmental feature gathering, model validation,
 * and comprehensive landslide risk assessment.
 */
public interface RiskAssessmentService {

    /**
     * Executes a comprehensive environmental risk assessment for a specified location.
     */
    RiskAssessmentResponse assessRisk(RiskAssessmentRequest request);
}
