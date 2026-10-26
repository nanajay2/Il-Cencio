import { supabase } from './lib/supabase.js';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

async function req(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (session) headers.Authorization = `Bearer ${session.access_token}`;

  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

const h = (houseId) => `/houses/${houseId}`;

// scope 'now' = l'utente ha scelto di ricalcolare anche il turno in corso;
// altrimenti la modifica vale dal turno successivo (vedi il backend).
const q = (scope) => (scope === 'now' ? '?recalculate=now' : '');

export const api = {
  // Onboarding — l'identità arriva dal JWT Supabase, non da PIN
  getHouseMembers: (houseId)            => req(`/houses/${houseId}/members`),
  claim:           ({ token, userId, name } = {}) =>
    req('/houses/claim', { method: 'POST', body: JSON.stringify({ token, userId, name }) }),
  myHouses:        ()                   => req('/houses/mine'),

  // Inviti (FEAT-06: link + QR, sostituiscono il codice esadecimale)
  resolveInvite:   (token)              => req(`/houses/invites/${token}`),
  createInvite:    (houseId, userId)    => req(`${h(houseId)}/invites`, { method: 'POST', body: JSON.stringify({ userId }) }),
  createHouse:     (name, adminName)    => req('/houses', { method: 'POST', body: JSON.stringify({ name, adminName }) }),

  // Casa
  getHouse:    (houseId)               => req(h(houseId)),
  updateRotation: (houseId, rotationType, rotationDays, scope) =>
    req(`${h(houseId)}/rotation${q(scope)}`, { method: 'PUT', body: JSON.stringify({ rotationType, rotationDays }) }),

  // Utenti
  createUser:  (houseId, name, email, scope) => req(`${h(houseId)}/users${q(scope)}`, { method: 'POST', body: JSON.stringify({ name, email }) }),
  deleteUser:  (houseId, userId)       => req(`${h(houseId)}/users/${userId}`, { method: 'DELETE' }),
  leaveHouse:  (houseId)               => req(`${h(houseId)}/leave`, { method: 'POST' }),

  // Stanze
  createRoom:  (houseId, data, scope)   => req(`${h(houseId)}/rooms${q(scope)}`, { method: 'POST', body: JSON.stringify(data) }),
  updateRoom:  (houseId, roomId, data) => req(`${h(houseId)}/rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom:  (houseId, roomId)       => req(`${h(houseId)}/rooms/${roomId}`, { method: 'DELETE' }),

  // Regole
  createRule:  (houseId, type, config, scope) => req(`${h(houseId)}/rules${q(scope)}`, { method: 'POST', body: JSON.stringify({ type, config }) }),
  updateRule:  (houseId, ruleId, type, config, scope) => req(`${h(houseId)}/rules/${ruleId}${q(scope)}`, { method: 'PUT', body: JSON.stringify({ type, config }) }),
  deleteRule:  (houseId, ruleId, scope) => req(`${h(houseId)}/rules/${ruleId}${q(scope)}`, { method: 'DELETE' }),

  // Settimane
  getWeeks:    (houseId)               => req(`${h(houseId)}/weeks`),
  generateWeek:(houseId)               => req(`${h(houseId)}/weeks`, { method: 'POST' }),
  toggleDone:  (houseId, weekId, roomId, done) =>
    req(`${h(houseId)}/weeks/${weekId}/done`, { method: 'PATCH', body: JSON.stringify({ roomId, done }) }),

  // Assenze
  getAbsences: (houseId)               => req(`${h(houseId)}/absences`),
  addAbsence:  (houseId, userId, from, to, scope) =>
    req(`${h(houseId)}/absences${q(scope)}`, { method: 'POST', body: JSON.stringify({ userId, from, to }) }),
  updateAbsence:(houseId, absenceId, userId, from, to, scope) =>
    req(`${h(houseId)}/absences/${absenceId}${q(scope)}`, { method: 'PUT', body: JSON.stringify({ userId, from, to }) }),
  deleteAbsence:(houseId, absenceId, scope) => req(`${h(houseId)}/absences/${absenceId}${q(scope)}`, { method: 'DELETE' }),

  // Notifiche push
  pushSubscribe:  (houseId, subscription) =>
    req(`${h(houseId)}/push/subscribe`, { method: 'POST', body: JSON.stringify({ subscription }) }),
  pushUnsubscribe:(houseId, endpoint) =>
    req(`${h(houseId)}/push/subscribe`, { method: 'DELETE', body: JSON.stringify({ endpoint }) }),

  // Scambio turni — fromUserId arriva dal JWT lato server, non dal body
  getSwaps:    (houseId)               => req(`${h(houseId)}/swaps`),
  createSwap:  (houseId, weekId, fromRoomId, toUserId, toRoomId) =>
    req(`${h(houseId)}/swaps`, { method: 'POST', body: JSON.stringify({ weekId, fromRoomId, toUserId, toRoomId }) }),
  acceptSwap:  (houseId, swapId)       => req(`${h(houseId)}/swaps/${swapId}/accept`, { method: 'POST' }),
  declineSwap: (houseId, swapId)       => req(`${h(houseId)}/swaps/${swapId}/decline`, { method: 'POST' }),
};
