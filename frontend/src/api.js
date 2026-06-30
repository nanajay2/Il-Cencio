const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

export const api = {
  getWeeks:        ()                  => req('/weeks'),
  generateWeek:    ()                  => req('/weeks', { method: 'POST' }),
  toggleDone:      (id, person, done)  => req(`/weeks/${id}/done`, { method: 'PATCH', body: JSON.stringify({ person, done }) }),
  getAbsences:     ()                  => req('/absences'),
  addAbsence:      (person, from, to)  => req('/absences', { method: 'POST', body: JSON.stringify({ person, from, to }) }),
  deleteAbsence:   (id)                => req(`/absences/${id}`, { method: 'DELETE' }),
};
