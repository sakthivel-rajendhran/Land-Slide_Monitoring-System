package com.slopeguard.controller;

import com.slopeguard.dto.EnvironmentalStatusResponse;
import com.slopeguard.dto.RainfallForecastResponse;
import com.slopeguard.dto.RainfallMeasurementResponse;
import com.slopeguard.dto.TerrainFeaturesResponse;
import com.slopeguard.service.EnvironmentalDataService;
import com.slopeguard.service.TerrainService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller providing real-time environmental rainfall data, atmospheric forecasts,
 * terrain feature extraction (elevation, slope), and external provider health telemetry.
 */
@RestController
@RequestMapping("/api/environmental")
public class EnvironmentalController {

    private final EnvironmentalDataService environmentalDataService;
    private final TerrainService terrainService;

    public EnvironmentalController(EnvironmentalDataService environmentalDataService, TerrainService terrainService) {
        this.environmentalDataService = environmentalDataService;
        this.terrainService = terrainService;
    }

    /**
     * Retrieves current precipitation estimation for the specified geographical coordinates.
     */
    @GetMapping("/rainfall")
    public ResponseEntity<RainfallMeasurementResponse> getCurrentRainfall(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Both 'latitude' and 'longitude' query parameters are required.");
        }

        RainfallMeasurementResponse response = environmentalDataService.getCurrentRainfall(latitude, longitude);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves hourly precipitation forecast projections for the specified geographical coordinates.
     */
    @GetMapping("/rainfall/forecast")
    public ResponseEntity<RainfallForecastResponse> getRainfallForecast(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Both 'latitude' and 'longitude' query parameters are required.");
        }

        RainfallForecastResponse response = environmentalDataService.getRainfallForecast(latitude, longitude);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves digital elevation and calculated slope features for the specified geographical coordinates
     * from genuine Digital Elevation Model (Copernicus DEM GLO-30) raster data.
     */
    @GetMapping("/terrain")
    public ResponseEntity<TerrainFeaturesResponse> getTerrainFeatures(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Both 'latitude' and 'longitude' query parameters are required.");
        }

        TerrainFeaturesResponse response = terrainService.getTerrainFeatures(latitude, longitude);
        return ResponseEntity.ok(response);
    }

    /**
     * Reports live operational connectivity and data freshness metrics for the environmental provider.
     */
    @GetMapping("/status")
    public ResponseEntity<EnvironmentalStatusResponse> getEnvironmentalStatus() {
        EnvironmentalStatusResponse status = environmentalDataService.getProviderStatus();
        return ResponseEntity.ok(status);
    }
}
