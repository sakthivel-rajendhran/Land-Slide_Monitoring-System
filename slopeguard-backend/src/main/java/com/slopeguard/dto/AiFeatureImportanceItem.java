package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO representing an individual feature's contribution in tree partition splits.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiFeatureImportanceItem {

    private String feature;

    @JsonProperty("importance_weight")
    private Double importanceWeight;

    @JsonProperty("interpretation_note")
    private String interpretationNote;

    public AiFeatureImportanceItem() {
    }

    public AiFeatureImportanceItem(String feature, Double importanceWeight, String interpretationNote) {
        this.feature = feature;
        this.importanceWeight = importanceWeight;
        this.interpretationNote = interpretationNote;
    }

    public String getFeature() {
        return feature;
    }

    public void setFeature(String feature) {
        this.feature = feature;
    }

    public Double getImportanceWeight() {
        return importanceWeight;
    }

    public void setImportanceWeight(Double importanceWeight) {
        this.importanceWeight = importanceWeight;
    }

    public String getInterpretationNote() {
        return interpretationNote;
    }

    public void setInterpretationNote(String interpretationNote) {
        this.interpretationNote = interpretationNote;
    }
}
