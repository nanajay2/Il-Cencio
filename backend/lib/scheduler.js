const PEOPLE = ['Giada', 'Silvia', 'Giulia', 'Eliana', 'Marco'];
const CHORES = ['Cucina', 'Bagno 1', 'Bagno 2', 'Corridoio', 'Spazzatura'];
const BAGNO1 = ['Giada', 'Silvia', 'Eliana'];
const BAGNO2 = ['Marco', 'Giulia'];
const WEEKS_AHEAD = 4;

function addDays(s, n) {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function lastTimeDid(person, chore, weeks) {
  for (let i = weeks.length - 1; i >= 0; i--)
    if (weeks[i].assignments?.[person] === chore) return i;
  return -1;
}

export function computeNextWeek(weeks) {
  const sorted = [...weeks].sort((a, b) => a.start.localeCompare(b.start));
  const last   = sorted[sorted.length - 1];
  const ns     = addDays(last.start, 7);
  const ne     = addDays(ns, 6);
  if (weeks.find(w => w.start === ns)) return null;

  const asgn = {}, usedP = new Set(), usedC = new Set();

  const lastCucinaP = Object.entries(last.assignments || {}).find(([, c]) => c === 'Cucina')?.[0];
  if (lastCucinaP) { asgn[lastCucinaP] = 'Corridoio'; usedP.add(lastCucinaP); usedC.add('Corridoio'); }

  const pickLeast = (pool, chore) => {
    const avail = pool.filter(p => !usedP.has(p));
    if (!avail.length) return null;
    return avail.reduce((b, p) => lastTimeDid(p, chore, weeks) < lastTimeDid(b, chore, weeks) ? p : b);
  };

  const b1 = pickLeast(BAGNO1, 'Bagno 1');
  if (b1) { asgn[b1] = 'Bagno 1'; usedP.add(b1); usedC.add('Bagno 1'); }
  const b2 = pickLeast(BAGNO2, 'Bagno 2');
  if (b2) { asgn[b2] = 'Bagno 2'; usedP.add(b2); usedC.add('Bagno 2'); }

  let remP = PEOPLE.filter(p => !usedP.has(p));
  let remC = CHORES.filter(c => !usedC.has(c));

  if (remC.includes('Cucina') && remP.length) {
    const cp = remP.reduce((b, p) => lastTimeDid(p, 'Cucina', weeks) < lastTimeDid(b, 'Cucina', weeks) ? p : b);
    asgn[cp] = 'Cucina'; usedP.add(cp); usedC.add('Cucina');
    remP = remP.filter(p => p !== cp);
    remC = remC.filter(c => c !== 'Cucina');
  }
  remP.forEach((p, i) => { if (remC[i]) asgn[p] = remC[i]; });

  const taken = new Set(Object.values(asgn));
  PEOPLE.forEach(p => {
    if (!asgn[p]) { const l = CHORES.find(c => !taken.has(c)); if (l) { asgn[p] = l; taken.add(l); } }
  });

  const done = {};
  PEOPLE.forEach(p => done[p] = false);
  return { id: ns, start: ns, end: ne, assignments: asgn, done };
}

export async function ensureFutureWeeks(db) {
  const weeks = await db.getWeeks();
  const t = today();
  const future = weeks.filter(w => w.start > t);
  if (future.length >= WEEKS_AHEAD) return 0;

  let added = 0, safety = 0, current = [...weeks];
  while (safety++ < 20) {
    if (current.filter(w => w.start > t).length >= WEEKS_AHEAD) break;
    const nw = computeNextWeek(current);
    if (!nw) break;
    await db.insertWeek(nw);
    current.push(nw);
    added++;
  }
  return added;
}

export async function purgeOldWeeks(db) {
  const cutoff = addDays(today(), -21);
  await db.deleteWeeksBefore(cutoff);
}
