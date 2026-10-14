package com.slopeguard.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

class DemRasterGridTest {

    @Test
    @DisplayName("1. Parse valid ESRI ASCII Grid raster stream")
    void testParseAsciiGridSuccess() throws IOException {
        String ascContent = """
                ncols 4
                nrows 3
                xllcorner 91.0
                yllcorner 25.0
                cellsize 0.1
                NODATA_value -9999
                100.0 110.0 120.0 130.0
                140.0 150.0 -9999 170.0
                180.0 190.0 200.0 210.0
                """;

        ByteArrayInputStream in = new ByteArrayInputStream(ascContent.getBytes(StandardCharsets.UTF_8));
        DemRasterGrid grid = DemRasterGrid.parseAsciiGrid(in, "EPSG:4326");

        assertEquals(4, grid.getNcols());
        assertEquals(3, grid.getNrows());
        assertEquals(91.0, grid.getXllcorner(), 1e-6);
        assertEquals(25.0, grid.getYllcorner(), 1e-6);
        assertEquals(0.1, grid.getCellsize(), 1e-6);
        assertEquals(-9999.0, grid.getNodataValue(), 1e-6);

        // Bounds coverage
        assertTrue(grid.contains(25.15, 91.15));
        assertTrue(grid.contains(25.0, 91.0));
        assertTrue(grid.contains(25.3, 91.4));
        assertFalse(grid.contains(24.9, 91.15)); // South of bounds
        assertFalse(grid.contains(25.15, 91.5)); // East of bounds

        // Cell index mapping
        assertEquals(0, grid.getRow(25.25)); // Top row (25.2 to 25.3)
        assertEquals(1, grid.getRow(25.15)); // Middle row (25.1 to 25.2)
        assertEquals(2, grid.getRow(25.05)); // Bottom row (25.0 to 25.1)

        assertEquals(0, grid.getCol(91.05));
        assertEquals(3, grid.getCol(91.35));

        // Elevation queries
        assertEquals(100.0f, grid.getElevation(0, 0));
        assertEquals(210.0f, grid.getElevation(2, 3));
        assertNull(grid.getElevation(1, 2)); // NODATA cell returns null
        assertTrue(grid.isNoData(1, 2));
    }

    @Test
    @DisplayName("2. Malformed ASCII header throws IllegalArgumentException")
    void testMalformedHeaderThrowsException() {
        String invalidHeader = """
                ncols 4
                nrows 3
                cellsize 0.1
                100.0 110.0
                """;
        ByteArrayInputStream in = new ByteArrayInputStream(invalidHeader.getBytes(StandardCharsets.UTF_8));
        assertThrows(IllegalArgumentException.class, () -> DemRasterGrid.parseAsciiGrid(in, "EPSG:4326"));
    }
}
