export const WEEKS_AHEAD = 4;

function addDays(s, n) {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

export const today = () => new Date().toISOString().split('T')[0];

function getMondayOfCurrentWeek() {
  const d = new Date();
  const utcDay = d.getUTCDay(); // 0=domenica
  const diff = utcDay === 0 ? -6 : 1 - utcDay;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Calcola la prossima settimana per una casa.
 *
 * @param {Array}  weeks  — settimane già esistenti (sorted)
 * @param {Array}  users  — [{ id }]
 * @param {Array}  rooms  — [{ id, sort_order }]
 * @param {Array}  rules  — [{ type, config }]
 * @returns {{ id, start, end, assignments: [{ user_id, room_id, done }] }} | null
 */
export function computeNextWeek(weeks, users, rooms, rules) {
  const sorted = [...weeks].sort((a, b) => a.start.localeCompare(b.start));
  const last   = sorted[sorted.length - 1];
  if (!last) return null;

  const ns = addDays(last.start, 7);
  const ne = addDays(ns, 6);
  if (weeks.find(w => w.start === ns)) return null;

  // Indice in sorted per "l'ultima volta che userId ha fatto roomId"
  function lastTimeDid(userId, roomId) {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((sorted[i].assignments || []).some(a =>
        (a.user_id ?? a.userId) === userId && (a.room_id ?? a.roomId) === roomId
      )) return i;
    }
    return -1;
  }

  // ── Costruzione vincoli ──────────────────────────────────────────
  const poolFor    = {};          // roomId → Set<userId>
  const exclusions = new Set();   // 'userId:roomId'
  const forced     = new Map();   // userId → roomId  (regole sequence)

  for (const rule of rules) {
    const { type, config } = rule;
    if (type === 'pool_restriction') {
      poolFor[config.room_id] = new Set(config.user_ids);
    } else if (type === 'exclusion') {
      exclusions.add(`${config.user_id}:${config.room_id}`);
    } else if (type === 'sequence') {
      const match = (last.assignments || []).find(a => (a.room_id ?? a.roomId) === config.from_room_id);
      if (match) forced.set(match.user_id ?? match.userId, config.to_room_id);
    }
  }

  const usedUsers = new Set();
  const usedRooms = new Set();
  const assigned  = new Map();   // userId → roomId

  function assign(userId, roomId) {
    assigned.set(userId, roomId);
    usedUsers.add(userId);
    usedRooms.add(roomId);
  }

  // Least-recently helper
  function pickLeast(pool, roomId) {
    const avail = pool.filter(uid =>
      !usedUsers.has(uid) && !exclusions.has(`${uid}:${roomId}`)
    );
    if (!avail.length) return null;
    return avail.reduce((best, uid) =>
      lastTimeDid(uid, roomId) < lastTimeDid(best, roomId) ? uid : best
    );
  }

  const allUserIds = users.map(u => u.id);
  const sortedRooms = [...rooms].sort((a, b) => a.sort_order - b.sort_order);

  // 1. Assegnazioni forzate (sequence)
  for (const [userId, roomId] of forced) {
    if (!usedUsers.has(userId) && !usedRooms.has(roomId) &&
        rooms.find(r => r.id === roomId)) {
      assign(userId, roomId);
    }
  }

  // 2. Pool-restricted rooms
  for (const [roomIdStr, allowedSet] of Object.entries(poolFor)) {
    const roomId = parseInt(roomIdStr);
    if (usedRooms.has(roomId)) continue;
    const allowed = [...allowedSet].filter(uid => allUserIds.includes(uid));
    const pick    = pickLeast(allowed, roomId);
    if (pick) assign(pick, roomId);
  }

  // 3. Stanze rimanenti → utenti rimanenti (least-recently)
  for (const room of sortedRooms) {
    if (usedRooms.has(room.id)) continue;
    const pick = pickLeast(allUserIds, room.id);
    if (pick) assign(pick, room.id);
  }

  const assignments = [...assigned.entries()].map(([user_id, room_id]) => ({
    user_id, room_id, done: false,
  }));

  return { id: ns, start: ns, end: ne, assignments };
}

export async function ensureFutureWeeks(db, houseId) {
  const [weeks, users, rooms, rules] = await Promise.all([
    db.getWeeks(houseId),
    db.getUsers(houseId),
    db.getRooms(houseId),
    db.getRules(houseId),
  ]);

  if (!users.length || !rooms.length) return 0;

  const t = today();
  let added = 0, safety = 0, current = [...weeks];

  // Nessuna settimana: crea una settimana fittizia la settimana scorsa
  // così computeNextWeek può generare la settimana corrente come prima reale
  if (!current.length) {
    const prevMonday = addDays(getMondayOfCurrentWeek(), -7);
    const fakeWeek = { id: prevMonday, start: prevMonday, end: addDays(prevMonday, 6), assignments: [] };
    const seed = computeNextWeek([fakeWeek], users, rooms, rules);
    if (seed) {
      await db.insertWeek(seed, houseId);
      current.push(seed);
      added++;
    }
  }

  while (safety++ < 20) {
    if (current.filter(w => w.start > t).length >= WEEKS_AHEAD) break;
    const nw = computeNextWeek(current, users, rooms, rules);
    if (!nw) break;
    await db.insertWeek(nw, houseId);
    current.push(nw);
    added++;
  }
  return added;
}

export async function purgeOldWeeks(db, houseId) {
  const cutoff = addDays(today(), -21);
  await db.deleteWeeksBefore(houseId, cutoff);
}
