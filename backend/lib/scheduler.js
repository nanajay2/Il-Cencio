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

  // ── Costruzione vincoli ──────────────────────────────────────────
  const poolFor    = new Map();   // roomId → Set<userId> (Map: chiave non stringificata, indipendente dal tipo id)
  const exclusions = new Set();   // 'userId:roomId'
  const forced     = new Map();   // userId → roomId  (regole sequence)

  for (const rule of rules) {
    const { type, config } = rule;
    if (type === 'pool_restriction') {
      poolFor.set(config.room_id, new Set(config.user_ids));
    } else if (type === 'exclusion') {
      exclusions.add(`${config.user_id}:${config.room_id}`);
    } else if (type === 'sequence') {
      // exempt_user_ids: persone a cui la sequenza non si applica (es. chi
      // condivide un bagno in pool ristretto: se chi fa la cucina venisse
      // forzato sul corridoio, l'altro si ritroverebbe il bagno due turni di fila)
      const exempt = new Set(config.exempt_user_ids ?? []);
      const match = (last.assignments || []).find(a => (a.room_id ?? a.roomId) === config.from_room_id);
      const uid = match && (match.user_id ?? match.userId);
      if (match && !exempt.has(uid)) forced.set(uid, config.to_room_id);
    }
  }

  const allUserIds = users.map(u => u.id);
  const sortedRooms = [...rooms].sort((a, b) => a.sort_order - b.sort_order);
  const presentUserIds = allUserIds.filter(uid => !isAbsentEnoughToExclude(uid));

  const weekLoad = new Map();   // userId → quante stanze già assegnate in questo turno
  const assigned = [];          // [{ user_id, room_id }]  — una persona può averne più di una
  const usedRooms = new Set();

  // 1. Assegnazioni forzate (sequence)
  for (const [userId, roomId] of forced) {
    if (!weekLoad.has(userId) && !usedRooms.has(roomId) &&
        rooms.find(r => r.id === roomId) && !isAbsentEnoughToExclude(userId)) {
      assigned.push({ user_id: userId, room_id: roomId });
      weekLoad.set(userId, 1);
      usedRooms.add(roomId);
    }
  }

  // 2. Tutte le altre stanze insieme, cercando la combinazione col costo
  //    totale minimo invece di assegnarle una alla volta in ordine: con
  //    l'assegnazione stanza-per-stanza l'ultima stanza finiva per forza a
  //    chi era rimasto libero, anche se l'aveva appena fatta (stessa stanza
  //    due turni di fila). Costo di dare roomId a userId:
  //    - ripetizione: pesante se l'ha fatta nel turno precedente, decresce
  //      (÷4) per ogni turno più indietro — è il criterio principale;
  //    - carico: ogni stanza oltre la prima nello stesso turno costa, e oltre
  //      la quota equa (stanze/persone arrotondato per eccesso) costa molto,
  //      così le stanze in più si spalmano e nessuno resta a zero inutilmente;
  //    - storico: chi ha fatto più stanze in passato paga un po' di più,
  //      per far ruotare chi resta senza turno o chi prende la stanza in più.
  //    Vincoli rigidi: pool_restriction, exclusion, assenze. Una stanza senza
  //    nessun candidato idoneo resta scoperta (come prima).
  const REPEAT_PENALTY   = 1000;
  const EXTRA_ROOM_COST  = 300;
  const OVER_QUOTA_COST  = 10000;
  const HISTORY_COST     = 10;
  const SEARCH_NODE_LIMIT = 200000;

  const quota = presentUserIds.length ? Math.ceil(sortedRooms.length / presentUserIds.length) : 1;

  function baseCost(userId, roomId) {
    const lastIdx = lastTimeDid(userId, roomId);
    const repeat = lastIdx < 0 ? 0 : REPEAT_PENALTY / 4 ** (sorted.length - 1 - lastIdx);
    return repeat + HISTORY_COST * totalAssignedCount(userId);
  }

  function loadCost(load) {   // costo aggiuntivo della (load+1)-esima stanza
    return (load > 0 ? EXTRA_ROOM_COST * load : 0) + (load >= quota ? OVER_QUOTA_COST : 0);
  }

  const openRooms = sortedRooms
    .filter(r => !usedRooms.has(r.id))
    .map(r => {
      const pool = poolFor.get(r.id);
      const candidates = presentUserIds
        .filter(uid => (!pool || pool.has(uid)) && !exclusions.has(`${uid}:${r.id}`))
        .map(uid => ({ uid, cost: baseCost(uid, r.id) }));
      return { id: r.id, candidates };
    })
    .filter(r => r.candidates.length)
    // prima le stanze con meno candidati: la ricerca pota molto prima
    .sort((a, b) => a.candidates.length - b.candidates.length);

  let best = null, bestCost = Infinity, nodes = 0;
  const choice = [];
  (function search(i, cost) {
    if (cost >= bestCost || nodes++ > SEARCH_NODE_LIMIT) return;
    if (i === openRooms.length) { bestCost = cost; best = [...choice]; return; }
    const room = openRooms[i];
    const options = room.candidates
      .map(c => ({ uid: c.uid, cost: c.cost + loadCost(weekLoad.get(c.uid) ?? 0) }))
      .sort((a, b) => a.cost - b.cost);
    for (const o of options) {
      weekLoad.set(o.uid, (weekLoad.get(o.uid) ?? 0) + 1);
      choice.push({ user_id: o.uid, room_id: room.id });
      search(i + 1, cost + o.cost);
      choice.pop();
      weekLoad.set(o.uid, weekLoad.get(o.uid) - 1);
    }
  })(0, 0);

  const byRoomOrder = new Map(sortedRooms.map((r, i) => [r.id, i]));
  assigned.push(...(best ?? []));
  assigned.sort((a, b) => byRoomOrder.get(a.room_id) - byRoomOrder.get(b.room_id));

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
