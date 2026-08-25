import { apiClient } from './api';

export interface CreateTicketPayload {
  patientName: string;
  age: number;
  gender: string;
  symptoms: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  latitude?: number;
  longitude?: number;
}

export const ticketService = {
  createTicket: async (payload: CreateTicketPayload) => {
    return apiClient('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getTickets: async () => {
    return apiClient('/tickets');
  },

  getTicketById: async (ticketId: string) => {
    return apiClient(`/tickets/${ticketId}`);
  },

  updateTicketStatus: async (ticketId: string, status: string) => {
    return apiClient(`/tickets/${ticketId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
