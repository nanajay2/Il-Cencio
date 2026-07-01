import { useState } from 'react';
import { todayStr, addDays } from '../constants.js';
import { weekRangeOf, monthRangeOf, turnosInRange, aggregateByUser, daysInRange } from '../lib/calendarBuckets.js';

// mode: 'week' | 'month'
export function useAggregateView(weeks, users, mode) {
  const [anchor, setAnchor] = useState(todayStr());

  const range   = mode === 'week' ? weekRangeOf(anchor) : monthRangeOf(anchor);
  const turnos  = turnosInRange(weeks, range.start, range.end);
  const perUser = aggregateByUser(turnos, users);
  const days    = daysInRange(range.start, range.end);

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
