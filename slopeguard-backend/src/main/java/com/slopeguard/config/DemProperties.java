package com.slopeguard.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration settings for the Digital Elevation Model (DEM) and terrain feature extraction.
 */
@Component
@ConfigurationProperties(prefix = "slopeguard.environmental.dem")
public class DemProperties {

    /**
     * Whether the DEM terrain feature provider is enabled.
     */
    private boolean enabled = true;

    /**
     * Name of the primary DEM provider organization.
     */
    private String providerName = "Copernicus DEM (ESA)";

    /**
     * Specific DEM dataset product title and version.
     */
    private String productName = "GLO-30 Public Copernicus DSM";

    /**
     * Horizontal spatial resolution of the raster.
     */
    private String resolution = "1 arc-second (~30m)";

    /**
     * Coordinate Reference System used by the raster.
     */
    private String crs = "EPSG:4326 (WGS 84)";

    /**
     * Local raster dataset file path or classpath location.
     */
    private String localRasterPath = "classpath:dem/copernicus_dem_glo30_shillong.asc";

    /**
     * In-memory cache time-to-live in minutes for terrain lookups.
     */
    private long cacheTtlMinutes = 60;

    /**
     * Maximum number of entries retained in the LRU terrain cache.
     */
    private int cacheMaxEntries = 1000;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public String getCrs() {
        return crs;
    }

    public void setCrs(String crs) {
        this.crs = crs;
    }

    public String getLocalRasterPath() {
        return localRasterPath;
    }

    public void setLocalRasterPath(String localRasterPath) {
        this.localRasterPath = localRasterPath;
    }

    public long getCacheTtlMinutes() {
        return cacheTtlMinutes;
    }

    public void setCacheTtlMinutes(long cacheTtlMinutes) {
        this.cacheTtlMinutes = cacheTtlMinutes;
    }

    public int getCacheMaxEntries() {
        return cacheMaxEntries;
    }

    public void setCacheMaxEntries(int cacheMaxEntries) {
        this.cacheMaxEntries = cacheMaxEntries;
    }
}
