import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DrivingInfo } from '../../services/googleMapsService';
import { loadGoogleMaps } from '../../services/googleMapsService';
import type { FacilityType, Hospital } from '../../services/locationService';

export interface GoogleHospitalMapProps {
  center: { lat: number; lng: number };
  hospitals: Hospital[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  drivingInfo?: Record<string, DrivingInfo>;
}

const MARKER_COLORS: Record<FacilityType, string> = {
  HOSPITAL: '#1259cb',
  PHC: '#00897b',
  CLINIC: '#e65100',
};

const escapeHtml = (value: string): string => {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
};

const formatKm = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

/* Teardrop pin with a medical cross, tinted per facility type. */
const markerSvgUrl = (color: string): string => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">' +
    '<path d="M18 1C9.7 1 3 7.7 3 16c0 12.8 14.9 29 15 29s15-16.2 15-29C33 7.7 26.3 1 18 1z" ' +
    `fill="${color}" stroke="#ffffff" stroke-width="2"/>` +
    '<path d="M15 5.5h6v10.5H31v6H21V32h-6V22H5v-6h10V5.5z" fill="#ffffff"/>' +
    '</svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const userDotSvgUrl = (): string => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="12" r="11" fill="none" stroke="#1259cb" stroke-width="2.5" opacity="0.35"/>' +
    '<circle cx="12" cy="12" r="6" fill="#1259cb" stroke="#ffffff" stroke-width="2.5"/>' +
    '</svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const infoWindowContent = (h: Hospital, drive?: DrivingInfo): string => {
  const driveLine = drive
    ? `<div class="hosp-popup-meta">🚗 <strong>${formatKm(drive.distanceKm)}</strong> · ~${drive.durationMinutes} min drive</div>`
    : '';
  return [
    `<strong class="hosp-popup-name">${escapeHtml(h.name)}</strong>`,
    h.address ? `<div class="hosp-popup-meta">${escapeHtml(h.address)}</div>` : '',
    `<div class="hosp-popup-meta">${formatKm(h.distanceKm)} away` +
      (h.emergency24x7 ? ' · 24×7 emergency' : '') + '</div>',
    driveLine,
    `<a class="hosp-popup-link" href="https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}" ` +
      'target="_blank" rel="noreferrer">Get directions →</a>',
  ].join('');
};
/**
 * Google Maps renderer for the "Hospital Near You" page. Only used when
 * VITE_GOOGLE_MAPS_API_KEY is configured (see HospitalMap dispatcher).
 */
export const GoogleHospitalMap: React.FC<GoogleHospitalMapProps> = ({
  center,
  hospitals,
  selectedId,
  onSelect,
  drivingInfo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);
  const fitKeyRef = useRef<string>('');
  const [ready, setReady] = useState(false);

  // Create the map once the API script is loaded.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const g = (window as any).google;
        mapRef.current = new g.maps.Map(containerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 13,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
          gestureHandling: 'auto',
        });
        infoRef.current = new g.maps.InfoWindow();
        setReady(true);
      })
      .catch(() => {
        /* map load failed — HospitalMap falls back to the Leaflet view */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openInfo = useCallback(
    (id: string) => {
      const h = hospitals.find((x) => x.id === id);
      const map = mapRef.current;
      const info = infoRef.current;
      if (!h || !map || !info) return;
      const marker = markersRef.current.get(id);
      info.setContent(infoWindowContent(h, drivingInfo?.[id]));
      if (marker) info.open(map, marker);
      map.panTo({ lat: h.latitude, lng: h.longitude });
    },
    [hospitals, drivingInfo]
  );

  useEffect(() => {
    if (selectedId) {
      openInfo(selectedId);
    } else {
      infoRef.current?.close();
    }
  }, [selectedId, openInfo]);

  // Rebuild markers + fit bounds when the location / result set changes.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = (window as any).google;
    const map = mapRef.current;

    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new g.maps.Marker({
      position: { lat: center.lat, lng: center.lng },
      map,
      zIndex: 1000,
      title: 'You are here',
      icon: {
        url: userDotSvgUrl(),
        scaledSize: new g.maps.Size(24, 24),
        anchor: new g.maps.Point(12, 12),
      },
    });

    const activeIds = new Set<string>();
    hospitals.forEach((h) => {
      activeIds.add(h.id);
      let marker = markersRef.current.get(h.id);
      if (!marker) {
        marker = new g.maps.Marker({
          position: { lat: h.latitude, lng: h.longitude },
          map,
          title: h.name,
          icon: {
            url: markerSvgUrl(MARKER_COLORS[h.type]),
            scaledSize: new g.maps.Size(36, 46),
            anchor: new g.maps.Point(18, 44),
          },
        });
        marker.addListener('click', () => {
          openInfo(h.id);
          onSelect(h.id);
        });
        markersRef.current.set(h.id, marker);
      }
    });

    // Remove markers for facilities no longer in the result set.
    markersRef.current.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Fit bounds once per data set (not on every re-render / pan).
    const ids = hospitals
      .map((h) => h.id)
      .sort()
      .join('|');
    const fitKey = `${center.lat.toFixed(4)},${center.lng.toFixed(4)}|${ids}`;
    if (fitKey !== fitKeyRef.current) {
      fitKeyRef.current = fitKey;
      const bounds = new g.maps.LatLngBounds();
      bounds.extend({ lat: center.lat, lng: center.lng });
      hospitals.forEach((h) => bounds.extend({ lat: h.latitude, lng: h.longitude }));
      if (hospitals.length > 0) {
        map.fitBounds(bounds, 48);
      } else {
        map.setCenter({ lat: center.lat, lng: center.lng });
        map.setZoom(13);
      }
    }
  }, [ready, center, hospitals, openInfo, onSelect]);

  return <div ref={containerRef} className="hosp-google-map" />;
};

export default GoogleHospitalMap;