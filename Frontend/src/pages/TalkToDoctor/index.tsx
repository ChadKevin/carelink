import React, { useState } from 'react';
import {
  Video,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  X,
  Calendar,
  CheckCircle2,
  Phone,
  Stethoscope,
} from 'lucide-react';

/* ─── Data ──────────────────────────────────────────────────────────── */

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Doctor {
  id: number;
  name: string;
  qualification: string;
  specialty: string;
  hospital: string;
  location: string;
  experience: number;
  rating: number;
  reviewCount: number;
  fee: number;
  avatar: string; // initials fallback
  availableToday: boolean;
  nextAvailable: string;
  languages: string[];
  slots: { label: string; times: TimeSlot[] }[];
}

const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Rajesh Deshmukh',
    qualification: 'MBBS, MD (General Medicine)',
    specialty: 'General Medicine',
    hospital: 'Wardha Civil District Hospital',
    location: 'Wardha, Maharashtra',
    experience: 12,
    rating: 4.8,
    reviewCount: 234,
    fee: 200,
    avatar: 'RD',
    availableToday: true,
    nextAvailable: 'Today',
    languages: ['Hindi', 'Marathi', 'English'],
    slots: [
      {
        label: 'Morning',
        times: [
          { time: '09:00 AM', available: true },
          { time: '09:30 AM', available: false },
          { time: '10:00 AM', available: true },
          { time: '10:30 AM', available: true },
          { time: '11:00 AM', available: false },
          { time: '11:30 AM', available: true },
        ],
      },
      {
        label: 'Evening',
        times: [
          { time: '05:00 PM', available: true },
          { time: '05:30 PM', available: true },
          { time: '06:00 PM', available: false },
          { time: '06:30 PM', available: true },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Dr. Priya Kulkarni',
    qualification: 'MBBS, DNB (Paediatrics)',
    specialty: 'Paediatrician',
    hospital: 'Community Health Centre – Deoli',
    location: 'Deoli, Wardha Dist.',
    experience: 8,
    rating: 4.9,
    reviewCount: 187,
    fee: 150,
    avatar: 'PK',
    availableToday: true,
    nextAvailable: 'Today',
    languages: ['Marathi', 'Hindi'],
    slots: [
      {
        label: 'Morning',
        times: [
          { time: '08:30 AM', available: false },
          { time: '09:00 AM', available: true },
          { time: '09:30 AM', available: true },
          { time: '10:00 AM', available: true },
        ],
      },
      {
        label: 'Afternoon',
        times: [
          { time: '02:00 PM', available: true },
          { time: '02:30 PM', available: false },
          { time: '03:00 PM', available: true },
          { time: '03:30 PM', available: true },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Dr. Suresh Nagpure',
    qualification: 'MBBS, MS (Orthopaedics)',
    specialty: 'Orthopaedic Surgeon',
    hospital: 'Sub-District Hospital – Hinganghat',
    location: 'Hinganghat, Wardha Dist.',
    experience: 15,
    rating: 4.7,
    reviewCount: 312,
    fee: 300,
    avatar: 'SN',
    availableToday: false,
    nextAvailable: 'Tomorrow 10 AM',
    languages: ['Hindi', 'English'],
    slots: [
      {
        label: 'Tomorrow Morning',
        times: [
          { time: '10:00 AM', available: true },
          { time: '10:30 AM', available: true },
          { time: '11:00 AM', available: true },
          { time: '11:30 AM', available: false },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Dr. Meena Thakre',
    qualification: 'MBBS, DGO (Gynaecology)',
    specialty: 'Gynaecologist & Obstetrician',
    hospital: 'Rural Wellness Clinic – Arvi',
    location: 'Arvi, Wardha Dist.',
    experience: 10,
    rating: 4.6,
    reviewCount: 143,
    fee: 250,
    avatar: 'MT',
    availableToday: true,
    nextAvailable: 'Today',
    languages: ['Marathi', 'Hindi'],
    slots: [
      {
        label: 'Morning',
        times: [
          { time: '09:00 AM', available: true },
          { time: '09:30 AM', available: true },
          { time: '10:00 AM', available: false },
          { time: '10:30 AM', available: true },
        ],
      },
      {
        label: 'Evening',
        times: [
          { time: '04:30 PM', available: true },
          { time: '05:00 PM', available: false },
          { time: '05:30 PM', available: true },
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'Dr. Anil Wankhade',
    qualification: 'MBBS, MD (Psychiatry)',
    specialty: 'Psychiatrist',
    hospital: 'District General Hospital – Nagpur Hub',
    location: 'Nagpur, Maharashtra',
    experience: 18,
    rating: 4.9,
    reviewCount: 89,
    fee: 400,
    avatar: 'AW',
    availableToday: false,
    nextAvailable: 'Tomorrow 3 PM',
    languages: ['Hindi', 'Marathi', 'English'],
    slots: [
      {
        label: 'Tomorrow Afternoon',
        times: [
          { time: '03:00 PM', available: true },
          { time: '03:30 PM', available: true },
          { time: '04:00 PM', available: false },
          { time: '04:30 PM', available: true },
        ],
      },
    ],
  },
];

/* ─── Avatar colour palette (cycled) ─────────────────────────────── */
const AVATAR_COLORS = [
  { bg: '#e8f1fd', text: '#1259cb' },
  { bg: '#e0f6f4', text: '#00897b' },
  { bg: '#fff0ea', text: '#e65100' },
  { bg: '#f0eafb', text: '#5e35b1' },
  { bg: '#fef3cd', text: '#a16207' },
];

/* ─── Component ─────────────────────────────────────────────────── */

export const TalkToDoctorPage: React.FC = () => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('All');

  const specialties = ['All', ...Array.from(new Set(DOCTORS.map((d) => d.specialty)))];

  const filtered =
    filterSpecialty === 'All'
      ? DOCTORS
      : DOCTORS.filter((d) => d.specialty === filterSpecialty);

  const handleConfirmBooking = () => {
    if (!selectedSlot) return;
    setBookingConfirmed(true);
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setBookingConfirmed(false);
  };

  return (
    <div className="ttd-page">
      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="ttd-hero">
        <div className="ttd-hero-text">
          <h2 className="ttd-hero-title">Talk to a Doctor</h2>
          <p className="ttd-hero-sub">
            Connect with verified rural health specialists via secure video call — anytime, anywhere.
          </p>
        </div>
        <div className="ttd-hero-icon">
          <Video size={40} strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Specialty Filter Pills ───────────────────────────── */}
      <div className="ttd-filter-row" role="tablist" aria-label="Filter by specialty">
        {specialties.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={filterSpecialty === s}
            className={`ttd-filter-pill ${filterSpecialty === s ? 'active' : ''}`}
            onClick={() => setFilterSpecialty(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Doctor Cards ─────────────────────────────────────── */}
      <div className="ttd-cards-list">
        {filtered.map((doc, idx) => {
          const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          return (
            <div key={doc.id} className="ttd-card">
              {/* Card Top */}
              <div className="ttd-card-top">
                {/* Avatar */}
                <div
                  className="ttd-avatar"
                  style={{ background: color.bg, color: color.text }}
                  aria-label={doc.name}
                >
                  {doc.avatar}
                </div>

                {/* Info */}
                <div className="ttd-card-info">
                  <div className="ttd-card-name-row">
                    <h3 className="ttd-card-name">{doc.name}</h3>
                    {doc.availableToday && (
                      <span className="ttd-badge-online">● Available</span>
                    )}
                  </div>
                  <p className="ttd-card-qual">{doc.qualification}</p>
                  <span className="ttd-specialty-tag">
                    <Stethoscope size={11} />
                    {doc.specialty}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="ttd-card-divider" />

              {/* Meta row */}
              <div className="ttd-card-meta">
                <div className="ttd-meta-item">
                  <MapPin size={13} />
                  <span>{doc.hospital}</span>
                </div>
                <div className="ttd-meta-item">
                  <Clock size={13} />
                  <span>{doc.experience} yrs exp.</span>
                </div>
                <div className="ttd-meta-item">
                  <Star size={13} className="ttd-star" />
                  <span>
                    {doc.rating} <em>({doc.reviewCount})</em>
                  </span>
                </div>
              </div>

              {/* Languages */}
              <div className="ttd-lang-row">
                {doc.languages.map((l) => (
                  <span key={l} className="ttd-lang-chip">{l}</span>
                ))}
              </div>

              {/* Footer */}
              <div className="ttd-card-footer">
                <div className="ttd-fee">
                  <span className="ttd-fee-label">Consult fee</span>
                  <span className="ttd-fee-amount">FREE</span>
                </div>
                <div className="ttd-avail-label">
                  <Calendar size={12} />
                  {doc.nextAvailable}
                </div>
                <button
                  type="button"
                  className="ttd-contact-btn"
                  onClick={() => setSelectedDoctor(doc)}
                  aria-label={`Book appointment with ${doc.name}`}
                >
                  Book Slot
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Slot Booking Modal ────────────────────────────────── */}
      {selectedDoctor && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            className="modal-card ttd-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Book appointment with ${selectedDoctor.name}`}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="ttd-modal-header-left">
                <div
                  className="ttd-avatar ttd-avatar-sm"
                  style={{
                    background:
                      AVATAR_COLORS[
                        DOCTORS.findIndex((d) => d.id === selectedDoctor.id) %
                          AVATAR_COLORS.length
                      ].bg,
                    color:
                      AVATAR_COLORS[
                        DOCTORS.findIndex((d) => d.id === selectedDoctor.id) %
                          AVATAR_COLORS.length
                      ].text,
                  }}
                >
                  {selectedDoctor.avatar}
                </div>
                <div>
                  <h3 className="ttd-modal-doc-name">{selectedDoctor.name}</h3>
                  <p className="ttd-modal-doc-spec">{selectedDoctor.specialty}</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body ttd-modal-body">
              {bookingConfirmed ? (
                /* ── Confirmation Screen ── */
                <div className="ttd-confirm">
                  <div className="ttd-confirm-icon">
                    <CheckCircle2 size={52} />
                  </div>
                  <h3 className="ttd-confirm-title">Appointment Confirmed!</h3>
                  <p className="ttd-confirm-sub">
                    Your video consultation with <strong>{selectedDoctor.name}</strong> is booked
                    for <strong>{selectedSlot}</strong>.
                  </p>
                  <div className="ttd-confirm-detail">
                    <div className="ttd-confirm-row">
                      <MapPin size={14} />
                      <span>{selectedDoctor.hospital}</span>
                    </div>
                    <div className="ttd-confirm-row">
                      <Phone size={14} />
                      <span>You'll receive a call link via SMS</span>
                    </div>
                    <div className="ttd-confirm-row">
                      <Video size={14} />
                      <span>Consult fee: FREE</span>
                    </div>
                  </div>
                  <button type="button" className="btn-primary ttd-confirm-btn" onClick={closeModal}>
                    Done
                  </button>
                </div>
              ) : (
                /* ── Slot Selection ── */
                <>
                  <p className="ttd-modal-info-text">
                    <MapPin size={13} />
                    {selectedDoctor.hospital} &bull; {selectedDoctor.location}
                  </p>

                  <div className="ttd-slots-wrapper">
                    {selectedDoctor.slots.map((group) => (
                      <div key={group.label} className="ttd-slot-group">
                        <div className="ttd-slot-group-label">{group.label}</div>
                        <div className="ttd-slot-grid">
                          {group.times.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              className={`ttd-slot-btn
                                ${!slot.available ? 'disabled' : ''}
                                ${selectedSlot === slot.time ? 'selected' : ''}
                              `}
                              onClick={() => slot.available && setSelectedSlot(slot.time)}
                              aria-pressed={selectedSlot === slot.time}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ttd-modal-fee-row">
                    <span className="ttd-modal-fee-text">
                      Consultation fee: <strong>FREE</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn-primary ttd-book-btn"
                    disabled={!selectedSlot}
                    onClick={handleConfirmBooking}
                  >
                    <Video size={16} />
                    {selectedSlot ? `Confirm ${selectedSlot} Video Call` : 'Select a Time Slot'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalkToDoctorPage;
