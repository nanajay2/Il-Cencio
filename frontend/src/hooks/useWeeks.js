import { useState, useCallback } from 'react';
import { api } from '../api.js';
import { todayStr } from '../constants.js';

export function useWeeks() {
  const [weeks,      setWeeks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [currentIdx, setCurrentIdx] = useState(null);

  const sorted = [...weeks].sort((a, b) => a.start.localeCompare(b.start));

  function findCurrentIdx(arr) {
    const t = todayStr();
    let i = arr.findIndex(w => t >= w.start && t <= w.end);
    if (i < 0) i = arr.findIndex(w => w.start > t);
    return Math.max(0, i < 0 ? arr.length - 1 : i);
  }

  const load = useCallback(async (houseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWeeks(houseId);
      const s = [...data].sort((a, b) => a.start.localeCompare(b.start));
      setWeeks(s);
      setCurrentIdx(idx => idx === null ? findCurrentIdx(s) : Math.min(idx, s.length - 1));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function toggleDone(houseId, weekId, userId, roomId) {
    const week = weeks.find(w => w.id === weekId);
    const asgn = week?.assignments?.find(a => a.userId === userId && a.roomId === roomId);
    const prev = asgn?.done ?? false;

    // Ottimismo
    setWeeks(ws => ws.map(w =>
      w.id !== weekId ? w : {
        ...w,
        assignments: w.assignments.map(a =>
          (a.userId !== userId || a.roomId !== roomId) ? a : { ...a, done: !prev }
        ),
      }
    ));
    try {
      await api.toggleDone(houseId, weekId, userId, roomId, !prev);
    } catch (e) {
      // Rollback
      setWeeks(ws => ws.map(w =>
        w.id !== weekId ? w : {
          ...w,
          assignments: w.assignments.map(a =>
            (a.userId !== userId || a.roomId !== roomId) ? a : { ...a, done: prev }
          ),
        }
      ));
      throw e;
    }
  }

  async function generateWeek(houseId) {
    const nw = await api.generateWeek(houseId);
    setWeeks(ws => [...ws, nw].sort((a, b) => a.start.localeCompare(b.start)));
    return nw;
  }

  function goTo(delta) {
    setCurrentIdx(i => Math.max(0, Math.min(sorted.length - 1, i + delta)));
  }
  function goToCurrent() { setCurrentIdx(findCurrentIdx(sorted)); }
  function goToId(weekId) {
    const idx = sorted.findIndex(w => w.id === weekId);
    if (idx >= 0) setCurrentIdx(idx);
  }

  const resolvedIdx  = currentIdx === null ? 0 : Math.min(currentIdx, Math.max(sorted.length - 1, 0));

  return {
    weeks: sorted,
    currentWeek: sorted[resolvedIdx] ?? null,
    currentIdx:  resolvedIdx,
    loading, error, load,
    toggleDone, generateWeek, goTo, goToCurrent, goToId,
  };
}
