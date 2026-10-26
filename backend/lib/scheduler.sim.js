// Simulazioni riproducibili di computeNextWeek (nessun test runner nel repo):
//   node backend/lib/scheduler.sim.js
// Esce con codice 1 se un controllo fallisce.
import assert from 'node:assert/strict';
import { computeNextWeek } from './scheduler.js';

const ROTATION = { type: 'weekly', days: null };

function makeHouse(nUsers, nRooms) {
  return {
    users: Array.from({ length: nUsers }, (_, i) => ({ id: `u${i}`, name: `U${i}` })),
    rooms: Array.from({ length: nRooms }, (_, i) => ({ id: `r${i}`, name: `R${i}`, sort_order: i })),
  };
}

// Parte da un turno iniziale fittizio e genera `n` turni successivi.
function simulate({ users, rooms }, rules, n, absences = []) {
  const weeks = [{ id: '2026-01-05', start: '2026-01-05', end: '2026-01-11', assignments: [] }];
  for (let i = 0; i < n; i++) {
    const next = computeNextWeek(weeks, users, rooms, rules, ROTATION, absences);
    assert.ok(next, 'computeNextWeek ha restituito null');
    weeks.push(next);
  }
  return weeks.slice(1);
}

// Quante volte la stessa persona ha la stessa stanza in due turni di fila.
function consecutiveRepeats(weeks) {
  let count = 0;
  for (let i = 1; i < weeks.length; i++) {
    for (const a of weeks[i].assignments) {
      if (weeks[i - 1].assignments.some(p => p.user_id === a.user_id && p.room_id === a.room_id)) count++;
    }
  }
  return count;
}

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

test('nessuna ripetizione consecutiva, da 3 a 5 persone su 3-5 stanze', () => {
  for (let u = 3; u <= 5; u++) {
    const weeks = simulate(makeHouse(u, u), [], 16);
    assert.equal(consecutiveRepeats(weeks), 0, `${u} persone, ${u} stanze`);
  }
});

test('stanze in più: nessuno fa più di una stanza oltre la quota equa', () => {
  const weeks = simulate(makeHouse(3, 5), [], 12);
  for (const w of weeks) {
    const load = {};
    for (const a of w.assignments) load[a.user_id] = (load[a.user_id] ?? 0) + 1;
    assert.equal(w.assignments.length, 5);
    assert.ok(Math.max(...Object.values(load)) <= 2);
  }
});

test('persone in più: chi resta senza turno ruota', () => {
  const weeks = simulate(makeHouse(5, 3), [], 10);
  const idle = new Set();
  weeks.forEach((w, i) => {
    const busy = new Set(w.assignments.map(a => a.user_id));
    idle.add(['u0', 'u1', 'u2', 'u3', 'u4'].filter(u => !busy.has(u)).join());
  });
  assert.ok(idle.size > 1);
});

test('pool bagno a due persone: si alternano', () => {
  const house = makeHouse(4, 4);
  const rules = [{ type: 'pool_restriction', config: { room_id: 'r0', user_ids: ['u0', 'u1'] } }];
  const weeks = simulate(house, rules, 8);
  weeks.forEach(w => {
    const bagno = w.assignments.find(a => a.room_id === 'r0');
    assert.ok(['u0', 'u1'].includes(bagno.user_id));
  });
  assert.equal(consecutiveRepeats(weeks.map(w => ({
    assignments: w.assignments.filter(a => a.room_id === 'r0'),
  }))), 0);
});

test('pool interamente assente: stanza scoperta', () => {
  const house = makeHouse(4, 4);
  const rules = [{ type: 'pool_restriction', config: { room_id: 'r0', user_ids: ['u0'] } }];
  const absences = [{ userId: 'u0', from: '2026-01-01', to: '2026-12-31' }];
  const [w] = simulate(house, rules, 1, absences);
  assert.ok(!w.assignments.some(a => a.room_id === 'r0'));
  assert.ok(!w.assignments.some(a => a.user_id === 'u0'));
});

test('sequenza r1 -> r2 con esenzione: chi è esente non viene forzato', () => {
  const house = makeHouse(4, 4);
  const base = { from_room_id: 'r1', to_room_id: 'r2' };
  const [w1, w2] = simulate(house, [{ type: 'sequence', config: base }], 2);
  const cook = w1.assignments.find(a => a.room_id === 'r1').user_id;
  assert.equal(w2.assignments.find(a => a.room_id === 'r2').user_id, cook);

  const exempt = { ...base, exempt_user_ids: [cook] };
  const weeks = [
    { id: 'a', start: '2026-01-05', end: '2026-01-11', assignments: [
      { user_id: cook, room_id: 'r1' },
      ...['u0', 'u1', 'u2', 'u3'].filter(u => u !== cook).map((u, i) => ({ user_id: u, room_id: ['r0', 'r2', 'r3'][i] })),
    ] },
  ];
  const next = computeNextWeek(weeks, house.users, house.rooms, [{ type: 'sequence', config: exempt }], ROTATION, []);
  assert.notEqual(next.assignments.find(a => a.room_id === 'r2').user_id, cook);
});

test('casa 10x10 entro il budget di tempo', () => {
  const t0 = performance.now();
  simulate(makeHouse(10, 10), [], 5);
  assert.ok((performance.now() - t0) / 5 < 1000);
});

let failed = 0;
for (const { name, fn } of cases) {
  try { fn(); console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); }
}
process.exit(failed ? 1 : 0);
