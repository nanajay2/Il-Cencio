// Genera automaticamente i turni finche' non coprono almeno questo orizzonte
// da oggi, indipendentemente dal tipo di rotazione (settimanale/giornaliera
// personalizzata/mensile hanno durate diverse, quindi contare "N periodi"
// come si faceva prima dava orizzonti molto diversi tra loro).
export const AUTO_GENERATE_HORIZON_DAYS = 30;

function addDays(s, n) {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

// Numero di giorni nell'intervallo [a, b] inclusi entrambi gli estremi.
function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000) + 1;
}

// Una persona viene esclusa dal turno se la sua assenza copre più di questa
// frazione della durata del turno (es. 0.75 = più di 3/4 del periodo).
const ABSENCE_EXCLUSION_THRESHOLD = 0.75;

export const today = () => new Date().toISOString().split('T')[0];

function getMondayOfCurrentWeek() {
  const d = new Date();
  const utcDay = d.getUTCDay(); // 0=domenica
  const diff = utcDay === 0 ? -6 : 1 - utcDay;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

function firstOfMonth(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}
function firstOfMonthBefore(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${py}-${String(pm).padStart(2, '0')}-01`;
}
function firstOfNextMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
}
function lastOfMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().split('T')[0];
}

// Avanza al periodo successivo in base alla rotazione della casa.
// rotation = { type: 'weekly'|'daily'|'monthly', days: number|null }
function nextPeriod(lastStart, rotation) {
  if (rotation.type === 'monthly') {
    const ns = firstOfNextMonth(lastStart);
    return [ns, lastOfMonth(ns)];
  }
  const n = rotation.type === 'daily' ? (rotation.days || 1) : 7;
  const ns = addDays(lastStart, n);
  return [ns, addDays(ns, n - 1)];
}

/**
 * Calcola il prossimo turno per una casa.
 *
 * @param {Array}  weeks  — turni già esistenti (sorted)
 * @param {Array}  users  — [{ id }]
 * @param {Array}  rooms  — [{ id, sort_order }]
 * @param {Array}  rules  — [{ type, config }]
 * @param {Object} rotation — { type: 'weekly'|'daily'|'monthly', days: number|null }
 * @param {Array}  absences — [{ userId, from, to }]
 * @returns {{ id, start, end, assignments: [{ user_id, room_id, done }] }} | null
 */
export function computeNextWeek(weeks, users, rooms, rules, rotation = { type: 'weekly', days: null }, absences = []) {
  const sorted = [...weeks].sort((a, b) => a.start.localeCompare(b.start));
  const last   = sorted[sorted.length - 1];
  if (!last) return null;

  const [ns, ne] = nextPeriod(last.start, rotation);
  if (weeks.find(w => w.start === ns)) return null;

  // Vero se l'assenza copre più di ABSENCE_EXCLUSION_THRESHOLD della durata
  // del turno: in quel caso la persona viene esclusa e il turno va a
  // qualcun altro. Un'assenza più breve non esclude, la persona fa comunque
  // il turno (resta solo il badge in UI).
  const periodDays = daysBetween(ns, ne);
  function isAbsentEnoughToExclude(userId) {
    return absences.some(a => {
      if (a.userId !== userId) return false;
      const overlapStart = a.from > ns ? a.from : ns;
      const overlapEnd   = a.to   < ne ? a.to   : ne;
      if (overlapStart > overlapEnd) return false;
      return daysBetween(overlapStart, overlapEnd) / periodDays > ABSENCE_EXCLUSION_THRESHOLD;
    });
  }

  // Indice in sorted per "l'ultima volta che userId ha fatto roomId"
  function lastTimeDid(userId, roomId) {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((sorted[i].assignments || []).some(a =>
        (a.user_id ?? a.userId) === userId && (a.room_id ?? a.roomId) === roomId
      )) return i;
    }
    return -1;
  }

  // Quante stanze in totale userId ha fatto in passato (usato per far ruotare
  // equamente sia chi resta senza turno quando le persone superano le stanze,
  // sia chi si becca le stanze "in più" quando le stanze superano le persone)
  function totalAssignedCount(userId) {
    let count = 0;
    for (const w of sorted) {
      count += (w.assignments || []).filter(a => (a.user_id ?? a.userId) === userId).length;
    }
    return count;
  }

  // Indice in sorted per "l'ultima volta che userId ha avuto un turno qualsiasi"
  // (usato per far ruotare equamente chi resta senza turno quando gli utenti superano le stanze)
  function lastTimeAssigned(userId) {
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((sorted[i].assignments || []).some(a => (a.user_id ?? a.userId) === userId)) return i;
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

  const usedRooms = new Set();
  const weekLoad  = new Map();   // userId → quante stanze già assegnate in questa settimana
  const assigned  = [];          // [{ user_id, room_id }]  — una persona può averne più di una

  function assign(userId, roomId) {
    assigned.push({ user_id: userId, room_id: roomId });
    weekLoad.set(userId, (weekLoad.get(userId) ?? 0) + 1);
    usedRooms.add(roomId);
  }

  // Sceglie chi assegnare a roomId dando priorità, in ordine:
  // 1. chi non fa questa specifica stanza da più tempo (varietà per stanza — il
  //    criterio principale: senza questo, chi resta "occupato" da un'assegnazione
  //    forzata come le regole di sequenza risulterebbe sempre svantaggiato nei
  //    confronti successivi e finirebbe incastrato sempre sulla stessa stanza)
  // 2. chi ha fatto meno stanze in totale nella storia (bilancia il carico
  //    complessivo nel tempo)
  // 3. chi è senza turno da più tempo in generale (fa ruotare chi resta escluso
  //    quando gli utenti superano le stanze)
  // 4. chi ha meno stanze assegnate finora in questa settimana (spalma il
  //    carico extra quando le stanze superano le persone — ultimo criterio,
  //    altrimenti sovrasta la varietà per stanza)
  function pickLeast(pool, roomId) {
    const avail = pool.filter(uid => !exclusions.has(`${uid}:${roomId}`) && !isAbsentEnoughToExclude(uid));
    if (!avail.length) return null;
    return avail.reduce((best, uid) => {
      const lastUid = lastTimeDid(uid, roomId), lastBest = lastTimeDid(best, roomId);
      if (lastUid !== lastBest) return lastUid < lastBest ? uid : best;

      const totUid = totalAssignedCount(uid), totBest = totalAssignedCount(best);
      if (totUid !== totBest) return totUid < totBest ? uid : best;

      const idleUid  = lastTimeAssigned(uid);
      const idleBest = lastTimeAssigned(best);
      if (idleUid !== idleBest) return idleUid < idleBest ? uid : best;

      const loadUid = weekLoad.get(uid) ?? 0, loadBest = weekLoad.get(best) ?? 0;
      return loadUid < loadBest ? uid : best;
    });
  }

  const allUserIds = users.map(u => u.id);
  const sortedRooms = [...rooms].sort((a, b) => a.sort_order - b.sort_order);

  // 1. Assegnazioni forzate (sequence)
  for (const [userId, roomId] of forced) {
    if (!weekLoad.has(userId) && !usedRooms.has(roomId) &&
        rooms.find(r => r.id === roomId) && !isAbsentEnoughToExclude(userId)) {
      assign(userId, roomId);
    }
  }

  // 2. Pool-restricted rooms — prova prima chi non ha ancora nulla questa
  //    settimana, così non si "ruba" la stanza a chi aspetta il suo turno solo
  //    perché il tie-break li preferiva; ricade su tutto il pool solo se
  //    proprio nessun membro è più libero (più stanze che persone nel pool).
  for (const [roomIdStr, allowedSet] of Object.entries(poolFor)) {
    const roomId = parseInt(roomIdStr);
    if (usedRooms.has(roomId)) continue;
    const allowed  = [...allowedSet].filter(uid => allUserIds.includes(uid));
    const free     = allowed.filter(uid => !weekLoad.has(uid));
    const pick     = pickLeast(free.length ? free : allowed, roomId);
    if (pick) assign(pick, roomId);
  }

  // 3. Stanze rimanenti → utenti rimanenti (least-recently), stesso principio:
  //    priorità a chi è ancora completamente libero.
  for (const room of sortedRooms) {
    if (usedRooms.has(room.id)) continue;
    const free = allUserIds.filter(uid => !weekLoad.has(uid));
    const pick = pickLeast(free.length ? free : allUserIds, room.id);
    if (pick) assign(pick, room.id);
  }

  const assignments = assigned.map(({ user_id, room_id }) => ({
    user_id, room_id, done: false,
  }));

  return { id: ns, start: ns, end: ne, assignments };
}

export async function ensureFutureWeeks(db, houseId) {
  const [weeks, users, rooms, rules, rotation, absences] = await Promise.all([
    db.getWeeks(houseId),
    db.getUsers(houseId),
    db.getRooms(houseId),
    db.getRules(houseId),
    db.getRotationConfig(houseId),
    db.getAbsences(houseId),
  ]);

  if (!users.length || !rooms.length) return 0;

  const t = today();
  let added = 0, safety = 0, current = [...weeks];

  // Nessun turno: crea un turno fittizio precedente così computeNextWeek
  // può generare il turno corrente come primo reale. L'anchor dipende dalla
  // rotazione: settimanale resta ancorata al lunedì corrente (comportamento
  // invariato); giornaliera/mensile partono da oggi (giorno di creazione
  // della casa o di attivazione della rotazione dalle impostazioni).
  if (!current.length) {
    const anchor = rotation.type === 'weekly'
      ? getMondayOfCurrentWeek()
      : rotation.type === 'monthly'
      ? firstOfMonth(today())
      : today();

    const prevStart = rotation.type === 'monthly'
      ? firstOfMonthBefore(anchor)
      : addDays(anchor, -(rotation.type === 'daily' ? (rotation.days || 1) : 7));

    const fakeWeek = { id: prevStart, start: prevStart, end: addDays(anchor, -1), assignments: [] };
    const seed = computeNextWeek([fakeWeek], users, rooms, rules, rotation, absences);
    if (seed) {
      await db.insertWeek(seed, houseId);
      current.push(seed);
      added++;
    }
  }

  const horizon = addDays(t, AUTO_GENERATE_HORIZON_DAYS);
  while (safety++ < 40) {
    const last = current[current.length - 1];
    if (last && last.end >= horizon) break;
    const nw = computeNextWeek(current, users, rooms, rules, rotation, absences);
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

// Le stanze sono cambiate: le settimane non ancora concluse (corrente + future)
// possono avere assignment orfani o mancanti per le vecchie/nuove stanze.
// Le cancelliamo: ensureFutureWeeks le rigenera da capo allo step successivo.
export async function invalidateUpcomingWeeks(db, houseId) {
  await db.deleteWeeksFrom(houseId, today());
}
