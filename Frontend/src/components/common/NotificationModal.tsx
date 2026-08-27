import React from 'react';
import { Bell, X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications = [
  {
    id: 1,
    title: 'Doctor Appointment Confirmed',
    desc: 'Dr. Sharma is scheduled for your tele-consultation at 4:30 PM.',
    time: '10 mins ago',
    type: 'success',
  },
  {
    id: 2,
    title: 'Lab Report Ready for Download',
    desc: 'Complete Blood Count (CBC) report is now available under Reports.',
    time: '2 hours ago',
    type: 'info',
  },
  {
    id: 3,
    title: 'Immunization Camp Tomorrow',
    desc: 'Free health & immunization checkup at Wardha Community Health Centre.',
    time: '1 day ago',
    type: 'alert',
  },
];

export const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#1259cb" />
            <h3>Notifications</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mockNotifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {n.type === 'success' && <CheckCircle2 size={18} color="#16a34a" />}
                  {n.type === 'info' && <Clock size={18} color="#0284c7" />}
                  {n.type === 'alert' && <AlertCircle size={18} color="#d97706" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#1e293b' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                    {n.desc}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    {n.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
