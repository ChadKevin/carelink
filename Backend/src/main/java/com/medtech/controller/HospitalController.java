package com.medtech.controller;

import com.medtech.dto.HospitalResponse;
import com.medtech.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Map-integration API for the "Hospital Near You" page.
 *
 * <pre>
 * GET /api/hospitals/nearby?lat=20.7453&amp;lng=78.6022&amp;radius=25
 * </pre>
 */
@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<HospitalResponse>> getNearbyHospitals(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestParam(value = "radius", defaultValue = "25") double radius) {

        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            return ResponseEntity.badRequest().build();
        }
        if (radius < 1 || radius > 100) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(hospitalService.findNearby(lat, lng, radius));
    }
}
