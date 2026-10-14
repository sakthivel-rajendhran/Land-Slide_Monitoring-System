package com.slopeguard.service;

import com.slopeguard.config.DemProperties;
import com.slopeguard.dto.TerrainFeaturesResponse;
import com.slopeguard.exception.InvalidCoordinateException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class TerrainServiceTest {

    @Autowired
    private TerrainService terrainService;

    @Autowired
    private DemProperties demProperties;

    @Test
    @DisplayName("1. Real Copernicus DEM query at Shillong coordinates returns verified elevation and calculated slope")
    void testRealDemShillongQuerySuccess() {
        // Shillong East Khasi Hills: 25.5788°N, 91.8933°E
        double lat = 25.5788;
        double lon = 91.8933;

        TerrainFeaturesResponse resp = terrainService.getTerrainFeatures(lat, lon);

        assertNotNull(resp);
        assertEquals(lat, resp.getRequestedLatitude(), 1e-4);
        assertEquals(lon, resp.getRequestedLongitude(), 1e-4);
        assertEquals("AVAILABLE", resp.getAvailabilityStatus());
        assertEquals("VERIFIED_RASTER_DATA", resp.getDataQuality());

        // Real Copernicus DEM GLO-30 elevation at Shillong is ~1428 metres
        assertNotNull(resp.getElevationMeters());
        assertTrue(resp.getElevationMeters() >= 1400.0 && resp.getElevationMeters() <= 1460.0,
                "Elevation " + resp.getElevationMeters() + " was outside expected range for Shillong plateau.");

        // Slope is calculated from the 3x3 finite-difference neighborhood
        assertNotNull(resp.getSlopeDegrees());
        assertTrue(resp.getSlopeDegrees() >= 0.0 && resp.getSlopeDegrees() <= 90.0);

        assertEquals("Copernicus DEM (ESA)", resp.getDemProvider());
        assertEquals("GLO-30 Public Copernicus DSM", resp.getProductVersion());
        assertEquals("EPSG:4326 (WGS 84)", resp.getCoordinateReferenceSystem());
        assertNotNull(resp.getRetrievalTimestamp());
        assertNotNull(resp.getSlopeAlgorithm());
    }

    @Test
    @DisplayName("2. Coordinates outside DEM coverage return OUT_OF_COVERAGE without fabricating values")
    void testOutOfCoverageReturnsClearUnavailable() {
        // Outside Meghalaya raster bounds: 28.0°N, 95.0°E (Arunachal Pradesh border)
        double lat = 28.0;
        double lon = 95.0;

        TerrainFeaturesResponse resp = terrainService.getTerrainFeatures(lat, lon);

        assertNotNull(resp);
        assertEquals("OUT_OF_COVERAGE", resp.getAvailabilityStatus());
        assertEquals("UNAVAILABLE", resp.getDataQuality());
        assertNull(resp.getElevationMeters());
        assertNull(resp.getSlopeDegrees());
        assertFalse(resp.getWarnings().isEmpty());
        assertTrue(resp.getWarnings().get(0).contains("outside active DEM coverage bounds"));
    }

    @Test
    @DisplayName("3. Invalid coordinates throw InvalidCoordinateException")
    void testInvalidCoordinatesThrowException() {
        assertThrows(InvalidCoordinateException.class, () -> terrainService.getTerrainFeatures(95.0, 91.8933));
        assertThrows(InvalidCoordinateException.class, () -> terrainService.getTerrainFeatures(-95.0, 91.8933));
        assertThrows(InvalidCoordinateException.class, () -> terrainService.getTerrainFeatures(25.5788, 190.0));
    }

    @Test
    @DisplayName("4. Terrain lookups are cached within TTL window")
    void testTerrainCachingBehavior() {
        if (terrainService instanceof DefaultTerrainService defaultService) {
            defaultService.clearCache();
            assertEquals(0, defaultService.getCacheSize());

            TerrainFeaturesResponse resp1 = terrainService.getTerrainFeatures(25.5788, 91.8933);
            assertEquals(1, defaultService.getCacheSize());

            TerrainFeaturesResponse resp2 = terrainService.getTerrainFeatures(25.5788, 91.8933);
            assertEquals(1, defaultService.getCacheSize());
            assertEquals(resp1.getElevationMeters(), resp2.getElevationMeters());
        }
    }
}
