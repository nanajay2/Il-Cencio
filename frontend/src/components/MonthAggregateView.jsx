import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { MONTHS } from '../constants.js';
import { useAggregateView } from '../hooks/useAggregateView.js';
import { findTurnoForDate, dayBackground } from '../lib/calendarBuckets.js';
import { AggregateSummaryList } from './AggregateSummaryList.jsx';

export function MonthAggregateView({ weeks, users, userId, houseId, ensureThrough, navLoading, onJumpToDay }) {
  const { range, perUser, days, goPrev, goNext, goToday } = useAggregateView(weeks, users, 'month', houseId, ensureThrough);
  const [y, m] = range.start.split('-').map(Number);

  return (
    <div className="px-4 pt-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev} disabled={navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center text-[.92rem] font-bold text-ink capitalize">
          {MONTHS[m - 1]} {y}
        </div>
        <button
          onClick={goNext} disabled={navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          {navLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
        </button>
      </div>

      <button
        onClick={goToday}
        className="py-2 rounded-full bg-brown text-ink font-bold text-[.78rem] border-0 cursor-pointer hover:bg-brown-mid transition-colors"
      >
        Questo mese
      </button>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map(d => {
          const turno = findTurnoForDate(weeks, d);
          const myColors = turno
            ? turno.assignments.filter(a => a.userId === userId).map(a => a.roomColor)
            : [];
          const hasColor = myColors.length > 0;
          return (
            <button
              key={d}
              onClick={() => onJumpToDay(d)}
              className={
                'aspect-square flex items-center justify-center rounded-lg text-[.78rem] font-semibold cursor-pointer transition-colors ' +
                (hasColor
                  ? 'border border-transparent text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.4)]'
                  : 'border border-border bg-card text-ink hover:bg-cream-2 hover:border-sage')
              }
              style={hasColor ? { background: dayBackground(myColors) } : undefined}
            >
              {+d.split('-')[2]}
            </button>
          );
        })}
      </div>

      <AggregateSummaryList perUser={perUser} />
    </div>
  );
}
