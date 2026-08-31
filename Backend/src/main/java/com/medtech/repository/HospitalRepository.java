package com.medtech.repository;

import com.medtech.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HospitalRepository extends JpaRepository<Hospital, Long> {

    Optional<Hospital> findByOsmId(String osmId);

    /**
     * Cheap bounding-box pre-filter so we only compute Haversine distances for
     * candidates that are roughly within range. Precise filtering + sorting
     * happens in {@link com.medtech.service.HospitalService}.
     */
    @Query("""
            SELECT h FROM Hospital h
            WHERE h.latitude  BETWEEN :minLat AND :maxLat
              AND h.longitude BETWEEN :minLng AND :maxLng
            """)
    List<Hospital> findWithinBoundingBox(@Param("minLat") double minLat,
                                         @Param("maxLat") double maxLat,
                                         @Param("minLng") double minLng,
                                         @Param("maxLng") double maxLng);
}
