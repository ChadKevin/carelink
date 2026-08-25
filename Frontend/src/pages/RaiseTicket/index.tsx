import React, { useState } from 'react';
import { useLocation } from '../../hooks/useLocation';

export const RaiseTicketPage: React.FC = () => {
  const { location } = useLocation();
  const [ticketData, setTicketData] = useState({
    patientName: '',
    age: '',
    gender: 'Male',
    symptoms: '',
    urgencyLevel: 'MEDIUM',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle raise ticket submission with geolocation
  };

  return (
    <div className="page-container raise-ticket-page">
      <h2>Raise Medical Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="patientName">Patient Name</label>
          <input
            id="patientName"
            type="text"
            value={ticketData.patientName}
            onChange={(e) => setTicketData({ ...ticketData, patientName: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="symptoms">Symptoms / Health Issue</label>
          <textarea
            id="symptoms"
            value={ticketData.symptoms}
            onChange={(e) => setTicketData({ ...ticketData, symptoms: e.target.value })}
            rows={4}
            required
          />
        </div>
        <button type="submit">Submit Ticket</button>
      </form>
    </div>
  );
};

export default RaiseTicketPage;
