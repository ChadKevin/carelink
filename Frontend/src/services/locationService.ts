import { apiClient } from './api';

export type FacilityType = 'HOSPITAL' | 'PHC' | 'CLINIC';

export interface Hospital {
  id: string;
  name: string;
  address: string | null;
  type: FacilityType;
  latitude: number;
  longitude: number;
  distanceKm: number;
  phone?: string | null;
  availableBeds?: number | null;
  emergency24x7?: boolean;
}

export interface NearbyFacilitiesQuery {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

/* ─── OpenStreetMap Overpass (live fallback) ────────────────────────── */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const PHC_NAME_PATTERN =
  /primary health|\bphc\b|community health|\bchc\b|rural health|sub[- ]?cent(re|er)|dispensary/i;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const classifyOsmFacility = (amenity: string, name: string): FacilityType => {
  if (amenity === 'hospital' && !PHC_NAME_PATTERN.test(name)) return 'HOSPITAL';
  if (PHC_NAME_PATTERN.test(name)) return 'PHC';
  return 'CLINIC';
};

/** Great-circle distance in kilometres (mirrors the backend's Haversine). */
export const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const overpassQuery = (lat: number, lng: number, radiusKm: number): string => {
  const around = `around:${Math.round(radiusKm * 1000)},${lat},${lng}`;
  return [
    '[out:json][timeout:20];',
    '(',
    `node["amenity"~"^(hospital|clinic)$"](${around});`,
    `way["amenity"~"^(hospital|clinic)$"](${around});`,
    ');',
    // "out center;" prints tags + coordinates (nodes) / bbox center (ways)
    'out center;',
  ].join('');
};

export const locationService = {
  /**
   * Nearby facilities from the CareLink backend (Postgres registry with live
   * OpenStreetMap caching). Primary source for the map.
   */
  getNearbyHospitals: async ({
    latitude,
    longitude,
    radiusKm = 25,
  }: NearbyFacilitiesQuery): Promise<Hospital[]> => {
    return apiClient<Hospital[]>(
      `/hospitals/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`
    );
  },

  /**
   * Live OpenStreetMap lookup straight from the browser — graceful fallback so
   * the map keeps working during a demo even if the backend is unreachable.
   */
  getNearbyHospitalsViaOSM: async ({
    latitude,
    longitude,
    radiusKm = 25,
  }: NearbyFacilitiesQuery): Promise<Hospital[]> => {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery(latitude, longitude, radiusKm))}`,
    });
    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const data = await response.json();
    const elements: OverpassElement[] = data?.elements ?? [];

    return elements
      .filter((el) => {
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        return Boolean(el.tags?.name) && Number.isFinite(lat) && Number.isFinite(lon);
      })
      .map((el) => {
        const lat = (el.lat ?? el.center?.lat) as number;
        const lon = (el.lon ?? el.center?.lon) as number;
        const tags = el.tags ?? {};
        const addressBits = [
          tags['addr:street'],
          tags['addr:suburb'] || tags['addr:village'] || tags['addr:city'],
          tags['addr:postcode'],
        ].filter(Boolean);
        return {
          id: `osm-${el.type}-${el.id}`,
          name: tags.name,
          address: addressBits.length ? addressBits.join(', ') : null,
          type: classifyOsmFacility(tags.amenity ?? 'clinic', tags.name),
          latitude: lat,
          longitude: lon,
          distanceKm: haversineKm(latitude, longitude, lat, lon),
          phone: tags.phone || tags['contact:phone'] || null,
          availableBeds: tags.beds ? parseInt(tags.beds, 10) : null,
          emergency24x7: tags.emergency === 'yes',
        } as Hospital;
      })
      .filter((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 30);
  },
};
