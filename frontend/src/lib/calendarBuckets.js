import { addDays } from '../constants.js';

export function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  const utcDay = d.getUTCDay(); // 0=domenica
  const diff = utcDay === 0 ? -6 : 1 - utcDay;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

export function weekRangeOf(dateStr) {
  const start = mondayOf(dateStr);
  return { start, end: addDays(start, 6) };
}

export function firstOfMonth(dateStr) {
  return `${dateStr.slice(0, 7)}-01`;
}

export function lastOfMonth(dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().split('T')[0];
}

export function monthRangeOf(dateStr) {
  const start = firstOfMonth(dateStr);
  return { start, end: lastOfMonth(start) };
}

export function daysInRange(start, end) {
  const days = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
}

// Un turno appartiene al periodo calendario che contiene la sua data di inizio.
export function turnosInRange(weeks, rangeStart, rangeEnd) {
  return weeks.filter(w => w.start >= rangeStart && w.start <= rangeEnd);
}

export function findTurnoForDate(weeks, dateStr) {
  return weeks.find(w => dateStr >= w.start && dateStr <= w.end) ?? null;
}

// Per persona: conteggio totale + stanze con conteggio per stanza.
export function aggregateByUser(turnos, users) {
  const byUser = new Map();

  for (const u of users) {
    byUser.set(u.id, { userId: u.id, userName: u.name, totalCount: 0, roomsById: new Map() });
  }

  for (const w of turnos) {
    for (const a of w.assignments) {
      if (!byUser.has(a.userId)) {
        byUser.set(a.userId, { userId: a.userId, userName: a.userName, totalCount: 0, roomsById: new Map() });
      }
      const u = byUser.get(a.userId);
      u.totalCount++;
      const r = u.roomsById.get(a.roomId) ?? {
        roomId: a.roomId, roomName: a.roomName, roomIcon: a.roomIcon, roomColor: a.roomColor, count: 0,
      };
      r.count++;
      u.roomsById.set(a.roomId, r);
    }
  }

  return [...byUser.values()]
    .map(u => ({
      ...u,
      rooms: [...u.roomsById.values()].sort((a, b) => b.count - a.count || a.roomName.localeCompare(b.roomName)),
    }))
    .sort((a, b) => a.userName.localeCompare(b.userName));
}
