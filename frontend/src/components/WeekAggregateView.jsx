import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { fmtRange, DAYS, todayStr } from '../constants.js';
import { useAggregateView } from '../hooks/useAggregateView.js';
import { findTurnoForDate, dayBackground } from '../lib/calendarBuckets.js';
import { tint, textOnTint } from '../lib/color.js';

export function WeekAggregateView({ weeks, users, userId, houseId, ensureThrough, navLoading, navError, onJumpToDay, onToday, anchorDay, onAnchorChange, onScrollNavigate }) {
  const { range, days, goPrev, goNext, goToday } = useAggregateView(weeks, users, 'week', houseId, ensureThrough, anchorDay, onAnchorChange);
  const today = todayStr();
  const isCurrentRange = today >= range.start && today <= range.end;

  function handleToday() {
    goToday();
    onToday?.();
  }

  // resta legittimo.
  function handlePrev() { onScrollNavigate?.(); goPrev(); }
  function handleNext() { onScrollNavigate?.(); goNext(); }

  return (
    <section aria-label="Settimana" className="bg-card rounded-[20px] px-2.5 pt-2.5 pb-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrev} disabled={navLoading}
          aria-label="Settimana precedente"
          className="w-11 h-9 border-0 bg-transparent text-ink flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
          <span className="text-[.9375rem] font-bold text-ink">{fmtRange(range.start, range.end)}</span>
          {!isCurrentRange && (
            <button
              type="button"
              onClick={handleToday}
              className="h-7 px-2.5 rounded-full border-0 bg-primary-soft text-primary text-[.75rem] font-bold cursor-pointer"
            >
              Oggi
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleNext} disabled={navLoading}
          aria-label="Settimana successiva"
          className="w-11 h-9 border-0 bg-transparent text-ink flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default flex-shrink-0"
        >
          {navLoading ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />}
        </button>
      </div>

      {navError && !navLoading && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-red-pale rounded-xl text-[.8125rem] text-ink">
          <span className="flex-1">Impossibile caricare questa settimana: {navError}</span>
          <button
            type="button"
            onClick={() => ensureThrough(houseId, range.end)}
            className="font-bold underline bg-transparent border-0 text-ink cursor-pointer flex-shrink-0"
          >
            Riprova
          </button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {days.map(d => {
          const turno = findTurnoForDate(weeks, d);
          const myColors = turno ? turno.assignments.filter(a => a.userId === userId).map(a => a.roomColor) : [];
          const isToday = d === today;
          const style = isToday
            ? { background: '#17241F', color: '#FFFFFF' }
            : myColors.length > 0
            ? { background: dayBackground(myColors.map(c => tint(c))), color: textOnTint(myColors[0]) }
            : { background: '#F3F5F1', color: '#56645E' };
          const weekday = DAYS[new Date(d + 'T12:00:00Z').getUTCDay()].slice(0, 3);
          return (
            <button
              key={d}
              type="button"
              onClick={() => onJumpToDay(d)}
              aria-current={isToday ? 'date' : undefined}
              className="h-14 rounded-[14px] border-0 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              style={style}
            >
              <span className="text-[.6875rem] font-semibold uppercase opacity-80">{weekday}</span>
              <span className="text-[1rem] font-bold">{+d.split('-')[2]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
