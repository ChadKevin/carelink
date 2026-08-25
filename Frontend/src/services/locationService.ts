import { apiClient } from './api';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  emergencyContact?: string;
  availableBeds?: number;
}

export const locationService = {
  getNearbyHospitals: async (latitude: number, longitude: number, radiusKm: number = 25): Promise<Hospital[]> => {
    return apiClient<Hospital[]>(
      `/hospitals/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`
    );
  },
};
