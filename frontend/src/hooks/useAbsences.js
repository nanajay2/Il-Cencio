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

  async function updateAbsence(houseId, absenceId, userId, from, to) {
    const abs = await api.updateAbsence(houseId, absenceId, userId, from, to);
    setAbsences(a => a.map(x => x.id === absenceId ? abs : x));
    return abs;
  }

  async function removeAbsence(houseId, absenceId) {
    await api.deleteAbsence(houseId, absenceId);
    setAbsences(a => a.filter(x => x.id !== absenceId));
  }

  // Soglia duplicata da ABSENCE_EXCLUSION_THRESHOLD in backend/lib/scheduler.js
  // (isAbsentEnoughToExclude): il badge deve comparire esattamente quando il
  // backend esclude la persona dal turno, non prima/dopo. Prima di questo fix
  // qui si richiedeva copertura 100% della settimana mentre il backend esclude
  // già oltre il 75% — le due metà divergevano (assegnazioni "senza motivo"
  // visibile). Duplicazione temporanea, intenzionale: la soglia sparisce del
  // tutto quando arriva la decisione esplicita per-settimana (roadmap §12.1).
  const ABSENCE_EXCLUSION_THRESHOLD = 0.75;

  function daysBetween(a, b) {
    return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000) + 1;
  }

  function isAbsent(userId, weekStart, weekEnd) {
    const periodDays = daysBetween(weekStart, weekEnd);
    return absences.some(a => {
      if (a.userId !== userId) return false;
      const overlapStart = a.from > weekStart ? a.from : weekStart;
      const overlapEnd   = a.to   < weekEnd   ? a.to   : weekEnd;
      if (overlapStart > overlapEnd) return false;
      return daysBetween(overlapStart, overlapEnd) / periodDays > ABSENCE_EXCLUSION_THRESHOLD;
    });
  }

  return { absences, loading, error, load, addAbsence, updateAbsence, removeAbsence, isAbsent };
}
