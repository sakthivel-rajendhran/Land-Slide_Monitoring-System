package com.slopeguard.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TerrainControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("1. GET /api/environmental/terrain inside coverage returns 200 OK with verified elevation and slope")
    void testGetTerrainInsideCoverageSuccess() throws Exception {
        mockMvc.perform(get("/api/environmental/terrain")
                        .param("latitude", "25.5788")
                        .param("longitude", "91.8933"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestedLatitude").value(25.5788))
                .andExpect(jsonPath("$.requestedLongitude").value(91.8933))
                .andExpect(jsonPath("$.gridLatitude").isNumber())
                .andExpect(jsonPath("$.gridLongitude").isNumber())
                .andExpect(jsonPath("$.elevationMeters").isNumber())
                .andExpect(jsonPath("$.slopeDegrees").isNumber())
                .andExpect(jsonPath("$.demProvider").value("Copernicus DEM (ESA)"))
                .andExpect(jsonPath("$.rasterResolution").value(containsString("30m")))
                .andExpect(jsonPath("$.coordinateReferenceSystem").value("EPSG:4326 (WGS 84)"))
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.dataQuality").value("VERIFIED_RASTER_DATA"))
                .andExpect(jsonPath("$.slopeAlgorithm").value(containsString("Horn")));
    }

    @Test
    @DisplayName("2. GET /api/environmental/terrain outside coverage returns OUT_OF_COVERAGE status")
    void testGetTerrainOutsideCoverage() throws Exception {
        mockMvc.perform(get("/api/environmental/terrain")
                        .param("latitude", "28.0")
                        .param("longitude", "95.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("OUT_OF_COVERAGE"))
                .andExpect(jsonPath("$.dataQuality").value("UNAVAILABLE"))
                .andExpect(jsonPath("$.elevationMeters").doesNotExist())
                .andExpect(jsonPath("$.slopeDegrees").doesNotExist())
                .andExpect(jsonPath("$.warnings", hasItem(containsString("outside active DEM coverage bounds"))));
    }

    @Test
    @DisplayName("3. GET /api/environmental/terrain with invalid coordinates returns 400 Bad Request")
    void testGetTerrainInvalidCoordinates() throws Exception {
        mockMvc.perform(get("/api/environmental/terrain")
                        .param("latitude", "95.0")
                        .param("longitude", "91.8933"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("4. GET /api/environmental/terrain missing query params returns 400 Bad Request")
    void testGetTerrainMissingParams() throws Exception {
        mockMvc.perform(get("/api/environmental/terrain"))
                .andExpect(status().isBadRequest());
    }
}
