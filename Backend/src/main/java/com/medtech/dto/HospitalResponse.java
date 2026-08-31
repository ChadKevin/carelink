package com.medtech.dto;

/**
 * Facility as returned by {@code GET /api/hospitals/nearby}.
 * Field names map 1:1 to the JSON the CareLink frontend expects.
 */
public record HospitalResponse(
        String id,
        String name,
        String address,
        String type,
        double latitude,
        double longitude,
        double distanceKm,
        String phone,
        Integer availableBeds,
        boolean emergency24x7) {
}
