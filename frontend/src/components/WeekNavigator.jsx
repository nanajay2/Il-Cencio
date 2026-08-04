import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fmt, isCurW, isPastW } from '../constants.js';

export function WeekNavigator({ week, currentIdx, totalWeeks, navLoading, onPrev, onNext, onThisWeek }) {
  if (!week) return null;

  const isCur  = isCurW(week);
  const isPast = isPastW(week);
  const statusLabel  = isCur ? 'Turno attuale' : isPast ? 'Passato' : 'Futuro';
  const statusStyle  = isCur
    ? { background: '#D5C7A3', color: '#4E220F' }
    : isPast
    ? { background: '#F2E2B1', color: '#7A5038' }
    : { background: '#F2E2B1', color: '#BDB395' };

  return (
    <div className="px-4 pt-4 pb-1">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev} disabled={currentIdx === 0 || navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          <ChevronLeft size={18} />
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
          onClick={onNext} disabled={navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          {navLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
        </button>
      </div>

      <button
        onClick={onThisWeek}
        className="w-full mt-3 py-2 rounded-full bg-brown text-ink font-bold text-[.78rem] border-0 cursor-pointer hover:bg-brown-mid transition-colors"
      >
        Oggi
      </button>
    </div>
  );
}
