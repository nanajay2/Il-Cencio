const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

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

const h = (houseId) => `/houses/${houseId}`;

export const api = {
  // Auth / onboarding
  join:        (inviteCode)            => req('/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  createHouse: (name, adminName, adminEmail) =>
    req('/houses', { method: 'POST', body: JSON.stringify({ name, adminName, adminEmail }) }),

  // Casa
  getHouse:    (houseId)               => req(h(houseId)),

  // Utenti
  createUser:  (houseId, name, email)  => req(`${h(houseId)}/users`, { method: 'POST', body: JSON.stringify({ name, email }) }),
  deleteUser:  (houseId, userId)       => req(`${h(houseId)}/users/${userId}`, { method: 'DELETE' }),

  // Stanze
  createRoom:  (houseId, data)         => req(`${h(houseId)}/rooms`, { method: 'POST', body: JSON.stringify(data) }),
  updateRoom:  (houseId, roomId, data) => req(`${h(houseId)}/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom:  (houseId, roomId)       => req(`${h(houseId)}/rooms/${roomId}`, { method: 'DELETE' }),

  // Regole
  createRule:  (houseId, type, config) => req(`${h(houseId)}/rules`, { method: 'POST', body: JSON.stringify({ type, config }) }),
  deleteRule:  (houseId, ruleId)       => req(`${h(houseId)}/rules/${ruleId}`, { method: 'DELETE' }),

  // Settimane
  getWeeks:    (houseId)               => req(`${h(houseId)}/weeks`),
  generateWeek:(houseId)               => req(`${h(houseId)}/weeks`, { method: 'POST' }),
  toggleDone:  (houseId, weekId, userId, done) =>
    req(`${h(houseId)}/weeks/${weekId}/done`, { method: 'PATCH', body: JSON.stringify({ userId, done }) }),

  // Assenze
  getAbsences: (houseId)               => req(`${h(houseId)}/absences`),
  addAbsence:  (houseId, userId, from, to) =>
    req(`${h(houseId)}/absences`, { method: 'POST', body: JSON.stringify({ userId, from, to }) }),
  deleteAbsence:(houseId, absenceId)   => req(`${h(houseId)}/absences/${absenceId}`, { method: 'DELETE' }),
};
