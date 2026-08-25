export interface Ticket {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  symptoms: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  available: boolean;
  phone?: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'HEALTH_WORKER' | 'ADMIN';
}
