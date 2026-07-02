import { useState } from 'react';
import { MONTHS, DAYS, fmt, todayStr } from '../constants.js';
import { firstOfMonth, monthRangeOf, daysInRange } from '../lib/calendarBuckets.js';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock.js';

const inputCls =
  'border-[1.5px] border-border rounded-[10px] px-3 py-2 text-[.84rem] font-sans ' +
  'bg-cream text-ink outline-none h-[38px] transition-colors focus:border-brown flex-1 min-w-0';

const btnCls =
  'h-[38px] px-4 bg-brown text-ink border-0 rounded-[10px] font-sans text-[.8rem] font-bold cursor-pointer hover:bg-brown-mid transition-colors whitespace-nowrap flex-shrink-0';

const sectionCls = 'bg-card rounded-2xl border border-border p-5 flex flex-col gap-3';
const titleCls   = 'font-bold text-[.92rem] text-ink mb-1';

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function prevMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 2, 1)).toISOString().split('T')[0];
}
function nextMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
}

export function AbsencesScreen({ house, currentUserId, absences, onAdd, onRemove, onClose }) {
  useBodyScrollLock();
  const [anchor, setAnchor] = useState(firstOfMonth(todayStr()));
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd,   setRangeEnd]   = useState(null);
  const [userId, setUserId] = useState(currentUserId);
  const [saving, setSaving] = useState(false);

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

  async function handleAdd() {
    if (!rangeStart || !rangeEnd || !userId) return;
    setSaving(true);
    try {
      await onAdd(Number(userId), rangeStart, rangeEnd);
      setRangeStart(null);
      setRangeEnd(null);
    } finally {
      setSaving(false);
    }
  }

  const canAdd = rangeStart && rangeEnd && userId && !saving;

  return (
    <div className="fixed inset-0 bg-brown z-[300] overflow-y-auto p-4">
      <div className="max-w-[480px] mx-auto flex flex-col gap-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}>

        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-[1.6rem] text-ink truncate">🗓️ Assenze</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 rounded-full border-0 cursor-pointer flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: 'rgba(78,34,15,.1)', color: '#7A5038' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(78,34,15,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(78,34,15,.1)'; }}
          >
            <CloseIcon />
          </button>
        </div>

        <section className={sectionCls}>
          <div className={titleCls}>Nuova assenza</div>
          <p className="text-[.77rem] text-ink-2 -mt-1">Tocca il primo e l'ultimo giorno dell'assenza.</p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnchor(prevMonth(anchor))}
              className="w-9 h-9 rounded-full border border-sage bg-cream flex items-center justify-center text-[1.1rem] text-ink cursor-pointer transition-all hover:bg-cream-2 flex-shrink-0"
            >
              ‹
            </button>
            <div className="flex-1 text-center text-[.92rem] font-bold text-ink capitalize">
              {MONTHS[m - 1]} {y}
            </div>
            <button
              onClick={() => setAnchor(nextMonth(anchor))}
              className="w-9 h-9 rounded-full border border-sage bg-cream flex items-center justify-center text-[1.1rem] text-ink cursor-pointer transition-all hover:bg-cream-2 flex-shrink-0"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map(d => {
              const inRange = rangeStart && d >= rangeStart && d <= (rangeEnd ?? rangeStart);
              const isEdge  = d === rangeStart || d === rangeEnd;
              return (
                <button
                  key={d}
                  onClick={() => tapDay(d)}
                  className={
                    'aspect-square flex items-center justify-center rounded-lg text-[.78rem] font-semibold cursor-pointer transition-colors border ' +
                    (isEdge
                      ? 'bg-brown text-ink border-brown'
                      : inRange
                      ? 'bg-cream-2 text-ink border-border'
                      : 'bg-cream text-ink border-border hover:bg-cream-2 hover:border-sage')
                  }
                >
                  {+d.split('-')[2]}
                </button>
              );
            })}
          </div>

          {rangeStart && (
            <p className="text-[.82rem] text-ink-2">
              Dal <strong className="text-ink">{fmt(rangeStart)}</strong> al{' '}
              <strong className="text-ink">{rangeEnd ? fmt(rangeEnd) : '…'}</strong>
            </p>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[.7rem] font-bold text-ink-2 mb-1 uppercase tracking-[.05em]">Persona</label>
              <select value={userId} onChange={e => setUserId(e.target.value)} className={inputCls + ' w-full'}>
                {house.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <button onClick={handleAdd} disabled={!canAdd} className={btnCls + ' disabled:opacity-50 disabled:cursor-not-allowed'}>
              {saving ? 'Salvataggio…' : 'Aggiungi'}
            </button>
          </div>
        </section>

        <section className={sectionCls}>
          <div className={titleCls}>Assenze registrate</div>
          <div className="flex flex-col gap-1.5">
            {absences.length === 0 ? (
              <p className="text-[.82rem] text-ink-2">Nessuna assenza registrata.</p>
            ) : absences.map(a => (
              <div key={a.id} className="flex items-center justify-between px-3 py-[9px] bg-cream rounded-[10px] text-[.83rem] border border-border">
                <span><strong>{a.userName}</strong> — dal {fmt(a.from)} al {fmt(a.to)}</span>
                <button
                  onClick={() => onRemove(a.id)}
                  className="border-0 bg-transparent cursor-pointer text-ink-2 text-[.9rem] px-[7px] py-[3px] rounded-md transition-all hover:text-red hover:bg-red-pale"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
