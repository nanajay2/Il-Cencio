import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fmt, DAYS, todayStr } from '../constants.js';
import { useAggregateView } from '../hooks/useAggregateView.js';
import { findTurnoForDate, dayBackground } from '../lib/calendarBuckets.js';

export function WeekAggregateView({ weeks, users, userId, houseId, ensureThrough, navLoading, navError, onJumpToDay, onToday, anchorDay }) {
  const { range, days, goPrev, goNext, goToday } = useAggregateView(weeks, users, 'week', houseId, ensureThrough, anchorDay);
  const today = todayStr();
  const isCurrentRange = today >= range.start && today <= range.end;

  function handleToday() {
    goToday();
    onToday?.();
  }

  return (
    <div className="px-4 pt-3 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev} disabled={navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center text-[.92rem] font-bold text-ink">
          {fmt(range.start)} – {fmt(range.end)}
        </div>
        <button
          onClick={goNext} disabled={navLoading}
          className="w-9 h-9 rounded-full border border-sage bg-card flex items-center justify-center text-ink cursor-pointer transition-all hover:bg-cream-2 disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          {navLoading ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
        </button>
      </div>

      <button
        onClick={handleToday}
        disabled={isCurrentRange}
        className="py-2 rounded-full bg-brown text-ink font-bold text-[.78rem] border-0 cursor-pointer hover:bg-brown-mid transition-colors disabled:opacity-50 disabled:cursor-default"
      >
        {isCurrentRange ? 'Settimana attuale' : 'Torna ad oggi'}
      </button>

      {navError && !navLoading && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-red-pale border border-red rounded-xl text-[.78rem] text-red">
          <span className="flex-1">Impossibile caricare questa settimana: {navError}</span>
          <button
            onClick={() => ensureThrough(houseId, range.end)}
            className="font-bold underline cursor-pointer flex-shrink-0"
          >
            Riprova
          </button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1.5">
        {days.map(d => {
          const turno = findTurnoForDate(weeks, d);
          const myColors = turno ? turno.assignments.filter(a => a.userId === userId).map(a => a.roomColor) : [];
          const hasColor = myColors.length > 0;
          const isToday = d === today;
          return (
            <button
              key={d}
              onClick={() => onJumpToDay(d)}
              className={
                'flex flex-col items-center gap-0.5 py-2 rounded-xl text-[.65rem] font-semibold cursor-pointer transition-colors ' +
                (hasColor
                  ? 'border border-transparent text-white shadow-[inset_0_0_0_1.5px_rgba(255,255,255,.4)]'
                  : 'border border-border bg-card text-ink-2 hover:bg-cream-2 hover:border-sage') +
                (isToday ? ' ring-2 ring-brown ring-offset-1 ring-offset-cream' : '')
              }
              style={hasColor ? { background: dayBackground(myColors) } : undefined}
            >
              <span className="uppercase">{DAYS[new Date(d + 'T12:00:00Z').getUTCDay()].slice(0, 3)}</span>
              <span className="text-[.85rem]">{+d.split('-')[2]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
