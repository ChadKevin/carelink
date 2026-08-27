import React, { useState } from 'react';
import {
  MapPin,
  Video,
  Scan,
  FlaskConical,
  Bell,
  Mic,
  ArrowLeftRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Camera,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  X,
  Stethoscope,
  Activity,
  AlertOctagon,
} from 'lucide-react';
import { VoiceAssistantModal } from '../../components/common/VoiceAssistantModal';
import { EmergencyModal } from '../../components/common/EmergencyModal';
import { LocationModal } from '../../components/common/LocationModal';
import { NotificationModal } from '../../components/common/NotificationModal';

interface HomePageProps {
  onNavigate?: (route: string) => void;
}

type ActiveLanguage = 'EN' | 'HI' | 'MR';

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  // Modal states
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Active feature dialog state (for quick action preview)
  const [activeFeatureModal, setActiveFeatureModal] = useState<string | null>(null);

  // Language selection state
  const [activeLang, setActiveLang] = useState<ActiveLanguage>('EN');

  // Location state
  const [currentLocation, setCurrentLocation] = useState<string>('Wardha Rural District');

  const cycleLanguage = () => {
    if (activeLang === 'EN') setActiveLang('HI');
    else if (activeLang === 'HI') setActiveLang('MR');
    else setActiveLang('EN');
  };

  const handleCardClick = (cardType: string) => {
    if (onNavigate) {
      if (cardType === 'hospital') {
        onNavigate('nearby-hospitals');
        return;
      } else if (cardType === 'doctor') {
        onNavigate('raise-ticket');
        return;
      }
    }
    setActiveFeatureModal(cardType);
  };

  return (
    <div className="medtech-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="location-section" onClick={() => setIsLocationModalOpen(true)}>
          <div className="location-title-row">
            <h1 className="location-heading">Location</h1>
          </div>
          <button
            type="button"
            className="location-chip"
            title="Click to change location"
            style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left' }}
          >
            <MapPin size={14} color="#1259cb" />
            <span>{currentLocation}</span>
          </button>
        </div>

        <div className="header-actions">
          {/* Language Selector Pill */}
          <div
            className="language-pill"
            onClick={cycleLanguage}
            title="Switch Language (English / Hindi / Marathi)"
          >
            <span className={`lang-segment ${activeLang === 'EN' ? 'active' : ''}`}>EN</span>
            <span className="lang-divider">|</span>
            <span className={`lang-segment ${activeLang === 'HI' ? 'active' : ''}`}>HI</span>
            <span className="lang-divider">|</span>
            <span className={`lang-segment ${activeLang === 'MR' ? 'active' : ''}`}>MR</span>
            <span className="lang-switch-icon">
              <ArrowLeftRight size={13} />
            </span>
          </div>

          {/* Notification Bell Button */}
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsNotificationModalOpen(true)}
            aria-label="View notifications"
          >
            <Bell size={19} />
            <span className="notification-badge"></span>
          </button>
        </div>
      </header>

      {/* Main Hero: "Tap to Speak" Voice Card */}
      <section
        className="hero-voice-card"
        onClick={() => setIsVoiceModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Tap to speak voice assistant"
      >
        <div className="mic-circle-btn">
          <div className="mic-pulse-ring"></div>
          <Mic className="mic-icon" />
        </div>
        <h2 className="hero-voice-title">Tap to Speak</h2>
        <p className="hero-voice-subtitle">
          Describe your health issue or ask any medical question
        </p>
      </section>

      {/* 2x2 Feature Cards Grid */}
      <section className="action-grid" aria-label="Healthcare Services">
        {/* Card 1: Hospital Near You */}
        <div
          className="action-card"
          onClick={() => handleCardClick('hospital')}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-badge hospital">
            <MapPin size={22} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Hospital Near You</h3>
            <p className="card-description">
              Locate nearby PHCs, clinics & live emergency beds
            </p>
          </div>
        </div>

        {/* Card 2: Talk to a Doctor */}
        <div
          className="action-card"
          onClick={() => handleCardClick('doctor')}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-badge doctor">
            <Video size={22} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Talk to a Doctor</h3>
            <p className="card-description">
              Connect with verified tele-health physicians
            </p>
          </div>
        </div>

        {/* Card 3: Scan a Problem */}
        <div
          className="action-card"
          onClick={() => handleCardClick('scan')}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-badge scan">
            <Scan size={22} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Scan a Problem</h3>
            <p className="card-description">
              Upload prescription, rash or wound photo for analysis
            </p>
          </div>
        </div>

        {/* Card 4: Lab / X-Ray */}
        <div
          className="action-card"
          onClick={() => handleCardClick('lab')}
          role="button"
          tabIndex={0}
        >
          <div className="card-icon-badge lab">
            <FlaskConical size={22} />
          </div>
          <div className="card-content">
            <h3 className="card-title">Lab / X-Ray</h3>
            <p className="card-description">
              Book diagnostic tests, blood work or view radiology
            </p>
          </div>
        </div>
      </section>

      {/* Emergency Action Banner */}
      <section
        className="emergency-banner"
        onClick={() => setIsEmergencyModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Call for Help or Emergency"
      >
        <div className="emergency-icon-badge">
          <AlertOctagon size={24} color="#ffffff" />
        </div>
        <div className="emergency-content">
          <h3 className="emergency-title">Call for Help / Emergency</h3>
          <p className="emergency-subtitle">
            24/7 instant ambulance dispatch & emergency medical response
          </p>
        </div>
      </section>

      {/* Interactive Feature Modal (Quick Details for Scan / Lab / Doctor / Hospital) */}
      {activeFeatureModal && (
        <div className="modal-backdrop" onClick={() => setActiveFeatureModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeFeatureModal === 'scan' && <Camera size={20} color="#e65100" />}
                {activeFeatureModal === 'lab' && <FlaskConical size={20} color="#5e35b1" />}
                {activeFeatureModal === 'doctor' && <Stethoscope size={20} color="#00897b" />}
                {activeFeatureModal === 'hospital' && <MapPin size={20} color="#1976d2" />}
                <h3>
                  {activeFeatureModal === 'scan' && 'Scan a Problem & Symptoms'}
                  {activeFeatureModal === 'lab' && 'Lab Tests & Diagnostic Booking'}
                  {activeFeatureModal === 'doctor' && 'Telehealth Doctor Consultation'}
                  {activeFeatureModal === 'hospital' && 'Nearby Healthcare Facilities'}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setActiveFeatureModal(null)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {activeFeatureModal === 'scan' && (
                <div>
                  <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '16px' }}>
                    Capture or upload a clear photo of your skin condition, visible injury, or medical prescription for instant AI assessment.
                  </p>
                  <div
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '16px',
                      padding: '28px 16px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      marginBottom: '16px',
                    }}
                  >
                    <Camera size={38} color="#e65100" style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                      Tap here to take photo or upload file
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>
                      PNG, JPG, PDF supported up to 10MB
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      alert('Image scanner initialized. Ready for diagnosis.');
                      setActiveFeatureModal(null);
                    }}
                  >
                    Start AI Diagnostic Scan
                  </button>
                </div>
              )}

              {activeFeatureModal === 'lab' && (
                <div>
                  <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
                    Select diagnostic service or view available mobile lab testing units in your area:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div className="emergency-action-btn" style={{ background: '#f8fafc' }}>
                      <div>
                        <strong>Complete Blood Count (CBC) & Sugar</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Doorstep sample collection available</div>
                      </div>
                      <span className="info-status-pill ready">Available</span>
                    </div>
                    <div className="emergency-action-btn" style={{ background: '#f8fafc' }}>
                      <div>
                        <strong>Chest X-Ray & Digital Radiology</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Wardha Sub-District Radiology Lab</div>
                      </div>
                      <span className="info-status-pill">Walk-in</span>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      alert('Lab appointment request placed!');
                      setActiveFeatureModal(null);
                    }}
                  >
                    Book Diagnostic Test
                  </button>
                </div>
              )}

              {activeFeatureModal === 'doctor' && (
                <div>
                  <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '14px' }}>
                    Connect directly with an available rural medical officer or specialist:
                  </p>
                  <div style={{ padding: '12px', borderRadius: '10px', background: '#e0f6f4', marginBottom: '16px' }}>
                    <div style={{ fontWeight: '700', color: '#00695c', fontSize: '14px' }}>
                      Dr. Rajesh Deshmukh, MBBS (On-Call)
                    </div>
                    <div style={{ fontSize: '12px', color: '#004d40', marginTop: '2px' }}>
                      General Medicine • Average wait time: ~3 mins
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', background: '#00897b' }}
                    onClick={() => {
                      alert('Initiating tele-consultation call...');
                      setActiveFeatureModal(null);
                    }}
                  >
                    Start Instant Video Call
                  </button>
                </div>
              )}

              {activeFeatureModal === 'hospital' && (
                <div>
                  <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '12px' }}>
                    Closest healthcare facilities with real-time bed & doctor availability:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <div className="info-card" style={{ margin: 0 }}>
                      <div className="info-card-header">
                        <strong>Wardha Civil District Hospital</strong>
                        <span className="info-status-pill ready">12 ICU Beds Open</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>Distance: 3.2 km • 24x7 Trauma Care</p>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => {
                      if (onNavigate) onNavigate('nearby-hospitals');
                      setActiveFeatureModal(null);
                    }}
                  >
                    View All Nearby Hospitals
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        currentLocationName={currentLocation}
      />

      {/* Location Selector Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentLocation}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />

      {/* Notifications Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </div>
  );
};

export default HomePage;
