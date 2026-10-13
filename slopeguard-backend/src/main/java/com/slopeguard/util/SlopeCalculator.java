package com.slopeguard.util;

import com.slopeguard.model.DemRasterGrid;

/**
 * Calculates terrain slope and aspect gradients from a 2D digital elevation model
 * using Horn's (1981) weighted finite-difference 3x3 neighbourhood algorithm.
 * Accounts for geodetic coordinate reference systems by converting angular degrees
 * to horizontal ground distance in metres at the target latitude.
 */
public class SlopeCalculator {

    public static final String ALGORITHM_NAME = "Horn (1981) 3x3 finite-difference window with geodetic WGS84 horizontal metric scaling";

    public record SlopeResult(
            Double slopeDegrees,
            Double aspectDegrees,
            Double dzDx,
            Double dzDy,
            boolean isBoundaryOrNoData
    ) {}

    /**
     * Calculates slope in degrees and aspect in degrees for cell at (row, col).
     */
    public static SlopeResult calculateSlope(DemRasterGrid grid, int row, int col) {
        if (row <= 0 || row >= grid.getNrows() - 1 || col <= 0 || col >= grid.getNcols() - 1) {
            // Border cell: full 3x3 neighborhood unavailable
            return new SlopeResult(null, null, null, null, true);
        }

        // Check if any pixel in the 3x3 window is NODATA
        for (int r = row - 1; r <= row + 1; r++) {
            for (int c = col - 1; c <= col + 1; c++) {
                if (grid.isNoData(r, c)) {
                    return new SlopeResult(null, null, null, null, true);
                }
            }
        }

        float[][] d = grid.getData();
        float z_nw = d[row - 1][col - 1];
        float z_n  = d[row - 1][col];
        float z_ne = d[row - 1][col + 1];

        float z_w  = d[row][col - 1];
        float z_c  = d[row][col];
        float z_e  = d[row][col + 1];

        float z_sw = d[row + 1][col - 1];
        float z_s  = d[row + 1][col];
        float z_se = d[row + 1][col + 1];

        double lat = grid.getCellLatitude(row);
        double cellsizeDeg = grid.getCellsize();

        // Convert degree resolution to metres:
        // dy (North-South): 1 degree of latitude is ~111,132.954 metres
        double dyMeters = 111132.954 * cellsizeDeg;
        // dx (East-West): scaled by cosine of latitude
        double dxMeters = 111412.84 * Math.cos(Math.toRadians(lat)) * cellsizeDeg;

        if (dxMeters <= 0.001 || dyMeters <= 0.001) {
            return new SlopeResult(null, null, null, null, true);
        }

        // Horn's weighted finite differences
        double dzDx = ((z_ne + (2.0 * z_e) + z_se) - (z_nw + (2.0 * z_w) + z_sw)) / (8.0 * dxMeters);
        double dzDy = ((z_nw + (2.0 * z_n) + z_ne) - (z_sw + (2.0 * z_s) + z_se)) / (8.0 * dyMeters);

        double riseRun = Math.sqrt((dzDx * dzDx) + (dzDy * dzDy));
        double slopeRad = Math.atan(riseRun);
        double slopeDeg = Math.toDegrees(slopeRad);

        // Aspect calculation in degrees (0 to 360 clockwise from North)
        Double aspectDeg = null;
        if (riseRun > 1e-7) {
            double aspectRad = Math.atan2(dzDy, -dzDx);
            aspectDeg = Math.toDegrees(aspectRad);
            if (aspectDeg < 0.0) {
                aspectDeg += 360.0;
            }
        }

        return new SlopeResult(round(slopeDeg, 2), aspectDeg != null ? round(aspectDeg, 2) : null, round(dzDx, 4), round(dzDy, 4), false);
    }

    private static double round(double val, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(val * factor) / factor;
    }
}
