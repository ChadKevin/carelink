import React, { useState, useEffect } from 'react';
import { Mic, X, Sparkles, Volume2, ArrowRight } from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionText: string) => void;
}

const sampleSuggestions = [
  'I have high fever and body ache since morning',
  'Find nearest hospital with available ICU beds',
  'How to treat a burn wound immediately?',
  'Connect me with a general physician doctor',
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [isListening, setIsListening] = useState<boolean>(true);
  const [transcript, setTranscript] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      setTranscript('Listening... Speak now');
      setAiResponse(null);

      // Simulate listening and transcribing
      const timer = setTimeout(() => {
        setTranscript('“Severe abdominal pain and dizziness for 2 hours”');
        setIsListening(false);
        setAiResponse(
          'Triage Assessment: Moderate-High urgency detected. We recommend connecting to an on-call emergency doctor or visiting the nearest Community Health Centre.'
        );
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectQuery = (query: string) => {
    setIsListening(false);
    setTranscript(`“${query}”`);
    setAiResponse(`Analyzing: "${query}". Processing medical assistance...`);
    if (onSelectAction) {
      onSelectAction(query);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#1259cb" />
            <h3>Voice Medical Assistant</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              margin: '0 auto 16px auto',
              borderRadius: '50%',
              background: isListening
                ? 'linear-gradient(135deg, #1055c8 0%, #1e6de6 100%)'
                : '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 10px 25px rgba(18, 89, 203, 0.35)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => setIsListening(!isListening)}
          >
            <Mic size={36} color={isListening ? '#ffffff' : '#64748b'} />
          </div>

          <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
            {isListening ? 'Listening to your symptoms...' : 'Voice Processed'}
          </h4>
          <p style={{ fontSize: '14px', color: '#64748b', minHeight: '24px' }}>
            {transcript}
          </p>

          {isListening && (
            <div className="waveform-container">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}

          {aiResponse && (
            <div
              style={{
                marginTop: '20px',
                padding: '14px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#15803d',
                  fontWeight: '700',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}
              >
                <Volume2 size={16} /> Instant AI Voice Triage
              </div>
              <p style={{ fontSize: '13px', color: '#166534', lineHeight: 1.4 }}>
                {aiResponse}
              </p>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'left' }}>
            <p
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Quick Voice Questions:
            </p>
            <div className="quick-queries">
              {sampleSuggestions.map((query, index) => (
                <button
                  key={index}
                  className="query-chip"
                  onClick={() => handleSelectQuery(query)}
                >
                  {query} <ArrowRight size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantModal;
