package com.slopeguard.service;

import com.slopeguard.config.OpenMeteoProperties;
import com.slopeguard.dto.OpenMeteoForecastResponse;
import com.slopeguard.exception.EnvironmentalProviderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.Locale;

/**
 * Standard HTTP implementation of {@link OpenMeteoClient} leveraging Spring's {@link RestClient}.
 */
@Component
public class DefaultOpenMeteoClient implements OpenMeteoClient {

    private static final Logger log = LoggerFactory.getLogger(DefaultOpenMeteoClient.class);

    private final OpenMeteoProperties properties;
    private final RestClient restClient;

    @org.springframework.beans.factory.annotation.Autowired
    public DefaultOpenMeteoClient(OpenMeteoProperties properties) {
        this.properties = properties;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()));
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("User-Agent", "SlopeGuard-Landslide-Monitoring/1.0 (Northeast-India; Open-Meteo-Integration)")
                .build();
    }

    // Alternative constructor for testing with mock RestClient
    public DefaultOpenMeteoClient(OpenMeteoProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    @Override
    public OpenMeteoForecastResponse fetchForecast(double latitude, double longitude) {
        URI requestUri = UriComponentsBuilder.fromUriString(properties.getBaseUrl())
                .queryParam("latitude", String.format(Locale.ROOT, "%.4f", latitude))
                .queryParam("longitude", String.format(Locale.ROOT, "%.4f", longitude))
                .queryParam("current", "precipitation,rain")
                .queryParam("hourly", "precipitation,rain")
                .queryParam("forecast_days", 1)
                .queryParam("timezone", "auto")
                .build()
                .toUri();

        log.info("Contacting Open-Meteo API at URI: {}", requestUri);

        try {
            OpenMeteoForecastResponse response = restClient.get()
                    .uri(requestUri)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        String errorBody = new String(res.getBody().readAllBytes());
                        log.warn("Open-Meteo responded with error status {}: {}", res.getStatusCode(), errorBody);
                        throw new EnvironmentalProviderException(
                                "Open-Meteo API returned error status: " + res.getStatusCode().value()
                        );
                    })
                    .body(OpenMeteoForecastResponse.class);

            if (response == null) {
                throw new EnvironmentalProviderException("Open-Meteo returned an empty response body.");
            }

            return response;
        } catch (ResourceAccessException ex) {
            log.error("Network or timeout error contacting Open-Meteo: {}", ex.getMessage());
            throw new EnvironmentalProviderException("Environmental data provider connection timed out or failed.", ex);
        } catch (RestClientResponseException ex) {
            log.error("HTTP error from Open-Meteo: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new EnvironmentalProviderException("Environmental data provider returned HTTP error: " + ex.getStatusCode().value(), ex);
        } catch (EnvironmentalProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Unexpected error querying Open-Meteo: {}", ex.getMessage(), ex);
            throw new EnvironmentalProviderException("Failed to retrieve environmental data from Open-Meteo.", ex);
        }
    }
}
