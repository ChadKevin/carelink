package com.medtech.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * A healthcare facility that can be shown on the "Hospital Near You" map.
 *
 * <p>Rows come from two sources:</p>
 * <ul>
 *   <li>Curated records seeded at startup (the Wardha pilot district registry), and</li>
 *   <li>Live OpenStreetMap lookups, cached here via {@code osmId} so repeat
 *       searches are served straight from Postgres.</li>
 * </ul>
 *
 * <p>Accessors are written explicitly (instead of Lombok) so the entity
 * compiles on every JDK, including JDK 23+ where implicit annotation
 * processing is disabled by default.</p>
 */
@Entity
@Table(
        name = "hospitals",
        indexes = {
                @Index(name = "idx_hospital_osm_id", columnList = "osm_id", unique = true),
                @Index(name = "idx_hospital_coords", columnList = "latitude, longitude")
        }
)
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * OpenStreetMap identity of a live-sourced facility, e.g. {@code "node/1234567890"}.
     * {@code null} for curated registry records.
     */
    @Column(name = "osm_id", length = 64, unique = true)
    private String osmId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 512)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private FacilityType type;

    @Column(nullable = false)
    private double latitude;

    @Column(nullable = false)
    private double longitude;

    @Column(length = 32)
    private String phone;

    @Column(name = "available_beds")
    private Integer availableBeds;

    @Column(name = "emergency_24x7", nullable = false)
    private boolean emergency24x7;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Hospital() {
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOsmId() {
        return osmId;
    }

    public void setOsmId(String osmId) {
        this.osmId = osmId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public FacilityType getType() {
        return type;
    }

    public void setType(FacilityType type) {
        this.type = type;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Integer getAvailableBeds() {
        return availableBeds;
    }

    public void setAvailableBeds(Integer availableBeds) {
        this.availableBeds = availableBeds;
    }

    public boolean isEmergency24x7() {
        return emergency24x7;
    }

    public void setEmergency24x7(boolean emergency24x7) {
        this.emergency24x7 = emergency24x7;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
