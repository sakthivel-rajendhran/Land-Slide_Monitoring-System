package com.slopeguard.service;

import com.slopeguard.config.OpenMeteoProperties;
import com.slopeguard.dto.EnvironmentalStatusResponse;
import com.slopeguard.dto.HourlyPrecipitationPoint;
import com.slopeguard.dto.OpenMeteoForecastResponse;
import com.slopeguard.dto.RainfallForecastResponse;
import com.slopeguard.dto.RainfallMeasurementResponse;
import com.slopeguard.exception.EnvironmentalProviderDisabledException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Thread-safe implementation of {@link EnvironmentalDataService} managing real-time Open-Meteo
 * queries, grid-cell caching, and operational health metrics.
 */
@Service
public class DefaultEnvironmentalDataService implements EnvironmentalDataService {

    private static final Logger log = LoggerFactory.getLogger(DefaultEnvironmentalDataService.class);

    private static final String SOURCE_ATTRIBUTION = "Weather data by Open-Meteo.com, licensed under CC BY 4.0";
    private static final String SOURCE_DOCUMENTATION = "https://open-meteo.com/en/docs";
    private static final String CURRENT_DISCLAIMER =
            "Weather-model estimate for atmospheric grid cell; not a physical ground rain gauge reading or standalone landslide prediction.";
    private static final String FORECAST_DISCLAIMER =
            "Numerical weather prediction projection; does not constitute a guaranteed physical measurement or standalone landslide prediction.";

    private final OpenMeteoProperties properties;
    private final OpenMeteoClient openMeteoClient;

    private final Map<String, CachedForecastEntry> cache = new ConcurrentHashMap<>();

    private final AtomicReference<Instant> lastAttemptedRetrieval = new AtomicReference<>(null);
    private final AtomicReference<Instant> lastSuccessfulRetrieval = new AtomicReference<>(null);
    private final AtomicReference<String> latestFailureReason = new AtomicReference<>(null);

    public DefaultEnvironmentalDataService(OpenMeteoProperties properties, OpenMeteoClient openMeteoClient) {
        this.properties = properties;
        this.openMeteoClient = openMeteoClient;
    }

    @Override
    public RainfallMeasurementResponse getCurrentRainfall(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);
        checkProviderEnabled();

        CachedDataResult result = getOrFetchForecast(latitude, longitude);
        OpenMeteoForecastResponse data = result.response;
        String freshness = result.freshness;

        Double precip = (data.getCurrent() != null) ? data.getCurrent().getPrecipitation() : null;
        Double rain = (data.getCurrent() != null) ? data.getCurrent().getRain() : null;
        String obsTime = (data.getCurrent() != null) ? data.getCurrent().getTime() : null;
        String quality = (precip != null) ? "VALIDATED" : "INCOMPLETE_DATA";

        return new RainfallMeasurementResponse(
                "Open-Meteo",
                latitude,
                longitude,
                data.getLatitude(),
                data.getLongitude(),
                data.getElevation(),
                "CURRENT_MODEL_ESTIMATE",
                precip,
                rain,
                "mm",
                obsTime,
                Instant.now(),
                freshness,
                quality,
                false,
                SOURCE_ATTRIBUTION,
                SOURCE_DOCUMENTATION,
                CURRENT_DISCLAIMER
        );
    }

    @Override
    public RainfallForecastResponse getRainfallForecast(double latitude, double longitude) {
        validateCoordinates(latitude, longitude);
        checkProviderEnabled();

        CachedDataResult result = getOrFetchForecast(latitude, longitude);
        OpenMeteoForecastResponse data = result.response;
        String freshness = result.freshness;

        List<HourlyPrecipitationPoint> hourlyPoints = new ArrayList<>();
        if (data.getHourly() != null && data.getHourly().getTime() != null) {
            List<String> times = data.getHourly().getTime();
            List<Double> precips = data.getHourly().getPrecipitation();
            List<Double> rains = data.getHourly().getRain();

            for (int i = 0; i < times.size(); i++) {
                String t = times.get(i);
                Double p = (precips != null && i < precips.size()) ? precips.get(i) : null;
                Double r = (rains != null && i < rains.size()) ? rains.get(i) : null;
                hourlyPoints.add(new HourlyPrecipitationPoint(t, p, r, "mm"));
            }
        }

        return new RainfallForecastResponse(
                "Open-Meteo",
                latitude,
                longitude,
                data.getLatitude(),
                data.getLongitude(),
                data.getElevation(),
                "HOURLY_FORECAST",
                "mm",
                Instant.now(),
                freshness,
                false,
                SOURCE_ATTRIBUTION,
                SOURCE_DOCUMENTATION,
                FORECAST_DISCLAIMER,
                Collections.unmodifiableList(hourlyPoints)
        );
    }

    @Override
    public EnvironmentalStatusResponse getProviderStatus() {
        boolean enabled = properties.isEnabled();
        Instant lastSuccess = lastSuccessfulRetrieval.get();
        Instant lastAttempt = lastAttemptedRetrieval.get();
        String failure = latestFailureReason.get();

        boolean usableData = (lastSuccess != null);
        boolean stale = (lastSuccess == null ||
                Duration.between(lastSuccess, Instant.now()).toMinutes() > (properties.getCacheTtlMinutes() * 2L));

        return new EnvironmentalStatusResponse(
                "Open-Meteo",
                enabled,
                lastSuccess,
                lastAttempt,
                failure,
                usableData,
                stale,
                SOURCE_ATTRIBUTION,
                SOURCE_DOCUMENTATION
        );
    }

    private CachedDataResult getOrFetchForecast(double latitude, double longitude) {
        String cacheKey = String.format(Locale.ROOT, "%.3f,%.3f", latitude, longitude);
        CachedForecastEntry cached = cache.get(cacheKey);

        if (cached != null && Instant.now().isBefore(cached.expiresAt)) {
            log.debug("Returning cached Open-Meteo forecast for key: {}", cacheKey);
            return new CachedDataResult(cached.response, "CACHED");
        }

        lastAttemptedRetrieval.set(Instant.now());
        try {
            OpenMeteoForecastResponse fetched = openMeteoClient.fetchForecast(latitude, longitude);
            lastSuccessfulRetrieval.set(Instant.now());
            latestFailureReason.set(null);

            Instant expiresAt = Instant.now().plus(properties.getCacheTtlMinutes(), ChronoUnit.MINUTES);
            cache.put(cacheKey, new CachedForecastEntry(fetched, expiresAt));

            return new CachedDataResult(fetched, "FRESH");
        } catch (Exception ex) {
            String sanitizedError = (ex.getMessage() != null) ? ex.getMessage() : "Provider request failure";
            latestFailureReason.set(sanitizedError);
            throw ex;
        }
    }

    private void validateCoordinates(double latitude, double longitude) {
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException(String.format(
                    Locale.ROOT, "Invalid latitude value '%.4f': must be between -90.0 and 90.0.", latitude
            ));
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException(String.format(
                    Locale.ROOT, "Invalid longitude value '%.4f': must be between -180.0 and 180.0.", longitude
            ));
        }
    }

    private void checkProviderEnabled() {
        if (!properties.isEnabled()) {
            throw new EnvironmentalProviderDisabledException(
                    "Open-Meteo environmental rainfall integration is administratively disabled."
            );
        }
    }

    private record CachedForecastEntry(OpenMeteoForecastResponse response, Instant expiresAt) {}
    private record CachedDataResult(OpenMeteoForecastResponse response, String freshness) {}
}
