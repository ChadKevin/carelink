import { apiClient } from './api';

export interface LoginCredentials {
  email: string;
  password?: string;
  otp?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  role: string;
  password?: string;
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    return apiClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (payload: RegisterPayload) => {
    return apiClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCurrentUser: async () => {
    return apiClient('/auth/me');
  },
};
