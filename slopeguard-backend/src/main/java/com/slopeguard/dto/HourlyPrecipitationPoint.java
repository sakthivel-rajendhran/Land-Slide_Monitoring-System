package com.slopeguard.dto;

/**
 * Data point representing an hourly precipitation forecast value.
 */
public class HourlyPrecipitationPoint {

    private String timestamp;
    private Double precipitation;
    private Double rain;
    private String unit;

    public HourlyPrecipitationPoint() {
    }

    public HourlyPrecipitationPoint(String timestamp, Double precipitation, Double rain, String unit) {
        this.timestamp = timestamp;
        this.precipitation = precipitation;
        this.rain = rain;
        this.unit = unit;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Double getPrecipitation() {
        return precipitation;
    }

    public void setPrecipitation(Double precipitation) {
        this.precipitation = precipitation;
    }

    public Double getRain() {
        return rain;
    }

    public void setRain(Double rain) {
        this.rain = rain;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}
