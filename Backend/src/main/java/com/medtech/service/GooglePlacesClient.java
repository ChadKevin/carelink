package com.medtech.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.medtech.entity.FacilityType;
import com.medtech.entity.Hospital;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Optional Google Places (Text Search) integration for the "Hospital Near You" page.
 *
 * <p>When {@code carelink.google.maps.api-key} is configured, facilities around a
 * coordinate are resolved against Google's Places database — the most complete and
 * accurate source for healthcare facilities in any city or village — before the
 * OpenStreetMap/Overpass fallback is tried. Facilities are tagged with their Google
 * {@code place_id} (stored in {@code hospitals.osm_id} with a {@code place/} prefix)
 * so repeated searches for the same area hit the Postgres cache.</p>
 *
 * <p>Fully optional: without a key this client returns an empty list and the
 * existing OpenStreetMap path is used unchanged.</p>
 */
@Component
public class GooglePlacesClient {

    private static final Logger log = LoggerFactory.getLogger(GooglePlacesClient.class);

    /** Terms that suggest a Google result is a rural primary-care facility. */
    private static final Pattern PHC_PATTERN = Pattern.compile(
            "primary health|\\bphc\\b|community health|\\bchc\\b|rural health|health post|"
                    + "sub[- ]?cent(re|er)|dispensary",
            Pattern.CASE_INSENSITIVE);

    /** Terms that suggest a Google result is a clinic / non-hospital care centre. */
    private static final Pattern CLINIC_PATTERN = Pattern.compile(
            "clinic|polyclinic|wellness|health centre|health center|\\bopd\\b|health care|healthcare|medical store",
            Pattern.CASE_INSENSITIVE);

    /** Terms that strongly suggest a Google result really is a hospital. */
    private static final Pattern HOSPITAL_PATTERN = Pattern.compile(
            "hospital|medical centre|medical center|nursing home|multi[- ]?specialit|super[- ]?specialit|"
                    + "institute|\\bcares\\b|trust|ashram|nursing",
            Pattern.CASE_INSENSITIVE);

    /** Places Text Search caps the search radius at 50,000 metres. */
    private static final int MAX_RADIUS_METERS = 50_000;

    private static final List<String> SEARCH_QUERIES =
            List.of("hospitals", "clinics", "primary health centre community health centre");

    private final RestClient restClient;
    private final String apiKey;
    private final String textSearchEndpoint;

    public GooglePlacesClient(RestClient.Builder restClientBuilder,
                              @Value("${carelink.google.maps.api-key:}") String apiKey,
                              @Value("${carelink.google.maps.api-root:https://maps.googleapis.com/maps/api/place}") String apiRoot) {
        String cleanKey = apiKey == null ? null : apiKey.replace("\"", "").trim();
        this.apiKey = (cleanKey == null || cleanKey.isBlank()) ? null : cleanKey;
        this.textSearchEndpoint =
                (apiRoot == null || apiRoot.isBlank()
                        ? "https://maps.googleapis.com/maps/api/place"
                        : apiRoot) + "/textsearch/json";

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(12));
        this.restClient = restClientBuilder.requestFactory(requestFactory).build();
    }

    /** Whether a Google Places API key has been configured. */
    public boolean isConfigured() {
        return apiKey != null;
    }
/**
     * Searches hospitals / clinics / PHCs around a coordinate via Google Places Text
     * Search. Results are deduped by place_id and returned as new (uncached) Hospital
     * entities ready for the caller to persist and serve.
     */
    public List<Hospital> findHospitalsNear(double lat, double lng, double radiusKm) {
        if (!isConfigured()) {
            return List.of();
        }
        int radiusMeters = (int) Math.round(Math.min(radiusKm, MAX_RADIUS_METERS / 1000.0) * 1000);

        Map<String, Hospital> byPlaceId = new LinkedHashMap<>();
        for (String query : SEARCH_QUERIES) {
            try {
                List<Hospital> page = search(query, lat, lng, radiusMeters);
                for (Hospital hospital : page) {
                    byPlaceId.putIfAbsent(hospital.getOsmId(), hospital);
                }
            } catch (RestClientException | IllegalArgumentException e) {
                log.warn("Google Places text search '{}' failed: {}", query, e.getMessage());
            }
        }
        return new ArrayList<>(byPlaceId.values());
    }

    private List<Hospital> search(String query, double lat, double lng, int radiusMeters) {
        String params = "query=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&location=" + lat + "," + lng
                + "&radius=" + radiusMeters
                + "&region=in&language=en&key=" + apiKey;

        JsonNode root = restClient.get()
                .uri(textSearchEndpoint + "?" + params)
                .retrieve()
                .body(JsonNode.class);

        if (root == null) {
            return List.of();
        }
        String status = root.path("status").asText("");
        if (!"OK".equals(status) && !"ZERO_RESULTS".equals(status)) {
            log.warn("Google Places text search returned status {} — {}",
                    status, root.path("error_message").asText(""));
            return List.of();
        }

        List<Hospital> results = new ArrayList<>();
        for (JsonNode result : root.path("results")) {
            String placeId = result.path("place_id").asText(null);
            String name = result.path("name").asText(null);
            double placeLat = result.path("geometry").path("location").path("lat").asDouble(Double.NaN);
            double placeLng = result.path("geometry").path("location").path("lng").asDouble(Double.NaN);
            if (placeId == null || placeId.isBlank() || name == null || name.isBlank()
                    || Double.isNaN(placeLat) || Double.isNaN(placeLng)) {
                continue;
            }

            Hospital hospital = new Hospital();
            hospital.setOsmId("place/" + placeId);
            hospital.setName(name);
            hospital.setAddress(result.path("formatted_address").asText(null));
            hospital.setType(classify(result.path("types"), name));
            hospital.setLatitude(placeLat);
            hospital.setLongitude(placeLng);
            hospital.setPhone(result.path("international_phone_number").asText(null));
            // Google Places does not expose live bed counts — leave null so the frontend
            // hides the bed field instead of showing fabricated numbers.
            hospital.setAvailableBeds(null);
            hospital.setEmergency24x7(false);
            results.add(hospital);
        }
        return results;
    }

    /**
     * Google result → our facility type. Name heuristics first, Google's type tags
     * second, hospital by default (a Google hit within a health search is normally a
     * real hospital when nothing else matches).
     */
    private FacilityType classify(JsonNode types, String name) {
        if (PHC_PATTERN.matcher(name).find()) {
            return FacilityType.PHC;
        }
        if (CLINIC_PATTERN.matcher(name).find()) {
            return FacilityType.CLINIC;
        }
        if (HOSPITAL_PATTERN.matcher(name).find()) {
            return FacilityType.HOSPITAL;
        }
        for (JsonNode type : types) {
            String tag = type.asText("");
            if ("hospital".equals(tag) || "health".equals(tag)) {
                return FacilityType.HOSPITAL;
            }
            if ("doctor".equals(tag) || "dentist".equals(tag) || "physiotherapist".equals(tag)
                    || "pharmacy".equals(tag)) {
                return FacilityType.CLINIC;
            }
        }
        return FacilityType.HOSPITAL;
    }
}