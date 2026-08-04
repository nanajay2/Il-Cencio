import { ChevronDown } from 'lucide-react';
import { DAYS, MONTHS } from '../constants.js';

export function Header({ houseName, currentUser, onOpenSwitcher }) {
  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <header style={{ background: '#D5C7A3', paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }} className="px-5 pb-4">
      {onOpenSwitcher ? (
        <button
          onClick={onOpenSwitcher}
          className="font-serif text-[1.65rem] leading-none border-0 bg-transparent cursor-pointer p-0 flex items-center gap-1.5"
          style={{ color: '#4E220F' }}
        >
          {houseName || 'Il Cencio'}
          <ChevronDown size={18} strokeWidth={2.5} className="flex-shrink-0" style={{ opacity: .6 }} />
        </button>
      ) : (
        <div className="font-serif text-[1.65rem] leading-none" style={{ color: '#4E220F' }}>
          {houseName || 'Il Cencio'}
        </div>
      )}
      {currentUser && (
        <div className="text-[.75rem] mt-[6px]" style={{ color: 'rgba(78,34,15,.5)' }}>
          Ciao, <strong style={{ color: 'rgba(78,34,15,.8)' }}>{currentUser}</strong>
          <span style={{ color: '#7A5038' }} className="mx-1.5">·</span>
          <span style={{ color: '#7A5038' }}>{dateStr}</span>
        </div>
      )}
    </header>
  );
}
