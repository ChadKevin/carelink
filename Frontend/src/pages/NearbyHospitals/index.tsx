import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BedDouble,
  Building2,
  Clock,
  Crosshair,
  Hospital as HospitalIcon,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Stethoscope,
  Siren,
} from 'lucide-react';
import { HospitalMap } from '../../components/map/HospitalMap';
import { locationService } from '../../services/locationService';
import type { FacilityType, Hospital } from '../../services/locationService';

/* ─── Design tokens per facility type (mirrors TalkToDoctor palette) ── */

const TYPE_META: Record<
  FacilityType,
  { label: string; icon: React.FC<{ size?: number; strokeWidth?: number }>; bg: string; text: string }
> = {
  HOSPITAL: { label: 'Hospital', icon: HospitalIcon, bg: '#e8f1fd', text: '#1259cb' },
  PHC: { label: 'PHC / CHC', icon: Building2, bg: '#e0f6f4', text: '#00897b' },
  CLINIC: { label: 'Clinic', icon: Stethoscope, bg: '#fff0ea', text: '#e65100' },
};

const FILTERS: { key: 'All' | FacilityType; label: string }[] = [
  { key: 'All', label: 'All Facilities' },
  { key: 'HOSPITAL', label: 'Hospitals' },
  { key: 'PHC', label: 'PHCs' },
  { key: 'CLINIC', label: 'Clinics' },
];

/** Wardha District HQ — graceful default when GPS is unavailable. */
const DEFAULT_LOCATION = { lat: 20.7453, lng: 78.6022 };
const SEARCH_RADIUS_KM = 25;

/* ─── Formatting helpers ────────────────────────────────────────────── */

const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

const formatCoords = (lat: number, lng: number): string =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;

/** Rural-road drive estimate (~25 km/h average). */
const driveMinutes = (km: number): string => {
  const mins = Math.max(2, Math.round((km / 25) * 60));
  return `~${mins} min`;
};

const directionsUrl = (h: Hospital): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`;

/* ─── Loading skeletons (TTD-style cards) ───────────────────────────── */

const FacilityCardSkeleton: React.FC = () => (
  <div className="ttd-card hosp-skel-card" aria-hidden="true">
    <div className="ttd-card-top">
      <div className="hosp-skel-avatar hosp-skel" />
      <div className="ttd-card-info">
        <div className="hosp-skel-line hosp-skel" style={{ width: '55%' }} />
        <div className="hosp-skel-line hosp-skel" style={{ width: '80%' }} />
        <div className="hosp-skel-line hosp-skel" style={{ width: '35%' }} />
      </div>
    </div>
  </div>
);

/* ─── Facility card (same card language as TalkToDoctor) ────────────── */

interface FacilityCardProps {
  hospital: Hospital;
  selected: boolean;
  onSelect: (id: string) => void;
}

const FacilityCard: React.FC<FacilityCardProps> = ({ hospital, selected, onSelect }) => {
  const meta = TYPE_META[hospital.type];
  const Icon = meta.icon;

  return (
    <div
      className={`ttd-card hosp-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(hospital.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(hospital.id);
        }
      }}
      aria-pressed={selected}
    >
      <div className="ttd-card-top">
        <div className="ttd-avatar" style={{ background: meta.bg, color: meta.text }}>
          <Icon size={24} strokeWidth={1.8} />
        </div>

        <div className="ttd-card-info">
          <div className="ttd-card-name-row">
            <h3 className="ttd-card-name">{hospital.name}</h3>
            {hospital.emergency24x7 && (
              <span className="ttd-badge-online">
                <Siren size={11} /> 24×7 Emergency
              </span>
            )}
          </div>
          <p className="ttd-card-qual">
            {hospital.address ?? 'Exact address not listed — see on map'}
          </p>
          <span className="hosp-type-chip" style={{ color: meta.text, background: meta.bg }}>
            <Icon size={11} strokeWidth={2} /> {meta.label}
          </span>
        </div>

        <div className="hosp-distance" aria-label={`${formatDistance(hospital.distanceKm)} away`}>
          <span className="hosp-distance-value">{formatDistance(hospital.distanceKm)}</span>
          <span className="hosp-distance-label">away</span>
        </div>
      </div>

      <div className="ttd-card-divider" />

      <div className="ttd-card-meta">
        {hospital.availableBeds != null && (
          <div className="ttd-meta-item">
            <BedDouble size={13} />
            <span>{hospital.availableBeds} beds</span>
          </div>
        )}
        {hospital.phone && (
          <div className="ttd-meta-item">
            <Phone size={13} />
            <span>{hospital.phone}</span>
          </div>
        )}
        <div className="ttd-meta-item">
          <Clock size={13} />
          <span>{driveMinutes(hospital.distanceKm)} drive</span>
        </div>
      </div>

      <div className="ttd-card-footer">
        <div className="ttd-fee">
          <span className="ttd-fee-label">From you</span>
          <span className="ttd-fee-amount">{formatDistance(hospital.distanceKm)}</span>
        </div>
        <div className="hosp-footer-actions">
          {hospital.phone && (
            <a
              className="hosp-call-btn"
              href={`tel:${hospital.phone.replace(/\s+/g, '')}`}
              aria-label={`Call ${hospital.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone size={15} />
            </a>
          )}
          <a
            className="ttd-contact-btn"
            href={directionsUrl(hospital)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Get directions to ${hospital.name}`}
          >
            Directions
            <Navigation size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

/* ─── Page ──────────────────────────────────────────────────────────── */

type LocationState = 'idle' | 'locating' | 'ready';

export const NearbyHospitalsPage: React.FC = () => {
  /* Step 1 — location (map & results only appear once it resolves) */
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLabel, setLocLabel] = useState<string | null>(null);
  const [locState, setLocState] = useState<LocationState>('idle');
  const [usedGps, setUsedGps] = useState(false);

  /* Step 2 — facilities, filters & map */
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [filter, setFilter] = useState<'All' | FacilityType>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** Apply a resolved coordinate + reverse-geocoded label. */
  const applyLocation = useCallback(async (lat: number, lng: number, gps: boolean) => {
    setCoords({ lat, lng });
    setUsedGps(gps);
    setLocState('ready');
    setLocLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);

    // Best-effort reverse geocoding (free Nominatim API) — never blocks the map
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const addr = data?.address ?? {};
      const place =
        addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || null;
      const district = addr.state_district || addr.county || '';
      if (place && district && place !== district) {
        setLocLabel(`${place}, ${district}`);
      } else if (place || district) {
        setLocLabel(place || district);
      } else {
        setLocLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch {
      /* keep coordinate label */
    }
  }, []);

  const useWardhaDefault = useCallback(() => {
    applyLocation(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, false);
  }, [applyLocation]);

  /** GPS detection with a graceful Wardha fallback. */
  const detectLocation = useCallback(
    (manual: boolean) => {
      setLocState('locating');
      if (manual) {
        setSelectedId(null);
      }

      if (!('geolocation' in navigator)) {
        useWardhaDefault();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          applyLocation(latitude, longitude, true);
        },
        () => {
          // Permission denied / timeout → fall back to the district default
          useWardhaDefault();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    },
    [applyLocation, useWardhaDefault]
  );

  /* Ask for location once, on first render ("location first, then map") */
  useEffect(() => {
    detectLocation(false);
  }, [detectLocation]);

  /* Fetch facilities whenever the resolved location changes */
  useEffect(() => {
    if (!coords) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUsedFallback(false);
    setSelectedId(null);

    (async () => {
      // Live browser-side OpenStreetMap lookup — graceful fallback so the map
      // keeps working when the backend is unreachable OR comes back empty
      // (e.g. its Overpass call timed out).
      const viaOSM = async (): Promise<Hospital[]> => {
        const osm = await locationService.getNearbyHospitalsViaOSM({
          latitude: coords.lat,
          longitude: coords.lng,
          radiusKm: SEARCH_RADIUS_KM,
        });
        if (!cancelled) {
          setHospitals(osm);
          setUsedFallback(osm.length > 0);
        }
        return osm;
      };

      try {
        const data = await locationService.getNearbyHospitals({
          latitude: coords.lat,
          longitude: coords.lng,
          radiusKm: SEARCH_RADIUS_KM,
        });
        if (cancelled) return;
        if (data.length > 0) {
          setHospitals(data);
        } else {
          await viaOSM();
        }
      } catch {
        try {
          await viaOSM();
        } catch {
          if (!cancelled) {
            setError('Could not load nearby facilities. Please check your connection.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coords]);

  const filtered = useMemo(
    () => (filter === 'All' ? hospitals : hospitals.filter((h) => h.type === filter)),
    [hospitals, filter]
  );

  const handleSelect = (id: string) =>
    setSelectedId((current) => (current === id ? null : id));

  return (
    <div className="hosp-page">
      {/* ── Hero banner (same language as TalkToDoctor hero) ─────────── */}
      <div className="ttd-hero">
        <div className="ttd-hero-text">
          <h2 className="ttd-hero-title">Hospital Near You</h2>
          <p className="ttd-hero-sub">
            Locate hospitals, PHCs and clinics around you — with live distance, beds and
            one-tap directions.
          </p>
        </div>
        <div className="ttd-hero-icon">
          <MapPin size={40} strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Step 1: Location card ──────────────────────────────────────── */}
      <div className="hosp-loc-card">
        <div className="hosp-loc-main">
          <div className="hosp-loc-icon">
            <LocateFixed size={20} strokeWidth={1.8} />
          </div>
          <div className="hosp-loc-text">
            <span className="hosp-loc-step">Step 1 · Your Location</span>
            {locState === 'ready' && coords && locLabel ? (
              <>
                <strong className="hosp-loc-name">{locLabel}</strong>
                <span className="hosp-loc-coords">
                  {formatCoords(coords.lat, coords.lng)} · {usedGps ? 'GPS detected' : 'default area'}
                </span>
              </>
            ) : locState === 'locating' ? (
              <strong className="hosp-loc-name">Detecting your location…</strong>
            ) : (
              <strong className="hosp-loc-name">Allow location access to continue</strong>
            )}
          </div>
        </div>
        <button
          type="button"
          className="ttd-contact-btn hosp-loc-btn"
          onClick={() => detectLocation(true)}
          disabled={locState === 'locating'}
        >
          {locState === 'locating' ? (
            <Loader2 size={15} className="hosp-spin" />
          ) : (
            <Crosshair size={15} />
          )}
          {locState === 'ready' ? 'Refresh GPS' : 'Use My Location'}
        </button>
      </div>

      {!usedGps && locState === 'ready' && (
        <div className="hosp-note">
          <AlertTriangle size={13} />
          Location unavailable — showing results around Wardha district as default.
        </div>
      )}

      {/* ── Step 2: Map + results (only after location resolves) ──────── */}
      {coords && (
        <>
          <div className="ttd-filter-row" role="tablist" aria-label="Filter by facility type">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={filter === f.key}
                className={`ttd-filter-pill ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="hosp-map-card">
            <HospitalMap
              center={coords}
              hospitals={filtered}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
            {loading && (
              <div className="hosp-map-loading">
                <Loader2 size={20} className="hosp-spin" />
                Finding facilities near you…
              </div>
            )}
          </div>

          {usedFallback && (
            <div className="hosp-note hosp-note--offline">
              <AlertTriangle size={13} />
              Backend unreachable — showing live OpenStreetMap results instead.
            </div>
          )}

          {error && (
            <div className="hosp-empty hosp-empty--error">
              <div className="hosp-empty-icon">
                <AlertTriangle size={26} strokeWidth={1.6} />
              </div>
              <h3 className="hosp-empty-title">Something went wrong</h3>
              <p className="hosp-empty-sub">{error}</p>
              <button
                type="button"
                className="ttd-contact-btn"
                onClick={() => setCoords({ ...coords })}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="hosp-empty">
              <div className="hosp-empty-icon">
                <MapPin size={26} strokeWidth={1.6} />
              </div>
              <h3 className="hosp-empty-title">No facilities found nearby</h3>
              <p className="hosp-empty-sub">
                Try refreshing your GPS location or search around a district centre.
              </p>
              <button
                type="button"
                className="ttd-contact-btn"
                onClick={() => detectLocation(true)}
              >
                <Crosshair size={15} />
                Refresh Location
              </button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="hosp-count-row">
                <span className="hosp-count">
                  <strong>{filtered.length}</strong> facilities within {SEARCH_RADIUS_KM} km
                </span>
                <div className="hosp-legend">
                  {(Object.keys(TYPE_META) as FacilityType[]).map((type) => (
                    <span key={type} className="hosp-legend-chip">
                      <i style={{ background: TYPE_META[type].text }} />
                      {TYPE_META[type].label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="ttd-cards-list">
                {filtered.map((hospital) => (
                  <FacilityCard
                    key={hospital.id}
                    hospital={hospital}
                    selected={selectedId === hospital.id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </>
          )}

          {loading && (
            <div className="ttd-cards-list">
              <FacilityCardSkeleton />
              <FacilityCardSkeleton />
              <FacilityCardSkeleton />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyHospitalsPage;


