// useLocationPermission.ts
// Handles one-time GPS location permission request using localStorage

import { useState, useEffect, useCallback } from 'react';

const LOCATION_ASKED_KEY = 'carelink_location_asked';
const LOCATION_VALUE_KEY = 'carelink_location_value';

interface UseLocationPermissionReturn {
  location: string;
  setLocation: (loc: string) => void;
  hasAsked: boolean;
  requestLocation: () => Promise<void>;
  isLocating: boolean;
}

export function useLocationPermission(
  defaultLocation: string = 'Wardha Rural District'
): UseLocationPermissionReturn {
  const [location, setLocationState] = useState<string>(() => {
    return localStorage.getItem(LOCATION_VALUE_KEY) ?? defaultLocation;
  });
  const [hasAsked, setHasAsked] = useState<boolean>(
    () => localStorage.getItem(LOCATION_ASKED_KEY) === 'true'
  );
  const [isLocating, setIsLocating] = useState(false);

  const setLocation = useCallback((loc: string) => {
    setLocationState(loc);
    localStorage.setItem(LOCATION_VALUE_KEY, loc);
  }, []);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) return;

    setIsLocating(true);
    // Mark that we've asked — do this BEFORE the native prompt appears
    localStorage.setItem(LOCATION_ASKED_KEY, 'true');
    setHasAsked(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse-geocode with free Nominatim API
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await res.json();
      const addr = data.address;
      const label =
        addr.suburb ||
        addr.neighbourhood ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.county ||
        `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const district = addr.state_district || addr.county || '';
      const locationStr = district ? `${label}, ${district}` : label;
      setLocation(locationStr);
    } catch {
      // Permission denied or error — just keep the existing location
    } finally {
      setIsLocating(false);
    }
  }, [setLocation]);

  // On mount: if we've never asked, trigger the browser prompt once
  useEffect(() => {
    if (!hasAsked) {
      requestLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { location, setLocation, hasAsked, requestLocation, isLocating };
}
