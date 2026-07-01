import { fmt, DAYS } from '../constants.js';
import { useAggregateView } from '../hooks/useAggregateView.js';
import { AggregateSummaryList } from './AggregateSummaryList.jsx';

export function WeekAggregateView({ weeks, users, onJumpToDay }) {
  const { range, perUser, days, goPrev, goNext, goToday } = useAggregateView(weeks, users, 'week');

  return (
    <div className="px-4 pt-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-[1.1rem] text-ink cursor-pointer transition-all hover:bg-cream-2 flex-shrink-0"
        >
          ‹
        </button>
        <div className="flex-1 text-center text-[.92rem] font-bold text-ink">
          {fmt(range.start)} – {fmt(range.end)}
        </div>
        <button
          onClick={goNext}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-[1.1rem] text-ink cursor-pointer transition-all hover:bg-cream-2 flex-shrink-0"
        >
          ›
        </button>
      </div>

      <button
        onClick={goToday}
        className="py-2 rounded-full bg-brown text-ink font-bold text-[.78rem] border-0 cursor-pointer hover:bg-brown-mid transition-colors"
      >
        Questa settimana
      </button>

      <div className="flex gap-1.5">
        {days.map(d => (
          <button
            key={d}
            onClick={() => onJumpToDay(d)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border border-border bg-card text-ink-2 text-[.65rem] font-semibold cursor-pointer hover:bg-cream-2 hover:border-sage transition-colors"
          >
            <span className="uppercase">{DAYS[new Date(d + 'T12:00:00Z').getUTCDay()].slice(0, 3)}</span>
            <span className="text-[.85rem] text-ink">{+d.split('-')[2]}</span>
          </button>
        ))}
      </div>

      <AggregateSummaryList perUser={perUser} />
    </div>
  );
}
