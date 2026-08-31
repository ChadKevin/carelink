import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { TopNavBar } from './TopNavBar';
import { useLocationContext } from '../../context/LocationContext';

type ActiveLanguage = 'EN' | 'HI' | 'MR';

interface SubPageLayoutProps {
  /** Page title shown next to the back arrow */
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

/**
 * Wrapper for sub-pages (Talk to Doctor, Nearby Hospitals, etc.)
 * Renders the shared sticky TopNavBar + a small back-arrow header row,
 * then the page content below.
 */
export const SubPageLayout: React.FC<SubPageLayoutProps> = ({ title, onBack, children }) => {
  const { label, isLocating, requestGps, resolveAndSetPlace } = useLocationContext();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeLang, setActiveLang] = React.useState<ActiveLanguage>('EN');

  const cycleLanguage = () => {
    setActiveLang((l) => (l === 'EN' ? 'HI' : l === 'HI' ? 'MR' : 'EN'));
  };

  return (
    <div className="subpage-shell">
      {/* Shared sticky top nav */}
      <TopNavBar
        location={label}
        onSetLocation={(loc) => {
          void resolveAndSetPlace(loc);
        }}
        isLocating={isLocating}
        onRequestGPS={() => {
          void requestGps();
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeLang={activeLang}
        onCycleLanguage={cycleLanguage}
        onNotificationClick={() => {}}
      />

      {/* Sub-page content area */}
      <div className="subpage-content medtech-container">
        {/* Back arrow + page title */}
        <div className="subpage-back-row">
          <button
            type="button"
            className="subpage-back-btn"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="subpage-title">{title}</h1>
        </div>

        {children}
      </div>
    </div>
  );
};

export default SubPageLayout;
