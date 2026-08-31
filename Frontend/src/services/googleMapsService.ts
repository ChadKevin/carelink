/* googleMapsService.ts
 * Thin wrapper around the Google Maps JavaScript API + Google Places.
 *
 * Google Maps is OPTIONAL. When VITE_GOOGLE_MAPS_API_KEY is not configured,
 * every helper falls back to free OpenStreetMap equivalents (Nominatim
 * geocoding / Overpass) so the whole app keeps working in a keyless demo.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  /** Present for Nominatim suggestions (no extra geocode round-trip needed). */
  lat?: number;
  lng?: number;
}

export interface DrivingInfo {
  distanceKm: number;
  durationMinutes: number;
}

const GOOGLE_MAPS_API_KEY: string | undefined =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || undefined;

export const isGoogleMapsEnabled = (): boolean => Boolean(GOOGLE_MAPS_API_KEY);

let mapsPromise: Promise<void> | null = null;

/** Loads the Google Maps JS API (with Places) exactly once. */
export const loadGoogleMaps = (): Promise<void> => {
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error('Google Maps API key is not configured'));
  }
  if ((window as any).google?.maps) {
    return Promise.resolve();
  }
  if (mapsPromise) {
    return mapsPromise;
  }
  mapsPromise = new Promise<void>((resolve, reject) => {
    const cbName = `__carelinkMapsCb_${Date.now()}`;
    (window as any)[cbName] = () => {
      delete (window as any)[cbName];
      resolve();
    };
    const script = document.createElement('script');
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}` +
      `&libraries=places&v=weekly&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as any)[cbName];
      mapsPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(script);
  });
  return mapsPromise;
};

/* ── Place search ───────────────────────────────────────────────────── */

const searchPlacesGoogle = async (query: string): Promise<PlaceSuggestion[]> => {
  await loadGoogleMaps();
  const g = (window as any).google;
  const service = new g.maps.places.AutocompleteService();
  const predictions: any[] = await new Promise((resolve, reject) => {
    service.getPlacePredictions(
      { input: query },
      (results: any[] | undefined, status: string) => {
        if (status === 'OK' && results) resolve(results);
        else reject(new Error(status || 'Places autocomplete failed'));
      }
    );
  });
  return predictions.map((p: any) => ({
    placeId: String(p.place_id),
    description: String(p.description ?? ''),
    mainText: String(p.structured_formatting?.main_text ?? p.description ?? ''),
    secondaryText: String(
      p.structured_formatting?.secondary_text ?? p.terms?.map((t: any) => t.value).join(', ') ?? ''
    ),
  }));
};

const searchPlacesNominatim = async (query: string): Promise<PlaceSuggestion[]> => {
  const url =
    'https://nominatim.openstreetmap.org/search?q=' +
    encodeURIComponent(query) +
    '&format=json&limit=6';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error('Location search failed');
  }
  const data: any[] = await res.json();
  return data.map((place: any) => ({
    placeId: `nominatim-${place.place_id}`,
    description: String(place.display_name ?? ''),
    mainText: String((place.display_name ?? '').split(',')[0]),
    secondaryText: String(place.display_name ?? ''),
    lat: Number.parseFloat(place.lat),
    lng: Number.parseFloat(place.lon),
  }));
};

/** Suggest places (Google Places autocomplete, or Nominatim without a key). */
export const searchPlaces = async (query: string): Promise<PlaceSuggestion[]> => {
  if (!query.trim()) return [];
  if (!isGoogleMapsEnabled()) {
    return searchPlacesNominatim(query);
  }
  try {
    return await searchPlacesGoogle(query);
  } catch {
    return searchPlacesNominatim(query);
  }
};

/* ── Geocoding ──────────────────────────────────────────────────────── */

/** Resolve a suggestion to exact coordinates (uses embedded coords for Nominatim). */
export const geocodeSuggestion = async (
  suggestion: PlaceSuggestion
): Promise<{ lat: number; lng: number; label: string }> => {
  if (Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lng)) {
    return {
      lat: suggestion.lat as number,
      lng: suggestion.lng as number,
      label: suggestion.description,
    };
  }
  if (!isGoogleMapsEnabled()) {
    throw new Error('Google Maps is not configured');
  }
  await loadGoogleMaps();
  const g = (window as any).google;
  const geocoder = new g.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ placeId: suggestion.placeId }, (results: any[] | undefined, status: string) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          label: results[0].formatted_address,
        });
      } else {
        reject(new Error(status || 'Geocoding failed'));
      }
    });
  });
};

/** Human label for a GPS point (Google Geocoder → Nominatim fallback). */
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  if (isGoogleMapsEnabled()) {
    try {
      await loadGoogleMaps();
      const g = (window as any).google;
      const geocoder = new g.maps.Geocoder();
      const label: string = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results: any[] | undefined, status: string) => {
          if (status === 'OK' && results && results[0]) resolve(results[0].formatted_address);
          else reject(new Error(status || 'Reverse geocoding failed'));
        });
      });
      return label;
    } catch {
      /* fall through to Nominatim */
    }
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    return data?.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

/* ── Real driving distance / time (Google Distance Matrix) ───────────── */

/**
 * Real-road distance and drive time from the user location to each facility.
 * Batches request because Distance Matrix caps elements per call. Returns {} when
 * Google Maps is not configured (callers then fall back to straight-line km).
 */
export const getDrivingDistances = async (
  origin: Coordinates,
  destinations: { id: string; lat: number; lng: number }[]
): Promise<Record<string, DrivingInfo>> => {
  const result: Record<string, DrivingInfo> = {};
  if (!isGoogleMapsEnabled() || destinations.length === 0) {
    return result;
  }
  await loadGoogleMaps();
  const g = (window as any).google;
  const service = new g.maps.DistanceMatrixService();
  const chunkSize = 20;

  for (let i = 0; i < destinations.length; i += chunkSize) {
    const chunk = destinations.slice(i, i + chunkSize);
    const data: any = await new Promise((resolve, reject) => {
      service.getDistanceMatrix(
        {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: chunk.map((d) => ({ lat: d.lat, lng: d.lng })),
          travelMode: g.maps.TravelMode.DRIVING,
          unitSystem: g.maps.UnitSystem.METRIC,
        },
        (response: any, status: string) => {
          if (status === 'OK' && response) resolve(response);
          else reject(new Error(status || 'Distance Matrix failed'));
        }
      );
    });

    const elements = data?.rows?.[0]?.elements ?? [];
    elements.forEach((el: any, index: number) => {
      const dest = chunk[index];
      if (
        el?.status === 'OK' &&
        dest &&
        Number.isFinite(el.distance?.value) &&
        Number.isFinite(el.duration?.value)
      ) {
        result[dest.id] = {
          distanceKm: el.distance.value / 1000,
          durationMinutes: Math.max(1, Math.round(el.duration.value / 60)),
        };
      }
    });
  }
  return result;
};