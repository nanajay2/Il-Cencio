import { useState, useCallback } from 'react';
import { api } from '../api.js';
import { isCurW, todayStr } from '../constants.js';

export function useWeeks() {
  const [weeks,          setWeeks]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [currentIdx,     setCurrentIdx]     = useState(null);

  const sorted = [...weeks].sort((a, b) => a.start.localeCompare(b.start));

  function findCurrentIdx(arr) {
    const t = todayStr();
    let i = arr.findIndex(w => t >= w.start && t <= w.end);
    if (i < 0) i = arr.findIndex(w => w.start > t);
    return Math.max(0, i < 0 ? arr.length - 1 : i);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWeeks();
      const s = [...data].sort((a, b) => a.start.localeCompare(b.start));
      setWeeks(s);
      setCurrentIdx(idx => idx === null ? findCurrentIdx(s) : Math.min(idx, s.length - 1));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function toggleDone(weekId, person) {
    const prev = weeks.find(w => w.id === weekId)?.done?.[person] ?? false;
    // optimistic
    setWeeks(ws => ws.map(w =>
      w.id !== weekId ? w : { ...w, done: { ...w.done, [person]: !prev } }
    ));
    try {
      await api.toggleDone(weekId, person, !prev);
    } catch (e) {
      // rollback
      setWeeks(ws => ws.map(w =>
        w.id !== weekId ? w : { ...w, done: { ...w.done, [person]: prev } }
      ));
      throw e;
    }
  }

  async function generateWeek() {
    const nw = await api.generateWeek();
    setWeeks(ws => [...ws, nw].sort((a, b) => a.start.localeCompare(b.start)));
    return nw;
  }

  function goTo(delta) {
    setCurrentIdx(i => Math.max(0, Math.min(sorted.length - 1, i + delta)));
  }
  function goToCurrent() {
    setCurrentIdx(findCurrentIdx(sorted));
  }

  const resolvedIdx = currentIdx === null ? 0 : Math.min(currentIdx, sorted.length - 1);

  return {
    weeks: sorted,
    currentWeek: sorted[resolvedIdx] ?? null,
    currentIdx:  resolvedIdx,
    loading,
    error,
    load,
    toggleDone,
    generateWeek,
    goTo,
    goToCurrent,
  };
}
