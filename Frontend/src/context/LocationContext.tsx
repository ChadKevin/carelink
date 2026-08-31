import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  searchPlaces,
  geocodeSuggestion,
  reverseGeocode,
  type PlaceSuggestion,
} from '../services/googleMapsService';

export interface Coords {
  lat: number;
  lng: number;
}

interface LocationContextValue {
  /** Human-readable current location (e.g. "Wardha, Maharashtra, India"). */
  label: string;
  /** Resolved GPS/search coordinates, or null before the user picks one. */
  coords: Coords | null;
  isLocating: boolean;
  /** Directly set both label + coordinates (e.g. after geocoding a search). */
  setPlace: (label: string, coords: Coords) => void;
  /** Resolve a search suggestion to coordinates and apply it. */
  geocodeAndSetPlace: (suggestion: PlaceSuggestion) => Promise<boolean>;
  /** Geocode a free-text label (from the top bar) and apply it. */
  resolveAndSetPlace: (query: string) => Promise<boolean>;
  /** Place suggestions for the search box (Google Places or Nominatim). */
  searchPlaces: (query: string) => Promise<PlaceSuggestion[]>;
  /** Ask the browser for the user's real GPS position. */
  requestGps: () => Promise<void>;
}

const DEFAULT_LABEL = 'Wardha Rural District';

const LOCATION_LABEL_KEY = 'carelink_location_value';
const LOCATION_COORDS_KEY = 'carelink_location_coords';

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [label, setLabel] = useState<string>(() =>
    localStorage.getItem(LOCATION_LABEL_KEY) ?? DEFAULT_LABEL
  );
  const [coords, setCoords] = useState<Coords | null>(() => {
    const raw = localStorage.getItem(LOCATION_COORDS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Number.isFinite(parsed?.lat) && Number.isFinite(parsed?.lng)) {
          return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
        }
      } catch {
        /* corrupted storage — ignore */
      }
    }
    return null;
  });
  const [isLocating, setIsLocating] = useState(false);

  const setPlace = useCallback((nextLabel: string, nextCoords: Coords) => {
    setLabel(nextLabel);
    setCoords(nextCoords);
    localStorage.setItem(LOCATION_LABEL_KEY, nextLabel);
    localStorage.setItem(LOCATION_COORDS_KEY, JSON.stringify(nextCoords));
  }, []);

  const geocodeAndSetPlace = useCallback(
    async (suggestion: PlaceSuggestion): Promise<boolean> => {
      try {
        const { lat, lng, label: resolvedLabel } = await geocodeSuggestion(suggestion);
        setPlace(resolvedLabel || suggestion.description, { lat, lng });
        return true;
      } catch {
        return false;
      }
    },
    [setPlace]
  );

  const resolveAndSetPlace = useCallback(
    async (query: string): Promise<boolean> => {
      try {
        const suggestions = await searchPlaces(query);
        if (suggestions.length === 0) {
          return false;
        }
        return await geocodeAndSetPlace(suggestions[0]);
      } catch {
        return false;
      }
    },
    [geocodeAndSetPlace]
  );

  const requestGps = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      return;
    }
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });
      const { latitude, longitude } = position.coords;
      const resolvedLabel = await reverseGeocode(latitude, longitude);
      setPlace(resolvedLabel, { lat: latitude, lng: longitude });
    } catch {
      // GPS denied / unavailable — keep whatever the user had selected.
    } finally {
      setIsLocating(false);
    }
  }, [setPlace]);

  const searchLocal = useCallback((query: string) => searchPlaces(query), []);

  const value = useMemo<LocationContextValue>(
    () => ({
      label,
      coords,
      isLocating,
      setPlace,
      geocodeAndSetPlace,
      resolveAndSetPlace,
      searchPlaces: searchLocal,
      requestGps,
    }),
    [label, coords, isLocating, setPlace, geocodeAndSetPlace, resolveAndSetPlace, searchLocal, requestGps]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocationContext = (): LocationContextValue => {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return ctx;
};

export default LocationProvider;