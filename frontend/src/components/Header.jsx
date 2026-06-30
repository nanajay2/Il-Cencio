import { DAYS, MONTHS } from '../constants.js';

function GearIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function Header({ houseName, currentUser, isAdmin, onAdmin }) {
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <header style={{ background: '#4E220F' }} className="px-5 pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-serif text-[1.65rem] text-white leading-none">
            {houseName || 'Il Cencio'}
          </div>
          {currentUser && (
            <div className="text-[.75rem] mt-[6px]" style={{ color: 'rgba(246,240,240,.55)' }}>
              Ciao, <strong style={{ color: 'rgba(246,240,240,.85)' }}>{currentUser}</strong>
              <span style={{ color: '#D5C7A3' }} className="mx-1.5">·</span>
              <span style={{ color: '#D5C7A3' }}>{dateStr}</span>
            </div>
          )}
        </div>

        {isAdmin && (
          <button
            onClick={onAdmin}
            title="Impostazioni"
            className="w-[36px] h-[36px] rounded-full border-0 cursor-pointer flex items-center justify-center transition-all mt-0.5"
            style={{ background: 'rgba(213,199,163,.15)', color: '#D5C7A3' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(213,199,163,.28)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(213,199,163,.15)'}
          >
            <GearIcon />
          </button>
        )}
      </div>
    </header>
  );
}
