package com.slopeguard.service;

import com.slopeguard.dto.RiskSummaryResponse;
import com.slopeguard.model.RiskRecord;

import java.util.List;

/**
 * Service interface for querying landslide risk data.
 * Designed to seamlessly support database-backed or live geospatial telemetry providers in Phase 2.
 */
public interface RiskService {

    /**
     * Retrieves all monitored risk locations.
     */
    List<RiskRecord> getAllRisks();

    /**
     * Retrieves a specific risk record by its identifier.
     *
     * @param id The unique identifier of the risk record
     * @return RiskRecord domain object
     * @throws com.slopeguard.exception.ResourceNotFoundException if no record exists with the given ID
     */
    RiskRecord getRiskById(Long id);

    /**
     * Computes risk summary statistics across all monitored locations.
     */
    RiskSummaryResponse getRiskSummary();
}
