import React, { useState } from 'react';
import { MapPin, X, Navigation, Check } from 'lucide-react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: string;
  onSelectLocation: (loc: string) => void;
}

const suggestedLocations = [
  'Primary Health Centre - Wardha',
  'Community Health Centre - Deoli',
  'Sub-District Hospital - Hinganghat',
  'Rural Wellness Clinic - Arvi',
  'District General Hospital - Nagpur Hub',
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onSelectLocation(customInput.trim());
      setCustomInput('');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#1259cb" />
            <h3>Select Medical Centre / Location</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="location-input-group">
            <input
              type="text"
              placeholder="Enter village, PHC, or hospital name..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-primary">
              Set
            </button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#64748b',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Nearby Health Facilities
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {suggestedLocations.map((loc) => (
                <div
                  key={loc}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: currentLocation === loc ? '#e8f1fd' : '#f8fafc',
                    border: '1px solid',
                    borderColor: currentLocation === loc ? '#93c5fd' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: currentLocation === loc ? '700' : '500',
                    color: currentLocation === loc ? '#1d4ed8' : '#1e293b',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Navigation size={14} color={currentLocation === loc ? '#1d4ed8' : '#64748b'} />
                    <span>{loc}</span>
                  </div>
                  {currentLocation === loc && <Check size={16} color="#1d4ed8" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
