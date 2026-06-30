import { useState, useCallback } from 'react';
import { api } from '../api.js';

export function useAbsences() {
  const [absences, setAbsences] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const load = useCallback(async (houseId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAbsences(houseId);
      setAbsences(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  async function addAbsence(houseId, userId, from, to) {
    const abs = await api.addAbsence(houseId, userId, from, to);
    setAbsences(a => [...a, abs]);
    return abs;
  }

  async function removeAbsence(houseId, absenceId) {
    await api.deleteAbsence(houseId, absenceId);
    setAbsences(a => a.filter(x => x.id !== absenceId));
  }

  function isAbsent(userId, weekStart, weekEnd) {
    return absences.some(a => a.userId === userId && a.from <= weekEnd && a.to >= weekStart);
  }

  return { absences, loading, error, load, addAbsence, removeAbsence, isAbsent };
}
