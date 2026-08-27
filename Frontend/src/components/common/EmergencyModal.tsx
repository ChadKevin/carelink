import React from 'react';
import { PhoneCall, AlertTriangle, X, ShieldAlert, HeartPulse, MapPin } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocationName?: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  currentLocationName = 'Wardha Rural District, PHC Zone 3',
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#fef2f2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ color: '#991b1b', fontSize: '17px' }}>Emergency Medical Support</h3>
              <p style={{ fontSize: '11px', color: '#b91c1c' }}>24/7 Immediate Tele-Triage & Ambulance</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div
            style={{
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#475569',
              marginBottom: '16px',
            }}
          >
            <MapPin size={16} color="#0284c7" />
            <span>
              <strong>GPS Broadcast Location:</strong> {currentLocationName}
            </span>
          </div>

          <div className="emergency-grid">
            <a
              href="tel:108"
              className="emergency-action-btn primary-call"
              style={{ textDecoration: 'none' }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>National Ambulance Service (108)</div>
                <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '2px' }}>
                  Free emergency ambulance & life support dispatch
                </div>
              </div>
              <div
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                <PhoneCall size={14} /> Call 108
              </div>
            </a>

            <a
              href="tel:104"
              className="emergency-action-btn"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                  Health Helpline & Medical Triage (104)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  24x7 Doctor telephone consultation
                </div>
              </div>
              <div
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                <PhoneCall size={14} /> 104
              </div>
            </a>

            <a
              href="tel:112"
              className="emergency-action-btn"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                  All-in-One Emergency Helpline (112)
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Police, Fire, Disaster & Trauma response
                </div>
              </div>
              <div
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                }}
              >
                <PhoneCall size={14} /> 112
              </div>
            </a>
          </div>

          <div
            style={{
              marginTop: '18px',
              padding: '12px',
              borderRadius: '10px',
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <HeartPulse size={20} color="#d97706" />
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
              Stay calm. If a patient is unconscious, place them in the recovery position and keep airways clear.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyModal;
