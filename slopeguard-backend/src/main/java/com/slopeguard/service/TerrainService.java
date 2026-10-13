package com.slopeguard.service;

import com.slopeguard.dto.TerrainFeaturesResponse;

/**
 * Service interface for querying digital elevation and calculated slope features.
 */
public interface TerrainService {

    /**
     * Extracts elevation and slope features for specified geographical coordinates.
     */
    TerrainFeaturesResponse getTerrainFeatures(double latitude, double longitude);

    /**
     * Checks whether the requested coordinates fall within active raster coverage.
     */
    boolean isCoverageAvailable(double latitude, double longitude);
}
