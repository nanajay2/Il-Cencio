import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { MONTHS_LONG, fmt, fmtRange, todayStr } from '../constants.js';
import { useAggregateView } from '../hooks/useAggregateView.js';
import { findTurnoForDate, dayBackground } from '../lib/calendarBuckets.js';
import { tint, textOnTint } from '../lib/color.js';
import { AggregateSummaryList } from './AggregateSummaryList.jsx';
import { Avatar } from './Avatar.jsx';

const WEEKDAYS = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

// Quante caselle vuote servono prima del primo del mese (settimana da lunedì).
function leadingBlanks(firstDay) {
  return (new Date(firstDay + 'T12:00:00Z').getUTCDay() + 6) % 7;
}

export function CalendarScreen({ weeks, users, rooms, userId, houseId, ensureThrough, navLoading, navError, isAbsent, onOpenTurn }) {
  const { range, perUser, days, goPrev, goNext, goToday } = useAggregateView(weeks, users, 'month', houseId, ensureThrough);
  const today = todayStr();
  const [selected, setSelected] = useState(today);
  const [y, m] = range.start.split('-').map(Number);
  const monthName = MONTHS_LONG[m - 1];

  const selectedDay = selected >= range.start && selected <= range.end ? selected : null;
  const turno = selectedDay ? findTurnoForDate(weeks, selectedDay) : null;

  function handleToday() {
    goToday();
    setSelected(today);
  }

  const stato = !turno ? null : turno.end < today ? 'Concluso' : turno.start > today ? 'In arrivo' : 'In corso';

  return (
    <>
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display font-extrabold text-[1.875rem] leading-[1.1] tracking-[-.02em]">Calendario</h1>
        <button
          type="button"
          onClick={handleToday}
          className="h-9 px-3.5 rounded-full border border-border bg-card text-primary text-[.8125rem] font-bold cursor-pointer"
        >
          Oggi
        </button>
      </div>

      <section aria-label={`${monthName} ${y}`} className="bg-card rounded-[20px] px-2.5 pt-2 pb-3">
        <div className="flex items-center justify-between mb-1">
          <button
            type="button"
            onClick={goPrev} disabled={navLoading}
            aria-label="Mese precedente"
            className="w-11 h-10 border-0 bg-transparent text-ink flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <span className="text-[1rem] font-bold capitalize">{monthName} {y}</span>
          <button
            type="button"
            onClick={goNext} disabled={navLoading}
            aria-label="Mese successivo"
            className="w-11 h-10 border-0 bg-transparent text-ink flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-default"
          >
            {navLoading ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />}
          </button>
        </div>

        {navError && !navLoading && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 mb-2 bg-red-pale rounded-xl text-[.8125rem] text-ink">
            <span className="flex-1">Impossibile caricare questo mese: {navError}</span>
            <button
              type="button"
              onClick={() => ensureThrough(houseId, range.end)}
              className="font-bold underline bg-transparent border-0 text-ink cursor-pointer flex-shrink-0"
            >
              Riprova
            </button>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="text-center text-[.6875rem] font-bold text-ink-2">{w}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks(range.start) }, (_, i) => <span key={`b${i}`} />)}
          {days.map(d => {
            const t = findTurnoForDate(weeks, d);
            const mine = t ? t.assignments.filter(a => a.userId === userId) : [];
            const colors = mine.map(a => a.roomColor);
            const isSelected = d === selectedDay;
            const isToday = d === today;
            const style = isSelected
              ? { background: '#17241F', color: '#FFFFFF' }
              : colors.length > 0
              ? { background: dayBackground(colors.map(c => tint(c))), color: textOnTint(colors[0]) }
              : { background: '#F3F5F1', color: '#56645E' };
            if (isToday && !isSelected) style.boxShadow = 'inset 0 0 0 2px #17241F';
            const roomsLabel = mine.map(a => a.roomName).join(', ');
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                aria-pressed={isSelected}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${fmt(d)}${roomsLabel ? `, ${roomsLabel}` : ''}`}
                className="h-11 rounded-xl border-0 p-0 text-[.875rem] font-bold cursor-pointer"
                style={style}
              >
                {+d.split('-')[2]}
              </button>
            );
          })}
        </div>
      </section>

      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rooms.map(r => (
            <span key={r.id} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-card text-[.75rem] font-semibold">
              <span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: r.color }} />
              {r.name}
            </span>
          ))}
        </div>
      )}

      {turno ? (
        <section aria-label="Dettaglio turno" className="bg-card rounded-[20px] px-4 pt-3.5 pb-1.5">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <h2 className="text-[.9375rem] font-bold">Turno {fmtRange(turno.start, turno.end)}</h2>
            <span className={'text-[.75rem] font-bold flex-shrink-0 ' + (stato === 'In corso' ? 'text-primary' : 'text-ink-2')}>{stato}</span>
          </div>
          {turno.assignments.map(a => {
            const absent = isAbsent(a.userId, turno.start, turno.end);
            return (
              <div key={`${a.userId}-${a.roomId}`} className="flex items-center gap-3 min-h-[46px] border-t border-soft">
                <Avatar name={a.userName} color={absent ? '#C9D2CC' : a.roomColor} size={30} />
                <span className="flex-1 min-w-0 text-[.875rem] font-semibold truncate">{a.userId === userId ? 'Tu' : a.userName}</span>
                {absent && <span className="text-[.6875rem] font-bold text-ink-2 bg-soft px-2 py-0.5 rounded-full flex-shrink-0">Assente</span>}
                <span className="text-[.8125rem] text-ink-2 truncate max-w-[40%]">{a.roomName}</span>
                {a.done && <Check size={16} strokeWidth={3} className="text-primary flex-shrink-0" aria-label="Fatto" />}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => onOpenTurn(selectedDay)}
            className="w-full min-h-[44px] border-0 border-t border-soft bg-transparent text-primary text-[.875rem] font-bold cursor-pointer"
          >
            Apri in Oggi
          </button>
        </section>
      ) : (
        <section className="bg-card rounded-[20px] p-4 text-[.875rem] text-ink-2 text-center">
          {selectedDay ? 'Nessun turno per questo giorno.' : 'Tocca un giorno per vedere chi fa cosa.'}
        </section>
      )}

      <section aria-label={`Riepilogo di ${monthName}`} className="flex flex-col gap-2">
        <h2 className="text-[.9375rem] font-bold capitalize">Riepilogo {monthName}</h2>
        <AggregateSummaryList perUser={perUser} />
      </section>
    </>
  );
}
