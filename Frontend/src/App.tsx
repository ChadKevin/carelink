import React, { useState } from 'react';
import { Home, FileText, User, Download, Shield, Phone } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/Home';
import { NearbyHospitalsPage } from './pages/NearbyHospitals';
import { TalkToDoctorPage } from './pages/TalkToDoctor';
import { SubPageLayout } from './components/common/SubPageLayout';

type NavigationTab = 'home' | 'reports' | 'profile' | 'nearby-hospitals' | 'raise-ticket';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');

  const goHome = () => setCurrentTab('home');

  return (
    <AuthProvider>
      <div className="app-viewport">
        <main className="device-frame">

          {/* ── Home ─────────────────────────────────────────── */}
          {currentTab === 'home' && (
            <HomePage onNavigate={(route) => setCurrentTab(route as NavigationTab)} />
          )}

          {/* ── Talk to a Doctor ──────────────────────────────── */}
          {currentTab === 'raise-ticket' && (
            <SubPageLayout title="Talk to a Doctor" onBack={goHome}>
              <TalkToDoctorPage />
            </SubPageLayout>
          )}

          {/* ── Nearby Hospitals ─────────────────────────────── */}
          {currentTab === 'nearby-hospitals' && (
            <SubPageLayout title="Hospital Near You" onBack={goHome}>
              <NearbyHospitalsPage />
            </SubPageLayout>
          )}

          {/* ── Reports ──────────────────────────────────────── */}
          {currentTab === 'reports' && (
            <div className="medtech-container sub-view-container">
              <div className="sub-view-header">
                <h2>Medical Records &amp; Reports</h2>
                <p>Access your past prescriptions, lab tests, and clinical summaries.</p>
              </div>

              <div className="info-card">
                <div className="info-card-header">
                  <div>
                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                      Complete Blood Count (CBC)
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Wardha PHC Central Lab • 24 Aug 2026
                    </div>
                  </div>
                  <span className="info-status-pill ready">Ready</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                    Normal Hemoglobin &amp; Platelets
                  </span>
                  <button className="icon-btn" style={{ width: '32px', height: '32px' }} title="Download Report">
                    <Download size={15} />
                  </button>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-header">
                  <div>
                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                      Telehealth Doctor Prescription
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Dr. Rajesh Deshmukh • 18 Aug 2026
                    </div>
                  </div>
                  <span className="info-status-pill ready">Active Rx</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Paracetamol 650mg, ORS Hydration
                  </span>
                  <button className="icon-btn" style={{ width: '32px', height: '32px' }} title="Download Prescription">
                    <Download size={15} />
                  </button>
                </div>
              </div>

              <div className="info-card">
                <div className="info-card-header">
                  <div>
                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>
                      Chest X-Ray Digital Scan
                    </strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Rural Radiology Unit • 02 Aug 2026
                    </div>
                  </div>
                  <span className="info-status-pill">Archived</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Profile ──────────────────────────────────────── */}
          {currentTab === 'profile' && (
            <div className="medtech-container sub-view-container">
              <div className="sub-view-header">
                <h2>Patient Profile &amp; ABHA</h2>
                <p>Digital Health Card &amp; Registered Beneficiary Info.</p>
              </div>

              <div
                className="info-card"
                style={{
                  background: 'linear-gradient(135deg, #1055c8 0%, #1e6de6 100%)',
                  color: '#ffffff',
                  border: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85 }}>
                      Digital Ayushman Bharat Health Account
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '4px' }}>
                      Girish Kumar
                    </div>
                  </div>
                  <Shield size={28} color="#ffffff" />
                </div>
                <div style={{ marginTop: '16px', fontSize: '13px', letterSpacing: '1px' }}>
                  ABHA ID: <strong>91-8842-4910-3321</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', opacity: 0.9 }}>
                  <span>Blood: O+</span>
                  <span>Age: 28</span>
                  <span>Wardha District</span>
                </div>
              </div>

              <div className="info-card">
                <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>
                  Emergency Primary Contacts
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Ramesh Kumar (Brother)</span>
                    <a
                      href="tel:+919876543210"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1259cb', textDecoration: 'none', fontWeight: '600' }}
                    >
                      <Phone size={13} /> +91 98765 43210
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Bottom Navigation Bar ─────────────────────────── */}
          <nav className="bottom-nav">
            <div className="bottom-nav-inner">
              <button
                type="button"
                className={`nav-item ${currentTab === 'home' ? 'active' : ''}`}
                onClick={goHome}
              >
                <Home className="nav-icon" />
                <span className="nav-label">HOME</span>
              </button>

              <button
                type="button"
                className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
                onClick={() => setCurrentTab('reports')}
              >
                <FileText className="nav-icon" />
                <span className="nav-label">REPORTS</span>
              </button>

              <button
                type="button"
                className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
                onClick={() => setCurrentTab('profile')}
              >
                <User className="nav-icon" />
                <span className="nav-label">PROFILE</span>
              </button>
            </div>
          </nav>

        </main>
      </div>
    </AuthProvider>
  );
};

export default App;
