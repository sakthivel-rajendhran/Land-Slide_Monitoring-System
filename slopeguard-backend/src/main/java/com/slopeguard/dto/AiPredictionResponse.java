package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Structured response returned when evaluating landslide risk via the Python AI microservice.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiPredictionResponse {

    @JsonProperty("prediction_status")
    private String predictionStatus;

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("model_status")
    private String modelStatus;

    @JsonProperty("output_type")
    private String outputType = "UNCALIBRATED_HAZARD_SCORE";

    @JsonProperty("calibration_status")
    private String calibrationStatus = "CALIBRATION_DEFERRED";

    @JsonProperty("threshold_review_status")
    private String thresholdReviewStatus = "PENDING_EXPERT_REVIEW";

    private String timestamp;

    private Map<String, Double> location = new HashMap<>();

    @JsonProperty("input_features_supplied")
    private Map<String, Object> inputFeaturesSupplied = new HashMap<>();

    @JsonProperty("risk_score")
    private Double riskScore;

    @JsonProperty("predicted_class")
    private Integer predictedClass;

    @JsonProperty("risk_category")
    private String riskCategory;

    @JsonProperty("is_provisional_category")
    private Boolean isProvisionalCategory = true;

    @JsonProperty("top_contributing_features")
    private List<AiFeatureImportanceItem> topContributingFeatures = new ArrayList<>();

    private List<String> warnings = new ArrayList<>();

    private String disclaimer;

    public AiPredictionResponse() {
    }

    public String getPredictionStatus() {
        return predictionStatus;
    }

    public void setPredictionStatus(String predictionStatus) {
        this.predictionStatus = predictionStatus;
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

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Map<String, Double> getLocation() {
        return location;
    }

    public void setLocation(Map<String, Double> location) {
        this.location = location;
    }

    public Map<String, Object> getInputFeaturesSupplied() {
        return inputFeaturesSupplied;
    }

    public void setInputFeaturesSupplied(Map<String, Object> inputFeaturesSupplied) {
        this.inputFeaturesSupplied = inputFeaturesSupplied;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
    }

    public Integer getPredictedClass() {
        return predictedClass;
    }

    public void setPredictedClass(Integer predictedClass) {
        this.predictedClass = predictedClass;
    }

    public String getRiskCategory() {
        return riskCategory;
    }

    public void setRiskCategory(String riskCategory) {
        this.riskCategory = riskCategory;
    }

    public Boolean getIsProvisionalCategory() {
        return isProvisionalCategory;
    }

    public void setIsProvisionalCategory(Boolean isProvisionalCategory) {
        this.isProvisionalCategory = isProvisionalCategory;
    }

    public List<AiFeatureImportanceItem> getTopContributingFeatures() {
        return topContributingFeatures;
    }

    public void setTopContributingFeatures(List<AiFeatureImportanceItem> topContributingFeatures) {
        this.topContributingFeatures = topContributingFeatures;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
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

    public String getThresholdReviewStatus() {
        return thresholdReviewStatus;
    }

    public void setThresholdReviewStatus(String thresholdReviewStatus) {
        this.thresholdReviewStatus = thresholdReviewStatus;
    }
}
