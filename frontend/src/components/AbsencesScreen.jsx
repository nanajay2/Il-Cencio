import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { MONTHS_LONG, fmt, todayStr } from '../constants.js';
import { firstOfMonth, monthRangeOf, daysInRange } from '../lib/calendarBuckets.js';
import { Avatar } from './Avatar.jsx';

function prevMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().split('T')[0];
}
function nextMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
}
function leadingBlanks(firstDay) {
  return (new Date(firstDay + 'T12:00:00Z').getUTCDay() + 6) % 7;
}
function dayCount(from, to) {
  return Math.round((new Date(to + 'T12:00:00Z') - new Date(from + 'T12:00:00Z')) / 86400000) + 1;
}

export function AbsencesScreen({ house, currentUserId, absences, onAdd, onUpdate, onRemove }) {
  const today = todayStr();
  const [anchor, setAnchor] = useState(firstOfMonth(today));
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [userId, setUserId] = useState(currentUserId);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { start: monthStart, end: monthEnd } = monthRangeOf(anchor);
  const days = daysInRange(monthStart, monthEnd);
  const [y, m] = monthStart.split('-').map(Number);

  function tapDay(d) {
    if (!rangeStart || rangeEnd) {
      setRangeStart(d);
      setRangeEnd(null);
    } else if (d < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(d);
    } else {
      setRangeEnd(d);
    }
  }

  function startEdit(a) {
    setEditingId(a.id);
    setUserId(String(a.userId));
    setRangeStart(a.from);
    setRangeEnd(a.to);
    setAnchor(firstOfMonth(a.from));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setRangeStart(null);
    setRangeEnd(null);
    setUserId(currentUserId);
  }

  async function handleAdd() {
    if (!rangeStart || !rangeEnd || !userId) return;
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, userId, rangeStart, rangeEnd);
        setEditingId(null);
      } else {
        await onAdd(userId, rangeStart, rangeEnd);
      }
      setRangeStart(null);
      setRangeEnd(null);
    } finally {
      setSaving(false);
    }
  }

  const canAdd = rangeStart && rangeEnd && userId && !saving;
  const selectedName = String(userId) === String(currentUserId)
    ? 'La tua assenza'
    : `Assenza di ${house.users.find(u => String(u.id) === String(userId))?.name ?? ''}`;

  let rangeText = 'Tocca il primo giorno';
  if (rangeStart && !rangeEnd) rangeText = `${fmt(rangeStart)} · tocca l'ultimo giorno`;
  if (rangeStart && rangeEnd) {
    const n = dayCount(rangeStart, rangeEnd);
    rangeText = `${fmt(rangeStart)} – ${fmt(rangeEnd)} · ${n} ${n === 1 ? 'giorno' : 'giorni'}`;
  }

  return (
    <>
      <div>
        <h1 className="font-display font-extrabold text-[1.875rem] leading-[1.1] tracking-[-.02em]">Assenze</h1>
        <p className="text-[.875rem] text-ink-2 mt-1">
          {editingId ? 'Stai modificando un\'assenza.' : 'Segna quando qualcuno è via.'}
        </p>
      </div>

      <div role="group" aria-label="Chi" className="flex gap-1.5 overflow-x-auto -mx-5 px-5 pb-0.5">
        {house.users.map(u => {
          const active = String(u.id) === String(userId);
          return (
            <button
              key={u.id}
              type="button"
              aria-pressed={active}
              onClick={() => setUserId(u.id)}
              className={
                'h-10 pl-1.5 pr-3.5 rounded-full border-0 flex items-center gap-2 text-[.875rem] font-bold cursor-pointer flex-shrink-0 ' +
                (active ? 'bg-ink text-white' : 'bg-card text-ink')
              }
            >
              <Avatar name={u.name} size={28} />
              {String(u.id) === String(currentUserId) ? 'Tu' : u.name}
            </button>
          );
        })}
      </div>

      <section aria-label="Scegli i giorni" className="bg-card rounded-[20px] px-2.5 pt-2 pb-3.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAnchor(prevMonth(anchor))}
            aria-label="Mese precedente"
            className="w-11 h-10 border-0 bg-transparent text-ink flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <span className="text-[1rem] font-bold capitalize">{MONTHS_LONG[m - 1]} {y}</span>
          <button
            type="button"
            onClick={() => setAnchor(nextMonth(anchor))}
            aria-label="Mese successivo"
            className="w-11 h-10 border-0 bg-transparent text-ink flex items-center justify-center cursor-pointer"
          >
            <ChevronRight size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: leadingBlanks(monthStart) }, (_, i) => <span key={`b${i}`} />)}
          {days.map(d => {
            const last = rangeEnd ?? rangeStart;
            const inRange = rangeStart && d >= rangeStart && d <= last;
            const isEdge = d === rangeStart || d === rangeEnd;
            const single = rangeStart === last;
            let radius = 'rounded-xl';
            if (inRange && !single) {
              radius = d === rangeStart ? 'rounded-l-xl' : d === last ? 'rounded-r-xl' : '';
            }
            return (
              <button
                key={d}
                type="button"
                onClick={() => tapDay(d)}
                aria-pressed={!!inRange}
                aria-label={fmt(d)}
                className={
                  'h-10 border-0 p-0 text-[.875rem] font-semibold cursor-pointer ' + radius + ' ' +
                  (isEdge ? 'bg-primary text-white' : inRange ? 'bg-primary-soft text-primary' : d < today ? 'bg-transparent text-ink-2' : 'bg-transparent text-ink')
                }
              >
                {+d.split('-')[2]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 mt-3 px-1">
          <div className="flex-1 min-w-0">
            <div className="text-[.75rem] font-bold text-ink-2 uppercase tracking-[.06em] truncate">{selectedName}</div>
            <div className="text-[.9375rem] font-bold">{rangeText}</div>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-12 px-3.5 rounded-[14px] border-[1.5px] border-border bg-card text-ink text-[.875rem] font-bold cursor-pointer flex-shrink-0"
            >
              Annulla
            </button>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="h-12 px-4 rounded-[14px] border-0 bg-primary text-white text-[.9375rem] font-bold cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {saving ? 'Salvo…' : editingId ? 'Salva' : 'Aggiungi'}
          </button>
        </div>
      </section>

      <section aria-label="Assenze in programma" className="bg-card rounded-[20px] px-4 pt-3 pb-1">
        <h2 className="text-[.9375rem] font-bold mb-0.5">In programma</h2>
        {absences.length === 0 ? (
          <p className="text-[.875rem] text-ink-2 py-3 border-t border-soft">Nessuna assenza registrata.</p>
        ) : absences.map(a => (
          <div key={a.id} className="flex items-center gap-3 min-h-[52px] border-t border-soft">
            <Avatar name={a.userName} size={30} />
            <div className="flex-1 min-w-0">
              <div className="text-[.875rem] font-semibold truncate">{a.userName}</div>
              <div className="text-[.8125rem] text-ink-2">
                {fmt(a.from)} – {fmt(a.to)}{a.from <= today && a.to >= today ? ' · in corso' : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => startEdit(a)}
              aria-label={`Modifica assenza di ${a.userName}`}
              className="w-11 h-11 border-0 bg-transparent text-ink-2 flex items-center justify-center cursor-pointer flex-shrink-0 hover:text-ink"
            >
              <Pencil size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(a.id)}
              aria-label={`Elimina assenza di ${a.userName}`}
              className="w-11 h-11 -ml-2 border-0 bg-transparent text-ink-2 flex items-center justify-center cursor-pointer flex-shrink-0 hover:text-red"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
