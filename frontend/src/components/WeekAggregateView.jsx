import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fmt, DAYS, todayStr, isCurW } from '../constants.js';
import { daysInRange } from '../lib/calendarBuckets.js';

export function WeekAggregateView({ week, currentIdx, totalWeeks, navLoading, onPrev, onNext, onThisWeek }) {
  if (!week) return null;
  const today = todayStr();
  const days = daysInRange(week.start, week.end);
  const isCurrent = isCurW(week);
  const scrollable = days.length > 7;

  return (
    <div className="px-4 pt-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onPrev} disabled={currentIdx === 0 || navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center text-[.92rem] font-bold text-ink">
          {fmt(week.start)} – {fmt(week.end)}
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
        disabled={isCurrent}
        className="py-2 rounded-full bg-brown text-ink font-bold text-[.78rem] border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-default"
      >
        {isCurrent ? 'Turno attuale' : 'Torna ad oggi'}
      </button>

      <div className={'flex gap-1.5 pb-1' + (scrollable ? ' overflow-x-auto' : '')}>
        {days.map(d => (
          <div
            key={d}
            className={
              (scrollable ? 'w-12 flex-shrink-0 ' : 'flex-1 ') +
              'flex flex-col items-center gap-0.5 py-2 rounded-xl border text-[.65rem] font-semibold ' +
              (d === today ? 'bg-brown border-brown text-ink' : 'border-border bg-card text-ink-2')
            }
          >
            <span className="uppercase">{DAYS[new Date(d + 'T12:00:00Z').getUTCDay()].slice(0, 3)}</span>
            <span className="text-[.85rem]">{+d.split('-')[2]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
