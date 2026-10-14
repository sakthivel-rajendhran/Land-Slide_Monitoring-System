package com.slopeguard.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * Raw response model mapped from Open-Meteo's /v1/forecast API.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenMeteoForecastResponse {

    private Double latitude;
    private Double longitude;
    private Double elevation;
    private String timezone;

    @JsonProperty("current_units")
    private Map<String, String> currentUnits;

    private CurrentData current;

    @JsonProperty("hourly_units")
    private Map<String, String> hourlyUnits;

    private HourlyData hourly;

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getElevation() {
        return elevation;
    }

    public void setElevation(Double elevation) {
        this.elevation = elevation;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public Map<String, String> getCurrentUnits() {
        return currentUnits;
    }

    public void setCurrentUnits(Map<String, String> currentUnits) {
        this.currentUnits = currentUnits;
    }

    public CurrentData getCurrent() {
        return current;
    }

    public void setCurrent(CurrentData current) {
        this.current = current;
    }

    public Map<String, String> getHourlyUnits() {
        return hourlyUnits;
    }

    public void setHourlyUnits(Map<String, String> hourlyUnits) {
        this.hourlyUnits = hourlyUnits;
    }

    public HourlyData getHourly() {
        return hourly;
    }

    public void setHourly(HourlyData hourly) {
        this.hourly = hourly;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CurrentData {
        private String time;
        private Integer interval;
        private Double precipitation;
        private Double rain;

        public String getTime() {
            return time;
        }

        public void setTime(String time) {
            this.time = time;
        }

        public Integer getInterval() {
            return interval;
        }

        public void setInterval(Integer interval) {
            this.interval = interval;
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
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class HourlyData {
        private List<String> time;
        private List<Double> precipitation;
        private List<Double> rain;

        public List<String> getTime() {
            return time;
        }

        public void setTime(List<String> time) {
            this.time = time;
        }

        public List<Double> getPrecipitation() {
            return precipitation;
        }

        public void setPrecipitation(List<Double> precipitation) {
            this.precipitation = precipitation;
        }

        public List<Double> getRain() {
            return rain;
        }

        public void setRain(List<Double> rain) {
            this.rain = rain;
        }
    }
}
