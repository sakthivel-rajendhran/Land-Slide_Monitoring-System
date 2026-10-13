package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Structured response for environmental risk assessments.
 */
public class RiskAssessmentResponse {

    @JsonProperty("request_id")
    private String requestId;

    private Map<String, Object> location = new HashMap<>();

    @JsonProperty("assessment_timestamp")
    private String assessmentTimestamp;

    @JsonProperty("risk_status")
    private String riskStatus; // "ASSESSED", "UNAVAILABLE_MISSING_FEATURES", "UNAVAILABLE_AI_OFFLINE", etc.

    @JsonProperty("model_version")
    private String modelVersion;

    @JsonProperty("model_status")
    private String modelStatus;

    @JsonProperty("available_input_features")
    private Map<String, FeatureProvenanceInfo> availableInputFeatures = new HashMap<>();

    @JsonProperty("data_freshness")
    private String dataFreshness;

    @JsonProperty("data_quality")
    private String dataQuality;

    @JsonProperty("unavailable_inputs")
    private List<String> unavailableInputs = new ArrayList<>();

    @JsonProperty("risk_score")
    private Double riskScore;

    @JsonProperty("risk_category")
    private String riskCategory;

    @JsonProperty("is_provisional_category")
    private Boolean isProvisionalCategory = true;

    @JsonProperty("top_contributing_features")
    private List<AiFeatureImportanceItem> topContributingFeatures = new ArrayList<>();

    @JsonProperty("alert_triggered")
    private Boolean alertTriggered = false;

    @JsonProperty("alert_id")
    private String alertId;

    @JsonProperty("distinction_notice")
    private String distinctionNotice;

    @JsonProperty("output_type")
    private String outputType = "UNCALIBRATED_HAZARD_SCORE";

    @JsonProperty("calibration_status")
    private String calibrationStatus = "CALIBRATION_DEFERRED";

    @JsonProperty("threshold_review_status")
    private String thresholdReviewStatus = "PENDING_EXPERT_REVIEW";

    private List<String> warnings = new ArrayList<>();
    private List<String> limitations = new ArrayList<>();
    private String disclaimer;

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

    public RiskAssessmentResponse() {
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public Map<String, Object> getLocation() {
        return location;
    }

    public void setLocation(Map<String, Object> location) {
        this.location = location;
    }

    public String getAssessmentTimestamp() {
        return assessmentTimestamp;
    }

    public void setAssessmentTimestamp(String assessmentTimestamp) {
        this.assessmentTimestamp = assessmentTimestamp;
    }

    public String getRiskStatus() {
        return riskStatus;
    }

    public void setRiskStatus(String riskStatus) {
        this.riskStatus = riskStatus;
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

    public Map<String, FeatureProvenanceInfo> getAvailableInputFeatures() {
        return availableInputFeatures;
    }

    public void setAvailableInputFeatures(Map<String, FeatureProvenanceInfo> availableInputFeatures) {
        this.availableInputFeatures = availableInputFeatures;
    }

    public String getDataFreshness() {
        return dataFreshness;
    }

    public void setDataFreshness(String dataFreshness) {
        this.dataFreshness = dataFreshness;
    }

    public String getDataQuality() {
        return dataQuality;
    }

    public void setDataQuality(String dataQuality) {
        this.dataQuality = dataQuality;
    }

    public List<String> getUnavailableInputs() {
        return unavailableInputs;
    }

    public void setUnavailableInputs(List<String> unavailableInputs) {
        this.unavailableInputs = unavailableInputs;
    }

    public Double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Double riskScore) {
        this.riskScore = riskScore;
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

    public Boolean getAlertTriggered() {
        return alertTriggered;
    }

    public void setAlertTriggered(Boolean alertTriggered) {
        this.alertTriggered = alertTriggered;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public String getDistinctionNotice() {
        return distinctionNotice;
    }

    public void setDistinctionNotice(String distinctionNotice) {
        this.distinctionNotice = distinctionNotice;
    }

    public List<String> getWarnings() {
        return warnings;
    }

    public void setWarnings(List<String> warnings) {
        this.warnings = warnings;
    }

    public List<String> getLimitations() {
        return limitations;
    }

    public void setLimitations(List<String> limitations) {
        this.limitations = limitations;
    }

    public String getDisclaimer() {
        return disclaimer;
    }

    public void setDisclaimer(String disclaimer) {
        this.disclaimer = disclaimer;
    }
}
