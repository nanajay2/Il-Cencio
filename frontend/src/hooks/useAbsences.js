import { useState, useCallback } from 'react';
import { api } from '../api.js';

export function useAbsences() {
  const [absences, setAbsences] = useState([]);

  const load = useCallback(async () => {
    const data = await api.getAbsences();
    setAbsences(data);
  }, []);

  async function addAbsence(person, from, to) {
    const a = await api.addAbsence(person, from, to);
    setAbsences(prev => [...prev, a]);
  }

  async function removeAbsence(id) {
    await api.deleteAbsence(id);
    setAbsences(prev => prev.filter(a => a.id !== id));
  }

  function isAbsent(person, weekStart, weekEnd) {
    return absences.some(a => a.person === person && a.from <= weekEnd && a.to >= weekStart);
  }

  return { absences, load, addAbsence, removeAbsence, isAbsent };
}
