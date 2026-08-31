package com.medtech.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.medtech.dto.HospitalResponse;
import com.medtech.entity.FacilityType;
import com.medtech.entity.Hospital;
import com.medtech.repository.HospitalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Powers the "Hospital Near You" page.
 *
 * <p>Resolution strategy for a given GPS point:</p>
 * <ol>
 *   <li><b>Registry first</b> — curated facilities within the requested radius
 *       are served straight from Postgres (fast, reliable demo data for the
 *       Wardha pilot district).</li>
 *   <li><b>Live OpenStreetMap fallback</b> — when the registry has nothing
 *       nearby (e.g. the user is in another city), the Overpass API is queried
 *       for hospitals/clinics around the point and the results are cached in
 *       Postgres for subsequent requests.</li>
 *   <li><b>Wide-radius safety net</b> — if the live lookup fails, the nearest
 *       curated facilities within 100&nbsp;km are returned so the map is never empty.</li>
 * </ol>
 */
@Service
public class HospitalService {

    private static final Logger log = LoggerFactory.getLogger(HospitalService.class);

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double KM_PER_DEGREE_LAT = 111.0;
    private static final double MAX_FALLBACK_RADIUS_KM = 100.0;

    /** Rural indicators that upgrade a generic OSM clinic into a PHC/CHC. */
    private static final Pattern PHC_NAME_PATTERN = Pattern.compile(
            "primary health|\\bphc\\b|community health|\\bchc\\b|rural health|sub[- ]?cent(re|er)|dispensary",
            Pattern.CASE_INSENSITIVE);

    private final HospitalRepository hospitalRepository;
    private final RestClient restClient;
    private final List<String> overpassEndpoints;

    public HospitalService(HospitalRepository hospitalRepository,
                           RestClient.Builder restClientBuilder,
                           @Value("${carelink.overpass.url:https://overpass-api.de/api/interpreter}") String overpassUrl) {
        this.hospitalRepository = hospitalRepository;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        // Overpass can legitimately take 10-20s under load — allow enough headroom
        requestFactory.setReadTimeout(Duration.ofSeconds(20));

        this.restClient = restClientBuilder
                .requestFactory(requestFactory)
                // Overpass rejects requests without a User-Agent
                .defaultHeader("User-Agent", "CareLink-RuralMedTech/1.0 (+https://github.com/ChadKevin/carelink)")
                .build();

        // Primary endpoint + public mirror, so a rate-limited primary doesn't blank the map
        List<String> endpoints = new ArrayList<>();
        endpoints.add(overpassUrl);
        String mirror = "https://overpass.kumi.systems/api/interpreter";
        if (!endpoints.contains(mirror)) {
            endpoints.add(mirror);
        }
        this.overpassEndpoints = List.copyOf(endpoints);
    }

    /**
     * Facilities near a coordinate, sorted by distance (closest first).
     */
    public List<HospitalResponse> findNearby(double lat, double lng, double radiusKm) {
        List<HospitalResponse> curated = findCuratedNearby(lat, lng, radiusKm);
        if (!curated.isEmpty()) {
            log.debug("Serving {} curated facilities within {} km of ({}, {})",
                    curated.size(), radiusKm, lat, lng);
            return curated;
        }

        try {
            List<HospitalResponse> live = findLiveNearby(lat, lng, radiusKm);
            if (!live.isEmpty()) {
                log.info("Served {} live OpenStreetMap facilities near ({}, {})", live.size(), lat, lng);
                return live;
            }
        } catch (RestClientException | IllegalArgumentException e) {
            log.warn("Live OpenStreetMap lookup failed for ({}, {}): {}", lat, lng, e.getMessage());
        }

        log.info("Falling back to curated facilities within {} km", MAX_FALLBACK_RADIUS_KM);
        return findCuratedNearby(lat, lng, MAX_FALLBACK_RADIUS_KM);
    }

    /* ── Registry (Postgres) ─────────────────────────────────────────── */

    private List<HospitalResponse> findCuratedNearby(double lat, double lng, double radiusKm) {
        double[] bbox = boundingBox(lat, lng, radiusKm);
        return hospitalRepository
                .findWithinBoundingBox(bbox[0], bbox[1], bbox[2], bbox[3])
                .stream()
                .map(h -> toResponse(h, lat, lng))
                .filter(r -> r.distanceKm() <= radiusKm)
                .sorted(Comparator.comparingDouble(HospitalResponse::distanceKm))
                .toList();
    }

    /* ── Live OpenStreetMap (Overpass) ───────────────────────────────── */

    private List<HospitalResponse> findLiveNearby(double lat, double lng, double radiusKm) {
        int radiusMeters = (int) Math.round(radiusKm * 1000);
        String around = "around:%d,%.6f,%.6f".formatted(radiusMeters, lat, lng);
        // "out center;" prints tags + coordinates (nodes) / bbox center (ways)
        String query = """
                [out:json][timeout:15];
                (
                  node["amenity"~"^(hospital|clinic)$"](%s);
                  way["amenity"~"^(hospital|clinic)$"](%s);
                );
                out center;
                """.formatted(around, around);

        for (String endpoint : overpassEndpoints) {
            try {
                JsonNode root = restClient.post()
                        .uri(endpoint)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body("data=" + URLEncoder.encode(query, StandardCharsets.UTF_8))
                        .retrieve()
                        .body(JsonNode.class);

                if (root == null || !root.has("elements")) {
                    continue;
                }

                List<Hospital> fetched = new ArrayList<>();
                for (JsonNode element : root.path("elements")) {
                    JsonNode tags = element.path("tags");
                    String name = tags.path("name").asText(null);
                    if (name == null || name.isBlank()) {
                        continue; // unnamed facilities are useless to a patient
                    }

                    double facilityLat = element.path("lat").asDouble(element.path("center").path("lat").asDouble(Double.NaN));
                    double facilityLng = element.path("lon").asDouble(element.path("center").path("lon").asDouble(Double.NaN));
                    if (Double.isNaN(facilityLat) || Double.isNaN(facilityLng)) {
                        continue;
                    }

                    String osmId = element.path("type").asText("node") + "/" + element.path("id").asLong();
                    Hospital hospital = new Hospital();
                    hospital.setOsmId(osmId);
                    hospital.setName(name);
                    hospital.setAddress(buildOsmAddress(tags));
                    hospital.setType(classifyOsmFacility(tags.path("amenity").asText("clinic"), name));
                    hospital.setLatitude(facilityLat);
                    hospital.setLongitude(facilityLng);
                    hospital.setPhone(firstNonBlank(tags.path("phone").asText(null), tags.path("contact:phone").asText(null)));
                    hospital.setAvailableBeds(tags.hasNonNull("beds") ? tags.path("beds").asInt() : null);
                    hospital.setEmergency24x7("yes".equalsIgnoreCase(tags.path("emergency").asText("")));
                    fetched.add(hospital);
                }

                if (fetched.isEmpty()) {
                    continue; // nothing usable from this endpoint — try the next one
                }

                cacheFacilities(fetched);

                return fetched.stream()
                        .map(h -> toResponse(h, lat, lng))
                        .sorted(Comparator.comparingDouble(HospitalResponse::distanceKm))
                        .toList();
            } catch (RestClientException | IllegalArgumentException e) {
                log.warn("Overpass endpoint {} failed for ({}, {}): {}", endpoint, lat, lng, e.getMessage());
            }
        }

        return List.of(); // both endpoints failed — caller falls back to the curated registry
    }

    /** Upsert live OSM facilities so repeat searches are served from Postgres. */
    private void cacheFacilities(List<Hospital> fetched) {
        for (Hospital facility : fetched) {
            try {
                Optional<Hospital> existing = hospitalRepository.findByOsmId(facility.getOsmId());
                if (existing.isPresent()) {
                    Hospital cached = existing.get();
                    cached.setName(facility.getName());
                    cached.setAddress(facility.getAddress());
                    cached.setType(facility.getType());
                    cached.setLatitude(facility.getLatitude());
                    cached.setLongitude(facility.getLongitude());
                    if (facility.getPhone() != null) {
                        cached.setPhone(facility.getPhone());
                    }
                    hospitalRepository.save(cached);
                } else {
                    hospitalRepository.save(facility);
                }
            } catch (Exception e) {
                // A single bad row must never break the map
                log.warn("Could not cache facility {}: {}", facility.getOsmId(), e.getMessage());
            }
        }
    }

    /* ── Helpers ─────────────────────────────────────────────────────── */

    private FacilityType classifyOsmFacility(String amenity, String name) {
        if ("hospital".equals(amenity) && !PHC_NAME_PATTERN.matcher(name).find()) {
            return FacilityType.HOSPITAL;
        }
        if (PHC_NAME_PATTERN.matcher(name).find()) {
            return FacilityType.PHC;
        }
        return FacilityType.CLINIC;
    }

    private String buildOsmAddress(JsonNode tags) {
        String street = firstNonBlank(tags.path("addr:street").asText(null), tags.path("addr:place").asText(null));
        String locality = firstNonBlank(
                tags.path("addr:suburb").asText(null),
                tags.path("addr:village").asText(null),
                tags.path("addr:town").asText(null),
                tags.path("addr:city").asText(null));
        String postcode = tags.path("addr:postcode").asText(null);

        StringBuilder address = new StringBuilder();
        if (street != null) {
            address.append(street);
        }
        if (locality != null) {
            if (address.length() > 0) {
                address.append(", ");
            }
            address.append(locality);
        }
        if (postcode != null) {
            if (address.length() > 0) {
                address.append(" ");
            }
            address.append(postcode);
        }
        return address.length() > 0 ? address.toString() : null;
    }

    private HospitalResponse toResponse(Hospital h, double fromLat, double fromLng) {
        return new HospitalResponse(
                String.valueOf(h.getId()),
                h.getName(),
                h.getAddress(),
                h.getType().name(),
                h.getLatitude(),
                h.getLongitude(),
                haversineKm(fromLat, fromLng, h.getLatitude(), h.getLongitude()),
                h.getPhone(),
                h.getAvailableBeds(),
                h.isEmergency24x7());
    }

    /** Great-circle distance in kilometres (Haversine formula). */
    static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** Square search window (degrees) that fully contains the requested radius. */
    static double[] boundingBox(double lat, double lng, double radiusKm) {
        double latDelta = radiusKm / KM_PER_DEGREE_LAT;
        double cosLat = Math.max(Math.abs(Math.cos(Math.toRadians(lat))), 0.01);
        double lngDelta = radiusKm / (KM_PER_DEGREE_LAT * cosLat);
        return new double[]{lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta};
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
