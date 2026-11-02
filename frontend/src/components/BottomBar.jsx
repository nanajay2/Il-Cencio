import { Sun, CalendarDays, ArrowLeftRight, Luggage, Home } from 'lucide-react';

const TABS = [
  { key: 'scambi',     label: 'Scambi',     icon: ArrowLeftRight },
  { key: 'calendario', label: 'Calendario', icon: CalendarDays },
  { key: 'oggi',       label: 'Oggi',       icon: Sun },
  { key: 'assenze',    label: 'Assenze',    icon: Luggage },
  { key: 'casa',       label: 'Casa',       icon: Home },
];

export function BottomBar({ active, pendingSwaps, onChange }) {
  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[200] bg-card border-t border-border flex px-1 pt-1.5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .375rem)' }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        const badge = key === 'scambi' ? pendingSwaps : 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-current={isActive ? 'page' : undefined}
            aria-label={badge > 0 ? `${label}, ${badge} da gestire` : label}
            className={
              'flex-1 min-h-[52px] border-0 bg-transparent cursor-pointer flex flex-col items-center justify-center gap-[3px] text-[.6875rem] ' +
              (isActive ? 'text-primary font-bold' : 'text-ink-2 font-semibold')
            }
          >
            <span className={'relative w-14 h-[30px] rounded-full flex items-center justify-center transition-colors ' + (isActive ? 'bg-primary-soft' : '')}>
              <Icon size={22} strokeWidth={2} aria-hidden="true" />
              {badge > 0 && (
                <span className="absolute -top-0.5 right-2 min-w-[18px] h-[18px] px-[5px] box-border rounded-full bg-red text-white text-[.6875rem] font-bold flex items-center justify-center border-2 border-card">
                  {badge}
                </span>
              )}
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
