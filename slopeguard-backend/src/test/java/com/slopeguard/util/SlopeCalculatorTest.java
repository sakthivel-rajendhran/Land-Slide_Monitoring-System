package com.slopeguard.util;

import com.slopeguard.model.DemRasterGrid;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SlopeCalculatorTest {

    @Test
    @DisplayName("1. Flat horizontal terrain yields 0.0 degrees slope")
    void testFlatSurfaceZeroSlope() {
        int n = 5;
        float[][] data = new float[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                data[r][c] = 1200.0f;
            }
        }

        DemRasterGrid grid = new DemRasterGrid(n, n, 91.0, 25.0, 0.000277777778, -9999.0, "EPSG:4326", data);
        SlopeCalculator.SlopeResult result = SlopeCalculator.calculateSlope(grid, 2, 2);

        assertFalse(result.isBoundaryOrNoData());
        assertNotNull(result.slopeDegrees());
        assertEquals(0.0, result.slopeDegrees(), 0.01);
        assertEquals(0.0, result.dzDx(), 0.001);
        assertEquals(0.0, result.dzDy(), 0.001);
    }

    @Test
    @DisplayName("2. Uniform 45-degree incline plane yields exactly 45.0 degrees slope")
    void testUniform45DegreeEastwardIncline() {
        int n = 5;
        double cellsize = 0.000277777778; // 1 arc-second (~30m)
        double lat = 25.0;
        double dxMeters = 111412.84 * Math.cos(Math.toRadians(lat)) * cellsize;

        float[][] data = new float[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                // Rise = 1.0 * Run (Eastward gradient dz/dx = 1.0)
                data[r][c] = (float) (1000.0 + (c * dxMeters));
            }
        }

        DemRasterGrid grid = new DemRasterGrid(n, n, 91.0, 25.0, cellsize, -9999.0, "EPSG:4326", data);
        SlopeCalculator.SlopeResult result = SlopeCalculator.calculateSlope(grid, 2, 2);

        assertFalse(result.isBoundaryOrNoData());
        assertNotNull(result.slopeDegrees());
        assertEquals(45.0, result.slopeDegrees(), 0.1);
        assertEquals(1.0, result.dzDx(), 0.01);
        assertEquals(0.0, result.dzDy(), 0.01);
        assertNotNull(result.aspectDegrees());
        assertEquals(180.0, result.aspectDegrees(), 0.1); // Downhill aspect facing West
    }

    @Test
    @DisplayName("3. Perimeter boundary cell returns isBoundaryOrNoData true without fabricating slope")
    void testPerimeterCellReturnsBoundaryOmitted() {
        int n = 5;
        float[][] data = new float[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                data[r][c] = 1000.0f;
            }
        }

        DemRasterGrid grid = new DemRasterGrid(n, n, 91.0, 25.0, 0.000277777778, -9999.0, "EPSG:4326", data);

        // Top row
        SlopeCalculator.SlopeResult resultTop = SlopeCalculator.calculateSlope(grid, 0, 2);
        assertTrue(resultTop.isBoundaryOrNoData());
        assertNull(resultTop.slopeDegrees());

        // Leftmost col
        SlopeCalculator.SlopeResult resultLeft = SlopeCalculator.calculateSlope(grid, 2, 0);
        assertTrue(resultLeft.isBoundaryOrNoData());
        assertNull(resultLeft.slopeDegrees());
    }

    @Test
    @DisplayName("4. Window containing NODATA pixel prevents fabrication and omits slope")
    void testNodataNeighborPreventsSlopeFabrication() {
        int n = 5;
        float[][] data = new float[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                data[r][c] = 1000.0f;
            }
        }
        data[1][1] = -9999.0f; // Northwest neighbor is NODATA void

        DemRasterGrid grid = new DemRasterGrid(n, n, 91.0, 25.0, 0.000277777778, -9999.0, "EPSG:4326", data);
        SlopeCalculator.SlopeResult result = SlopeCalculator.calculateSlope(grid, 2, 2);

        assertTrue(result.isBoundaryOrNoData());
        assertNull(result.slopeDegrees());
    }
}
