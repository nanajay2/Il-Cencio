import { useState, useEffect } from 'react';
import { todayStr, addDays } from '../constants.js';
import { weekRangeOf, monthRangeOf, turnosInRange, aggregateByUser, daysInRange } from '../lib/calendarBuckets.js';

// mode: 'week' | 'month'
// houseId + ensureThrough (da useWeeks): se il range mostrato arriva oltre le
// settimane già generate, le genera al volo scorrendo il calendario.
export function useAggregateView(weeks, users, mode, houseId, ensureThrough) {
  const [anchor, setAnchor] = useState(todayStr());

  const range   = mode === 'week' ? weekRangeOf(anchor) : monthRangeOf(anchor);
  const turnos  = turnosInRange(weeks, range.start, range.end);
  const perUser = aggregateByUser(turnos, users);
  const days    = daysInRange(range.start, range.end);

  useEffect(() => {
    if (!houseId || !ensureThrough) return;
    ensureThrough(houseId, range.end);
  }, [range.end, houseId]);

  function goPrev() {
    if (mode === 'week') { setAnchor(a => addDays(a, -7)); return; }
    setAnchor(a => {
      const [y, m] = a.split('-').map(Number);
      return new Date(Date.UTC(y, m - 2, 1)).toISOString().split('T')[0];
    });
  }
  function goNext() {
    if (mode === 'week') { setAnchor(a => addDays(a, 7)); return; }
    setAnchor(a => {
      const [y, m] = a.split('-').map(Number);
      return new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
    });
  }
  function goToday() { setAnchor(todayStr()); }

  return { range, turnos, perUser, days, goPrev, goNext, goToday };
}
