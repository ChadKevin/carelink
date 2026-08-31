package com.medtech.bootstrap;

import com.medtech.entity.FacilityType;
import com.medtech.entity.Hospital;
import com.medtech.repository.HospitalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the facility registry with real hospitals / PHCs / clinics of the
 * Wardha pilot district (coordinates are approximate but realistic) so the
 * "Hospital Near You" map is populated out of the box. Rows are only inserted
 * when the table is empty; live OpenStreetMap lookups take over for any other
 * user location.
 */
@Component
public class HospitalSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(HospitalSeeder.class);

    private final HospitalRepository hospitalRepository;

    public HospitalSeeder(HospitalRepository hospitalRepository) {
        this.hospitalRepository = hospitalRepository;
    }

    @Override
    public void run(String... args) {
        if (hospitalRepository.count() > 0) {
            return;
        }

        List<Hospital> seed = List.of(
                facility("Wardha Civil District Hospital",
                        "Civil Lines, Wardha, Maharashtra 442001",
                        FacilityType.HOSPITAL, 20.7396, 78.6088, "+91 7152 241 200", 64, true),
                facility("Kasturba Hospital, Sevagram (MGIMS)",
                        "Sevagram, Wardha, Maharashtra 442102",
                        FacilityType.HOSPITAL, 20.7420, 78.6490, "+91 7152 284 100", 150, true),
                facility("AVBR Hospital, Sawangi (Meghe)",
                        "Sawangi (Meghe), Wardha, Maharashtra 442001",
                        FacilityType.HOSPITAL, 20.8745, 78.7035, "+91 7152 250 300", 90, true),
                facility("Sub-District Hospital – Hinganghat",
                        "Main Road, Hinganghat, Wardha Dist. 442301",
                        FacilityType.HOSPITAL, 20.5472, 78.9412, "+91 7153 244 050", 45, true),
                facility("Community Health Centre – Deoli",
                        "Deoli, Wardha, Maharashtra 442101",
                        FacilityType.PHC, 20.7708, 78.4896, "+91 7154 233 010", 30, false),
                facility("Primary Health Centre – Arvi",
                        "Arvi, Wardha Dist., Maharashtra 442305",
                        FacilityType.PHC, 20.9946, 78.2394, "+91 7156 232 040", 12, false),
                facility("Primary Health Centre – Seloo",
                        "Seloo, Wardha Dist., Maharashtra 442104",
                        FacilityType.PHC, 20.8593, 78.4106, "+91 7155 231 020", 10, false),
                facility("Rural Wellness Clinic – Arvi",
                        "Bus Stand Road, Arvi, Wardha Dist. 442305",
                        FacilityType.CLINIC, 20.9980, 78.2450, "+91 7156 235 060", 4, false),
                facility("Jankalyan Eye & Maternity Clinic",
                        "Mahatma Gandhi Chowk, Wardha 442001",
                        FacilityType.CLINIC, 20.7440, 78.6010, "+91 7152 242 070", 8, false),
                facility("Urban Health Post – Nalanda Square",
                        "Nalanda Square, Wardha 442001",
                        FacilityType.CLINIC, 20.7480, 78.5980, null, 6, false),

                // ── Prayagraj / MNNIT belt (secondary pilot district) ──
                facility("MNNIT Campus Health Centre",
                        "Motilal Nehru National Institute of Technology, Teliarganj, Prayagraj 211004",
                        FacilityType.CLINIC, 25.4930, 81.8620, "+91 532 227 1200", 10, false),
                facility("Tej Bahadur Sapru (Beli) Hospital",
                        "Beli Road, Civil Lines, Prayagraj 211001",
                        FacilityType.HOSPITAL, 25.4630, 81.8480, "+91 532 241 0455", 55, true),
                facility("Swaroop Rani Nehru (SRN) Hospital",
                        "Colvin Road, George Town, Prayagraj 211001",
                        FacilityType.HOSPITAL, 25.4420, 81.8320, "+91 532 241 0955", 120, true),
                facility("Kamla Nehru Memorial Hospital",
                        "Civil Lines, Prayagraj 211001",
                        FacilityType.HOSPITAL, 25.4530, 81.8450, "+91 532 240 0522", 70, true),
                facility("Bose Memorial Hospital",
                        "Civil Lines, Prayagraj 211001",
                        FacilityType.HOSPITAL, 25.4520, 81.8370, "+91 532 240 0810", 25, false),
                facility("United Medicity, Ashok Nagar",
                        "Ashok Nagar, Naini Road, Prayagraj 211008",
                        FacilityType.HOSPITAL, 25.4250, 81.8560, "+91 532 710 1000", 35, true),
                facility("Govindpur Local Clinic",
                        "Govindpur, Teliarganj, Prayagraj 211004",
                        FacilityType.CLINIC, 25.4850, 81.8590, "+91 532 227 0455", 5, false),
                facility("Urban PHC – Chaka Dih",
                        "Chaka Dih, Prayagraj 211008",
                        FacilityType.PHC, 25.4360, 81.8800, "+91 532 255 0230", 12, false)
        );

        hospitalRepository.saveAll(seed);
        log.info("Seeded {} curated Wardha-district facilities into the registry", seed.size());
    }

    private static Hospital facility(String name, String address, FacilityType type,
                                     double latitude, double longitude, String phone,
                                     Integer availableBeds, boolean emergency24x7) {
        Hospital hospital = new Hospital();
        hospital.setName(name);
        hospital.setAddress(address);
        hospital.setType(type);
        hospital.setLatitude(latitude);
        hospital.setLongitude(longitude);
        hospital.setPhone(phone);
        hospital.setAvailableBeds(availableBeds);
        hospital.setEmergency24x7(emergency24x7);
        return hospital;
    }
}
