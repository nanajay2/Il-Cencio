import { fmt, isCurW, isPastW } from '../constants.js';

export function WeekNavigator({ week, currentIdx, totalWeeks, onPrev, onNext, onThisWeek, onGenerate }) {
  if (!week) return null;

  const isCur  = isCurW(week);
  const isPast = isPastW(week);
  const statusLabel  = isCur ? 'Questa settimana' : isPast ? 'Passata' : 'Futura';
  const statusStyle  = isCur
    ? { background: '#D5C7A322', color: '#4E7A3A' }
    : isPast
    ? { background: '#F2E2B1', color: '#7A5038' }
    : { background: '#9D663818', color: '#9D6638' };

  return (
    <div className="px-4 pt-4 pb-1">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev} disabled={currentIdx === 0}
          className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-[1.1rem] text-ink-2 cursor-pointer transition-all hover:border-brown hover:text-brown disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <div className="text-[.92rem] font-bold text-ink">
            {fmt(week.start)} – {fmt(week.end)}
          </div>
          <span
            className="inline-block mt-1 text-[.6rem] font-bold uppercase tracking-[.08em] px-2.5 py-0.5 rounded-full"
            style={statusStyle}
          >
            {statusLabel}
          </span>
        </div>

        <button
          onClick={onNext} disabled={currentIdx === totalWeeks - 1}
          className="w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-[1.1rem] text-ink-2 cursor-pointer transition-all hover:border-brown hover:text-brown disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          ›
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={onThisWeek}
          className="flex-1 py-2 rounded-full bg-brown text-white font-bold text-[.78rem] border-0 cursor-pointer hover:bg-brown-mid transition-colors"
        >
          Oggi
        </button>
        <button
          onClick={onGenerate}
          className="flex-1 py-2 rounded-full border border-border bg-card text-ink-2 font-semibold text-[.78rem] cursor-pointer hover:bg-cream-2 hover:border-sage transition-colors"
        >
          ＋ Prossima
        </button>
      </div>
    </div>
  );
}
