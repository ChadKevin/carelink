import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DrivingInfo } from '../../services/googleMapsService';
import { isGoogleMapsEnabled } from '../../services/googleMapsService';
import type { FacilityType, Hospital } from '../../services/locationService';
import { GoogleHospitalMap } from './GoogleHospitalMap';

export interface HospitalMapProps {
  center: { lat: number; lng: number };
  hospitals: Hospital[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Real-road driving info (Google Distance Matrix) — used by the Google view. */
  drivingInfo?: Record<string, DrivingInfo>;
}

/**
 * Dispatches to Google Maps when VITE_GOOGLE_MAPS_API_KEY is configured,
 * otherwise renders the free OpenStreetMap (Leaflet) view.
 */
export const HospitalMap: React.FC<HospitalMapProps> = (props) => {
  return isGoogleMapsEnabled() ? (
    <GoogleHospitalMap {...props} />
  ) : (
    <LeafletHospitalMap {...props} />
  );
};

/* ─── Custom markers (pure CSS/SVG — no broken default pin assets) ──── */

const MARKER_COLORS: Record<FacilityType, string> = {
  HOSPITAL: '#1259cb',
  PHC: '#00897b',
  CLINIC: '#e65100',
};

const CROSS_SVG = (color: string) => `
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" fill="${color}"/>
  </svg>`;

const createFacilityIcon = (type: FacilityType) =>
  L.divIcon({
    className: 'hosp-marker-wrapper',
    html: `<div class="hosp-marker" style="background:${MARKER_COLORS[type]}">${CROSS_SVG('#ffffff')}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  });

const USER_ICON = L.divIcon({
  className: 'hosp-marker-wrapper',
  html: '<div class="hosp-user-dot"><span class="hosp-user-pulse"></span></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/* ─── View controller: fit bounds on load, fly to selection ─────────── */

const MapViewController: React.FC<
  Pick<HospitalMapProps, 'center' | 'hospitals' | 'selectedId'>
> = ({ center, hospitals, selectedId }) => {
  const map = useMap();
  const hasFittedRef = useRef(false);
  const lastSelectedRef = useRef<string | null>(null);

  useEffect(() => {
    // Fly to the selected facility — but only when the selection actually changes
    if (selectedId && selectedId !== lastSelectedRef.current) {
      const target = hospitals.find((h) => h.id === selectedId);
      if (target) {
        lastSelectedRef.current = selectedId;
        map.flyTo([target.latitude, target.longitude], 16, { duration: 0.8 });
      }
      return;
    }
    if (!selectedId) {
      lastSelectedRef.current = null;
    }
    // Fit the whole set once, on first results
    if (!hasFittedRef.current && hospitals.length > 0) {
      const bounds = L.latLngBounds(
        hospitals.map((h) => [h.latitude, h.longitude] as [number, number])
      );
      bounds.extend([center.lat, center.lng]);
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 15 });
      hasFittedRef.current = true;
    }
  }, [map, center, hospitals, selectedId]);

  return null;
};

/* ─── Component ─────────────────────────────────────────────────────── */

const LeafletHospitalMap: React.FC<HospitalMapProps> = ({
  center,
  hospitals,
  selectedId,
  onSelect,
  // drivingInfo is only consumed by the Google Maps view
}) => {
  const facilityIcons = useMemo(
    () => ({
      HOSPITAL: createFacilityIcon('HOSPITAL'),
      PHC: createFacilityIcon('PHC'),
      CLINIC: createFacilityIcon('CLINIC'),
    }),
    []
  );

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="hosp-leaflet"
      attributionControl
    >
      <TileLayer
        // Keyless OpenStreetMap raster tiles — CARTO basemaps now require an API key
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <MapViewController center={center} hospitals={hospitals} selectedId={selectedId} />

      {/* User's own position (pulsing GPS dot) */}
      <Marker position={[center.lat, center.lng]} icon={USER_ICON} zIndexOffset={1000}>
        <Popup>
          <strong className="hosp-popup-name">You are here</strong>
          <div className="hosp-popup-meta">
            {center.lat.toFixed(5)}&deg; N, {center.lng.toFixed(5)}&deg; E
          </div>
        </Popup>
      </Marker>

      {hospitals.map((hospital) => (
        <Marker
          key={hospital.id}
          position={[hospital.latitude, hospital.longitude]}
          icon={facilityIcons[hospital.type]}
          eventHandlers={{ click: () => onSelect(hospital.id) }}
        >
          <Popup>
            <strong className="hosp-popup-name">{hospital.name}</strong>
            {hospital.address && <div className="hosp-popup-meta">{hospital.address}</div>}
            <div className="hosp-popup-meta">
              {hospital.distanceKm < 1
                ? `${Math.round(hospital.distanceKm * 1000)} m away`
                : `${hospital.distanceKm.toFixed(1)} km away`}
              {hospital.emergency24x7 ? ' · 24×7 emergency' : ''}
            </div>
            <a
              className="hosp-popup-link"
              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Get directions →
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default HospitalMap;
