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
  Search,
  Stethoscope,
  Siren,
} from 'lucide-react';
import { HospitalMap } from '../../components/map/HospitalMap';
import { locationService } from '../../services/locationService';
import type { FacilityType, Hospital } from '../../services/locationService';
import type { DrivingInfo, PlaceSuggestion } from '../../services/googleMapsService';
import { getDrivingDistances, isGoogleMapsEnabled } from '../../services/googleMapsService';
import { useLocationContext } from '../../context/LocationContext';

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

/** Wardha District HQ — graceful default until the user searches or uses GPS. */
const DEFAULT_LOCATION = { lat: 20.7453, lng: 78.6022 };
const DEFAULT_LABEL = 'Wardha Rural District';
const SEARCH_RADII_KM = [10, 25, 50, 100];

/* ─── Formatting helpers ────────────────────────────────────────────── */

const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

const formatCoords = (lat: number, lng: number): string =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;

/** Rough drive estimate — only used when Google driving time is unavailable. */
const driveMinutes = (km: number): string => {
  const mins = Math.max(2, Math.round((km / 40) * 60));
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
  drivingInfo?: DrivingInfo;
  selected: boolean;
  onSelect: (id: string) => void;
}

const FacilityCard: React.FC<FacilityCardProps> = ({ hospital, drivingInfo, selected, onSelect }) => {
  const meta = TYPE_META[hospital.type];
  const Icon = meta.icon;
  // Real Google driving distance when available; straight-line km otherwise.
  const distanceKm = drivingInfo?.distanceKm ?? hospital.distanceKm;
  const driveLabel = drivingInfo ? `~${drivingInfo.durationMinutes} min` : driveMinutes(hospital.distanceKm);
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

        <div className="hosp-distance" aria-label={`${formatDistance(distanceKm)} away`}>
          <span className="hosp-distance-value">{formatDistance(distanceKm)}</span>
          <span className="hosp-distance-label">{drivingInfo ? 'drive' : 'away'}</span>
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
          <span>{driveLabel} drive</span>
        </div>
      </div>

      <div className="ttd-card-footer">
        <div className="ttd-fee">
          <span className="ttd-fee-label">From you</span>
          <span className="ttd-fee-amount">{formatDistance(distanceKm)}</span>
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
interface LocationSuggestionProps {
  suggestion: PlaceSuggestion;
  onPick: (s: PlaceSuggestion) => void;
}

const LocationSuggestionItem: React.FC<LocationSuggestionProps> = ({ suggestion, onPick }) => (
  <li
    role="option"
    aria-selected={false}
    className="hosp-suggestion-item"
    onClick={() => onPick(suggestion)}
  >
    <MapPin size={15} className="hosp-suggestion-icon" />
    <div className="hosp-suggestion-text">
      <strong>{suggestion.mainText}</strong>
      {suggestion.secondaryText && <span>{suggestion.secondaryText}</span>}
    </div>
  </li>
);

export const NearbyHospitalsPage: React.FC = () => {
  const {
    label: contextLabel,
    coords: contextCoords,
    isLocating,
    setPlace,
    geocodeAndSetPlace,
    searchPlaces: searchPlacesApi,
    requestGps,
  } = useLocationContext();

  /* Step 1 — location (shared with the top bar via LocationContext) */
  const activeCoords = contextCoords ?? DEFAULT_LOCATION;
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  /* Step 2 — facilities, radius, filters & map */
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [filter, setFilter] = useState<'All' | FacilityType>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [drivingInfo, setDrivingInfo] = useState<Record<string, DrivingInfo>>({});

  /* First visit with no saved location → default to the Wardha district. */
  useEffect(() => {
    if (!contextCoords) {
      setPlace(DEFAULT_LABEL, DEFAULT_LOCATION);
    }
  }, [contextCoords, setPlace]);

  /* Debounced place suggestions in the search box. */
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }
    let cancelled = false;
    setSuggesting(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlacesApi(q);
        if (!cancelled) {
          setSuggestions(results);
          setSuggestionsOpen(results.length > 0);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSuggesting(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchPlacesApi]);

  const pickSuggestion = useCallback(
    async (s: PlaceSuggestion) => {
      const ok = await geocodeAndSetPlace(s);
      if (ok) {
        setSearchQuery('');
        setSuggestionsOpen(false);
        setSelectedId(null);
      }
    },
    [geocodeAndSetPlace]
  );
/* Fetch facilities whenever the location or radius changes. */
  useEffect(() => {
    const { lat, lng } = activeCoords;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setUsedFallback(false);
    setSelectedId(null);
    setDrivingInfo({});

    (async () => {
      // Live browser-side OpenStreetMap lookup — graceful fallback so the map keeps
      // working when the backend is unreachable or came back empty.
      const viaOSM = async (): Promise<Hospital[]> => {
        const osm = await locationService.getNearbyHospitalsViaOSM({
          latitude: lat,
          longitude: lng,
          radiusKm,
        });
        if (!cancelled) {
          setHospitals(osm);
          setUsedFallback(osm.length > 0);
        }
        return osm;
      };

      try {
        const data = await locationService.getNearbyHospitals({
          latitude: lat,
          longitude: lng,
          radiusKm,
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
            setError('Could not load nearby facilities. Please check your connection and try again.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoords.lat, activeCoords.lng, radiusKm]);

  /* Enrich with real driving distance/time via Google Distance Matrix (optional). */
  useEffect(() => {
    if (!isGoogleMapsEnabled() || hospitals.length === 0) {
      setDrivingInfo({});
      return;
    }
    let cancelled = false;
    getDrivingDistances(
      activeCoords,
      hospitals.map((h) => ({ id: h.id, lat: h.latitude, lng: h.longitude }))
    )
      .then((info) => {
        if (!cancelled) setDrivingInfo(info);
      })
      .catch(() => {
        if (!cancelled) setDrivingInfo({});
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoords, hospitals]);

  const filtered = useMemo(
    () => (filter === 'All' ? hospitals : hospitals.filter((h) => h.type === filter)),
    [hospitals, filter]
  );

  const handleSelect = useCallback(
    (id: string) => setSelectedId((current) => (current === id ? null : id)),
    []
  );

  return (
    <div className="hosp-page">
{/* ── Hero banner (same language as TalkToDoctor hero) ─────────── */}
      <div className="ttd-hero">
        <div className="ttd-hero-text">
          <h2 className="ttd-hero-title">Hospital Near You</h2>
          <p className="ttd-hero-sub">
            Search any city, town or village — or use your GPS — to find hospitals, PHCs
            and clinics with live distance, beds and one-tap directions.
          </p>
        </div>
        <div className="ttd-hero-icon">
          <MapPin size={40} strokeWidth={1.5} />
        </div>
      </div>

      {/* ── Step 1: Location card with search + GPS ──────────────────── */}
      <div className="hosp-loc-card">
        <div className="hosp-loc-main">
          <div className="hosp-loc-icon">
            <LocateFixed size={20} strokeWidth={1.8} />
          </div>
          <div className="hosp-loc-text">
            <span className="hosp-loc-step">Step 1 · Your Location</span>
            <strong className="hosp-loc-name">{contextLabel}</strong>
            <span className="hosp-loc-coords">{formatCoords(activeCoords.lat, activeCoords.lng)}</span>
          </div>
        </div>

        {/* Search any place */}
        <div className="hosp-search-wrap">
          <Search size={16} className="hosp-search-icon" />
          <input
            id="hosp-location-search"
            type="search"
            className="hosp-search-input"
            placeholder="Search any city, town or village…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSuggestionsOpen(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
            aria-label="Search a location"
            autoComplete="off"
          />
          {suggesting && <Loader2 size={15} className="hosp-spin hosp-search-spinner" />}

          {suggestionsOpen && suggestions.length > 0 && (
            <ul className="hosp-suggestions" role="listbox">
              {suggestions.map((s) => (
                <LocationSuggestionItem key={s.placeId} suggestion={s} onPick={pickSuggestion} />
              ))}
            </ul>
          )}
        </div>

        <div className="hosp-loc-actions">
          <button
            type="button"
            className="ttd-contact-btn hosp-loc-btn"
            onClick={() => {
              setSelectedId(null);
              requestGps();
            }}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 size={15} className="hosp-spin" />
            ) : (
              <Crosshair size={15} />
            )}
            {isLocating ? 'Locating…' : 'Use My GPS'}
          </button>
        </div>
      </div>

      {/* ── Step 2: Radius + Map + results ───────────────────────────── */}
      <>
        <div className="ttd-filter-row" role="tablist" aria-label="Search radius">
          {SEARCH_RADII_KM.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={radiusKm === r}
              className={`ttd-filter-pill ${radiusKm === r ? 'active' : ''}`}
              onClick={() => setRadiusKm(r)}
            >
              {r} km
            </button>
          ))}
        </div>

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
            center={activeCoords}
            hospitals={filtered}
            selectedId={selectedId}
            onSelect={handleSelect}
            drivingInfo={drivingInfo}
          />
          {loading && (
            <div className="hosp-map-loading">
              <Loader2 size={20} className="hosp-spin" />
              Finding facilities near {contextLabel}…
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
            <button type="button" className="ttd-contact-btn" onClick={() => setRadiusKm((r) => r)}>
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
              Nothing within {radiusKm} km of {contextLabel}. Try a bigger radius or search a
              different area.
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hosp-count-row">
              <span className="hosp-count">
                <strong>{filtered.length}</strong> facilities near {contextLabel}
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
                  drivingInfo={drivingInfo[hospital.id]}
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
    </div>
  );
};

export default NearbyHospitalsPage;