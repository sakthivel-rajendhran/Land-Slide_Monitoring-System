package com.slopeguard.util;

/**
 * Geodetic helper utilities for Northeast India coordinates and spatial validation.
 */
public final class GeoUtils {

    // Approximate bounding box coordinates covering the 8 Northeast Indian states
    // (Assam, Arunachal Pradesh, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)
    public static final double NE_INDIA_MIN_LAT = 21.5;
    public static final double NE_INDIA_MAX_LAT = 29.5;
    public static final double NE_INDIA_MIN_LON = 88.0;
    public static final double NE_INDIA_MAX_LON = 97.5;

    private GeoUtils() {
        // Utility class
    }

    /**
     * Checks if coordinates fall within general valid worldwide latitude/longitude boundaries.
     */
    public static boolean isValidCoordinate(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return false;
        }
        return latitude >= -90.0 && latitude <= 90.0 && longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * Checks if the coordinate falls approximately within the Northeast India region.
     */
    public static boolean isInNortheastIndia(Double latitude, Double longitude) {
        if (!isValidCoordinate(latitude, longitude)) {
            return false;
        }
        return latitude >= NE_INDIA_MIN_LAT && latitude <= NE_INDIA_MAX_LAT
                && longitude >= NE_INDIA_MIN_LON && longitude <= NE_INDIA_MAX_LON;
    }

    /**
     * Clamps a score between minimum (0.0) and maximum (100.0) bounds.
     */
    public static double clampScore(double score) {
        return Math.max(0.0, Math.min(100.0, score));
    }
}
