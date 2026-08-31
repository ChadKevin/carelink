package com.medtech.entity;

/**
 * Category of healthcare facility rendered on the "Hospital Near You" map.
 */
public enum FacilityType {
    /** Full-service hospital (surgery, emergency, in-patient). */
    HOSPITAL,
    /** Primary / Community Health Centre — the rural first point of care. */
    PHC,
    /** Small private clinic or dispensary. */
    CLINIC
}
