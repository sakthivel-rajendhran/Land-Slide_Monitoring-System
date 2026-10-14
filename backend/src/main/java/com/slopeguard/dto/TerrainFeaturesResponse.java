package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;

/**
 * Public response DTO representing digital elevation and calculated slope features
 * derived from a genuine Digital Elevation Model (Copernicus DEM).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TerrainFeaturesResponse {

    private Double requestedLatitude;
    private Double requestedLongitude;
    private Double gridLatitude;
    private Double gridLongitude;
    private Double elevationMeters;
    private Double slopeDegrees;
    private Double aspectDegrees;
    private String demProvider;
    private String productVersion;
    private String rasterResolution;
    private String coordinateReferenceSystem;
    private String retrievalTimestamp;
    private String availabilityStatus; // AVAILABLE, OUT_OF_COVERAGE, NODATA_PIXEL, PROVIDER_UNAVAILABLE
    private String dataQuality;        // VERIFIED_RASTER_DATA, BOUNDARY_OR_NODATA_LIMITATION, UNAVAILABLE
    private List<String> warnings = new ArrayList<>();
    private String sourceProvenance;
    private String slopeAlgorithm;
    private String limitations;

    public TerrainFeaturesResponse() {
    }

    public Double getRequestedLatitude() {
        return requestedLatitude;
    }

    public void setRequestedLatitude(Double requestedLatitude) {
        this.requestedLatitude = requestedLatitude;
    }

    public Double getRequestedLongitude() {
        return requestedLongitude;
    }

    public void setRequestedLongitude(Double requestedLongitude) {
        this.requestedLongitude = requestedLongitude;
    }

    public Double getGridLatitude() {
        return gridLatitude;
    }

    public void setGridLatitude(Double gridLatitude) {
        this.gridLatitude = gridLatitude;
    }

    public Double getGridLongitude() {
        return gridLongitude;
    }

    public void setGridLongitude(Double gridLongitude) {
        this.gridLongitude = gridLongitude;
    }

    public Double getElevationMeters() {
        return elevationMeters;
    }

    public void setElevationMeters(Double elevationMeters) {
        this.elevationMeters = elevationMeters;
    }

    public Double getSlopeDegrees() {
        return slopeDegrees;
    }

    public void setSlopeDegrees(Double slopeDegrees) {
        this.slopeDegrees = slopeDegrees;
    }

    public Double getAspectDegrees() {
        return aspectDegrees;
    }

    public void setAspectDegrees(Double aspectDegrees) {
        this.aspectDegrees = aspectDegrees;
    }

    public String getDemProvider() {
        return demProvider;
    }

    public void setDemProvider(String demProvider) {
        this.demProvider = demProvider;
    }

    public String getProductVersion() {
        return productVersion;
    }

    public void setProductVersion(String productVersion) {
        this.productVersion = productVersion;
    }

    public String getRasterResolution() {
        return rasterResolution;
    }

    public void setRasterResolution(String rasterResolution) {
        this.rasterResolution = rasterResolution;
    }

    public String getCoordinateReferenceSystem() {
        return coordinateReferenceSystem;
    }

    public void setCoordinateReferenceSystem(String coordinateReferenceSystem) {
        this.coordinateReferenceSystem = coordinateReferenceSystem;
    }

    public String getRetrievalTimestamp() {
        return retrievalTimestamp;
    }

    public void setRetrievalTimestamp(String retrievalTimestamp) {
        this.retrievalTimestamp = retrievalTimestamp;
    }

    public String getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(String availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getDataQuality() {
        return dataQuality;
    }

    public void setDataQuality(String dataQuality) {
        this.dataQuality = dataQuality;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public String getSourceProvenance() {
        return sourceProvenance;
    }

    public void setSourceProvenance(String sourceProvenance) {
        this.sourceProvenance = sourceProvenance;
    }

    public String getSlopeAlgorithm() {
        return slopeAlgorithm;
    }

    public void setSlopeAlgorithm(String slopeAlgorithm) {
        this.slopeAlgorithm = slopeAlgorithm;
    }

    public String getLimitations() {
        return limitations;
    }

    public void setLimitations(String limitations) {
        this.limitations = limitations;
    }
}
