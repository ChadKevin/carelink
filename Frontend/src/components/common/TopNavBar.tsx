import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Search, ChevronDown, Navigation, Check, X, Loader2, Bell, ArrowLeftRight } from 'lucide-react';
import logoSrc from '../../assets/logo.png';

const SUGGESTED_LOCATIONS = [
  'Primary Health Centre - Wardha',
  'Community Health Centre - Deoli',
  'Sub-District Hospital - Hinganghat',
  'Rural Wellness Clinic - Arvi',
  'District General Hospital - Nagpur Hub',
  'Wardha Rural District',
];

type ActiveLanguage = 'EN' | 'HI' | 'MR';

interface TopNavBarProps {
  location: string;
  onSetLocation: (loc: string) => void;
  isLocating?: boolean;
  onRequestGPS?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  /** Active language passed from parent */
  activeLang: ActiveLanguage;
  /** Called when user clicks language pill to cycle */
  onCycleLanguage: () => void;
  /** Called when user clicks the notification bell */
  onNotificationClick: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  location,
  onSetLocation,
  isLocating = false,
  onRequestGPS,
  searchQuery,
  onSearchChange,
  activeLang,
  onCycleLanguage,
  onNotificationClick,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isDropdownOpen]);

  const handleSelectLocation = (loc: string) => {
    onSetLocation(loc);
    setIsDropdownOpen(false);
    setCustomInput('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      handleSelectLocation(customInput.trim());
    }
  };

  // Truncate location string for display
  const displayLocation = location.length > 30 ? location.slice(0, 28) + '…' : location;

  return (
    <header className="topnav-bar">
      <div className="topnav-inner">
        {/* Logo — hidden on mobile */}
        <div className="topnav-logo" aria-label="CareLink Home">
          <img src={logoSrc} alt="CareLink" className="topnav-logo-img" />
        </div>

        {/* Location Selector */}
        <div className="topnav-location-wrapper" ref={dropdownRef}>
          <button
            type="button"
            id="topnav-location-btn"
            className="topnav-location-btn"
            onClick={() => setIsDropdownOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <div className="topnav-loc-top">
              {isLocating ? (
                <Loader2 size={14} className="topnav-loc-spinner" />
              ) : (
                <MapPin size={15} className="topnav-loc-pin" />
              )}
              <span className="topnav-loc-label">
                {isLocating ? 'Detecting location…' : 'Your Location'}
              </span>
              <ChevronDown
                size={14}
                className={`topnav-loc-chevron ${isDropdownOpen ? 'open' : ''}`}
              />
            </div>
            <div className="topnav-loc-value">{isLocating ? '—' : displayLocation}</div>
          </button>

          {/* Location Dropdown */}
          {isDropdownOpen && (
            <div className="topnav-dropdown" role="dialog" aria-label="Select location">
              {/* GPS Option */}
              {onRequestGPS && (
                <button
                  type="button"
                  className="topnav-dropdown-gps"
                  onClick={() => {
                    onRequestGPS();
                    setIsDropdownOpen(false);
                  }}
                >
                  <Navigation size={15} className="topnav-dropdown-gps-icon" />
                  <span>Use current GPS location</span>
                </button>
              )}

              {/* Custom Input */}
              <form onSubmit={handleCustomSubmit} className="topnav-dropdown-form">
                <div className="topnav-dropdown-input-wrap">
                  <Search size={14} className="topnav-dropdown-search-icon" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="topnav-dropdown-input"
                    placeholder="Enter village, PHC, or hospital…"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                  {customInput && (
                    <button
                      type="button"
                      className="topnav-dropdown-clear"
                      onClick={() => setCustomInput('')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {customInput.trim() && (
                  <button type="submit" className="topnav-dropdown-set-btn">
                    Set
                  </button>
                )}
              </form>

              {/* Divider */}
              <div className="topnav-dropdown-divider-label">Nearby Health Facilities</div>

              {/* Suggestion List */}
              <ul className="topnav-dropdown-list" role="listbox">
                {SUGGESTED_LOCATIONS.map((loc) => (
                  <li
                    key={loc}
                    role="option"
                    aria-selected={location === loc}
                    className={`topnav-dropdown-item ${location === loc ? 'selected' : ''}`}
                    onClick={() => handleSelectLocation(loc)}
                  >
                    <MapPin size={13} className="topnav-dropdown-item-icon" />
                    <span>{loc}</span>
                    {location === loc && <Check size={14} className="topnav-dropdown-item-check" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Search Bar — grows to fill remaining space */}
        <div className="topnav-search-wrap">
          <Search size={17} className="topnav-search-icon" />
          <input
            id="topnav-search"
            type="search"
            className="topnav-search-input"
            placeholder="Search diseases, symptoms, hospitals…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search diseases or symptoms"
          />
          {searchQuery && (
            <button
              type="button"
              className="topnav-search-clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Right-side controls: Language pill + Notification bell */}
        <div className="topnav-right-controls">
          {/* Language Pill */}
          <button
            type="button"
            id="topnav-lang-pill"
            className="topnav-lang-pill"
            onClick={onCycleLanguage}
            title="Switch Language (English / Hindi / Marathi)"
            aria-label={`Current language: ${activeLang}. Click to switch.`}
          >
            <span className={`topnav-lang-seg ${activeLang === 'EN' ? 'active' : ''}`}>EN</span>
            <span className="topnav-lang-div">|</span>
            <span className={`topnav-lang-seg ${activeLang === 'HI' ? 'active' : ''}`}>HI</span>
            <span className="topnav-lang-div">|</span>
            <span className={`topnav-lang-seg ${activeLang === 'MR' ? 'active' : ''}`}>MR</span>
            <ArrowLeftRight size={12} className="topnav-lang-arrow" />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            id="topnav-notif-btn"
            className="topnav-notif-btn"
            onClick={onNotificationClick}
            aria-label="View notifications"
          >
            <Bell size={18} />
            <span className="topnav-notif-dot" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
