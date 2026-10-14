package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

/**
 * DTO reflecting AI model readiness, training provenance, and governance status.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiModelStatusResponse {

    @JsonProperty("service_status")
    private String serviceStatus;

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("model_status")
    private String modelStatus;

    @JsonProperty("artifact_loaded")
    private Boolean artifactLoaded;

    @JsonProperty("training_dataset_type")
    private String trainingDatasetType;

    @JsonProperty("evaluation_summary")
    private Map<String, Object> evaluationSummary;

    @JsonProperty("output_type")
    private String outputType = "UNCALIBRATED_HAZARD_SCORE";

    @JsonProperty("calibration_status")
    private String calibrationStatus = "CALIBRATION_DEFERRED";

    @JsonProperty("threshold_set_version")
    private String thresholdSetVersion = "1.0.0-candidate";

    @JsonProperty("threshold_review_status")
    private String thresholdReviewStatus = "PENDING_EXPERT_REVIEW";

    @JsonProperty("data_readiness_status")
    private String dataReadinessStatus = "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION";

    @JsonProperty("uncertainty_notice")
    private String uncertaintyNotice;

    private String disclaimer;
    private String timestamp;

    public AiModelStatusResponse() {
    }

    public String getOutputType() {
        return outputType;
    }

    public void setOutputType(String outputType) {
        this.outputType = outputType;
    }

    public String getCalibrationStatus() {
        return calibrationStatus;
    }

    public void setCalibrationStatus(String calibrationStatus) {
        this.calibrationStatus = calibrationStatus;
    }

    public String getThresholdSetVersion() {
        return thresholdSetVersion;
    }

    public void setThresholdSetVersion(String thresholdSetVersion) {
        this.thresholdSetVersion = thresholdSetVersion;
    }

    public String getThresholdReviewStatus() {
        return thresholdReviewStatus;
    }

    public void setThresholdReviewStatus(String thresholdReviewStatus) {
        this.thresholdReviewStatus = thresholdReviewStatus;
    }

    public String getDataReadinessStatus() {
        return dataReadinessStatus;
    }

    public void setDataReadinessStatus(String dataReadinessStatus) {
        this.dataReadinessStatus = dataReadinessStatus;
    }

    public String getUncertaintyNotice() {
        return uncertaintyNotice;
    }

    public void setUncertaintyNotice(String uncertaintyNotice) {
        this.uncertaintyNotice = uncertaintyNotice;
    }

    public String getServiceStatus() {
        return serviceStatus;
    }

    public void setServiceStatus(String serviceStatus) {
        this.serviceStatus = serviceStatus;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public String getModelStatus() {
        return modelStatus;
    }

    public void setModelStatus(String modelStatus) {
        this.modelStatus = modelStatus;
    }

    public Boolean getArtifactLoaded() {
        return artifactLoaded;
    }

    public void setArtifactLoaded(Boolean artifactLoaded) {
        this.artifactLoaded = artifactLoaded;
    }

    public String getTrainingDatasetType() {
        return trainingDatasetType;
    }

    public void setTrainingDatasetType(String trainingDatasetType) {
        this.trainingDatasetType = trainingDatasetType;
    }

    public Map<String, Object> getEvaluationSummary() {
        return evaluationSummary;
    }

    public void setEvaluationSummary(Map<String, Object> evaluationSummary) {
        this.evaluationSummary = evaluationSummary;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
