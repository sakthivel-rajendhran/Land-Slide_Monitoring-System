package com.slopeguard.service;

import com.slopeguard.config.DemProperties;
import com.slopeguard.dto.TerrainFeaturesResponse;
import com.slopeguard.exception.InvalidCoordinateException;
import com.slopeguard.model.DemRasterGrid;
import com.slopeguard.util.SlopeCalculator;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service implementation extracting elevation and calculating slope gradients
 * from local genuine Copernicus DEM rasters with thread-safe caching and coverage validation.
 */
@Service
public class DefaultTerrainService implements TerrainService {

    private static final Logger log = LoggerFactory.getLogger(DefaultTerrainService.class);

    private final DemProperties demProperties;
    private final ResourceLoader resourceLoader;

    private DemRasterGrid rasterGrid;
    private final Map<String, CacheEntry> terrainCache = new ConcurrentHashMap<>();

    private record CacheEntry(TerrainFeaturesResponse response, Instant expiresAt) {}

    public DefaultTerrainService(DemProperties demProperties, ResourceLoader resourceLoader) {
        this.demProperties = demProperties;
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void init() {
        if (!demProperties.isEnabled()) {
            log.info("DEM terrain feature provider is disabled by configuration.");
            return;
        }

        loadRasterDataset();
    }

    public synchronized void loadRasterDataset() {
        String path = demProperties.getLocalRasterPath();
        if (path == null || path.isBlank()) {
            log.warn("No local DEM raster path configured.");
            return;
        }

        try {
            log.info("Loading DEM raster dataset from: {}", path);
            Resource resource = resourceLoader.getResource(path);
            if (!resource.exists()) {
                log.warn("DEM raster resource does not exist at path: {}", path);
                return;
            }

            try (InputStream in = resource.getInputStream()) {
                this.rasterGrid = DemRasterGrid.parseAsciiGrid(in, demProperties.getCrs());
                log.info("Successfully loaded DEM raster: {}x{} cells, bounds [Lat: {} to {}, Lon: {} to {}], cellsize: {} deg",
                        rasterGrid.getNcols(), rasterGrid.getNrows(),
                        rasterGrid.getYllcorner(),
                        rasterGrid.getYllcorner() + (rasterGrid.getNrows() * rasterGrid.getCellsize()),
                        rasterGrid.getXllcorner(),
                        rasterGrid.getXllcorner() + (rasterGrid.getNcols() * rasterGrid.getCellsize()),
                        rasterGrid.getCellsize());
            }
        } catch (Exception ex) {
            log.error("Failed to load DEM raster from {}: {}", path, ex.getMessage(), ex);
            this.rasterGrid = null;
        }
    }

    @Override
    public boolean isCoverageAvailable(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);
        return rasterGrid != null && rasterGrid.contains(latitude, longitude);
    }

    @Override
    public TerrainFeaturesResponse getTerrainFeatures(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);

        String cacheKey = String.format("terrain:%.5f:%.5f", latitude, longitude);
        Instant now = Instant.now();

        CacheEntry cached = terrainCache.get(cacheKey);
        if (cached != null && cached.expiresAt().isAfter(now)) {
            log.debug("Returning cached terrain lookup for ({}, {})", latitude, longitude);
            return cached.response();
        }

        TerrainFeaturesResponse response = new TerrainFeaturesResponse();
        response.setRequestedLatitude(latitude);
        response.setRequestedLongitude(longitude);
        response.setDemProvider(demProperties.getProviderName());
        response.setProductVersion(demProperties.getProductName());
        response.setRasterResolution(demProperties.getResolution());
        response.setCoordinateReferenceSystem(demProperties.getCrs());
        response.setRetrievalTimestamp(now.toString());
        response.setSlopeAlgorithm(SlopeCalculator.ALGORITHM_NAME);
        response.setLimitations("Slope values reflect numerical finite-difference gradient over a 3x3 (~90m) window. Sub-grid micro-relief (<30m) is not resolved.");

        if (rasterGrid == null) {
            response.setAvailabilityStatus("PROVIDER_UNAVAILABLE");
            response.setDataQuality("UNAVAILABLE");
            response.setWarnings(List.of("DEM raster dataset is not loaded or the terrain provider is unavailable."));
            return response;
        }

        if (!rasterGrid.contains(latitude, longitude)) {
            response.setAvailabilityStatus("OUT_OF_COVERAGE");
            response.setDataQuality("UNAVAILABLE");
            double ymin = rasterGrid.getYllcorner();
            double ymax = ymin + (rasterGrid.getNrows() * rasterGrid.getCellsize());
            double xmin = rasterGrid.getXllcorner();
            double xmax = xmin + (rasterGrid.getNcols() * rasterGrid.getCellsize());
            response.setWarnings(List.of(String.format(
                    "Requested coordinates (%.4f, %.4f) fall outside active DEM coverage bounds [Lat: %.4f to %.4f, Lon: %.4f to %.4f].",
                    latitude, longitude, ymin, ymax, xmin, xmax
            )));
            return response;
        }

        int row = rasterGrid.getRow(latitude);
        int col = rasterGrid.getCol(longitude);

        double gridLat = rasterGrid.getCellLatitude(row);
        double gridLon = rasterGrid.getCellLongitude(col);
        response.setGridLatitude(gridLat);
        response.setGridLongitude(gridLon);

        Float elevation = rasterGrid.getElevation(row, col);
        if (elevation == null) {
            response.setAvailabilityStatus("NODATA_PIXEL");
            response.setDataQuality("UNAVAILABLE");
            response.setWarnings(List.of("The target DEM raster cell contains a NODATA void pixel. Elevation and slope cannot be derived."));
            return response;
        }

        response.setElevationMeters(round(elevation.doubleValue(), 2));

        SlopeCalculator.SlopeResult slopeResult = SlopeCalculator.calculateSlope(rasterGrid, row, col);
        List<String> warnings = new ArrayList<>();

        if (slopeResult.isBoundaryOrNoData()) {
            response.setAvailabilityStatus("AVAILABLE_PARTIAL");
            response.setDataQuality("BOUNDARY_OR_NODATA_LIMITATION");
            warnings.add("Target cell is located on the raster perimeter or adjacent to NODATA void pixels. 3x3 spatial gradient slope calculation requires complete neighborhood; slope omitted.");
        } else {
            response.setSlopeDegrees(slopeResult.slopeDegrees());
            response.setAspectDegrees(slopeResult.aspectDegrees());
            response.setAvailabilityStatus("AVAILABLE");
            response.setDataQuality("VERIFIED_RASTER_DATA");
            response.setSourceProvenance("Copernicus DEM GLO-30 (ESA / Airbus) 1 arc-second Public DSM via local verified raster");
        }

        response.setWarnings(warnings);

        // Cache valid or evaluated result
        if (terrainCache.size() < demProperties.getCacheMaxEntries()) {
            terrainCache.put(cacheKey, new CacheEntry(response, now.plusSeconds(demProperties.getCacheTtlMinutes() * 60)));
        }

        return response;
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new InvalidCoordinateException("Latitude must be between -90.0 and 90.0 degrees.");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new InvalidCoordinateException("Longitude must be between -180.0 and 180.0 degrees.");
        }
    }

    private double round(double val, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
    }

    public void setRasterGrid(DemRasterGrid grid) {
        this.rasterGrid = grid;
        this.terrainCache.clear();
    }

    public DemRasterGrid getRasterGrid() {
        return this.rasterGrid;
    }

    public void clearCache() {
        this.terrainCache.clear();
    }

    public int getCacheSize() {
        return this.terrainCache.size();
    }
}
