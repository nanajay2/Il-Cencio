import cron from 'node-cron';
import { db } from './db.js';
import { sendNotification } from './push.js';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayStr() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

function groupPendingByUser(assignments) {
  const byUser = new Map();
  for (const a of assignments) {
    if (a.done) continue;
    if (!byUser.has(a.userId)) byUser.set(a.userId, []);
    byUser.get(a.userId).push(a.roomName);
  }
  return byUser;
}

// Per ogni casa, ricorda ai coinquilini le stanze non ancora segnate come
// fatte nella settimana corrente.
async function sendDailyReminders() {
  const today = todayStr();
  const houseIds = await db.getAllHouseIds();

  for (const houseId of houseIds) {
    try {
      const weeks = await db.getWeeks(houseId);
      const currentWeek = weeks.find(w => today >= w.start && today <= w.end);
      if (!currentWeek) continue;

      const pendingByUser = groupPendingByUser(currentWeek.assignments);
      await Promise.all([...pendingByUser.entries()].map(([userId, roomNames]) =>
        sendNotification(houseId, {
          title: 'Promemoria turni',
          body: `Da fare ancora questa settimana: ${roomNames.join(', ')}.`,
          url: '/',
        }, userId)
      ));
    } catch (e) {
      console.error(`Reminder giornaliero fallito per casa ${houseId}:`, e.message);
    }
  }
}

// Il giorno dopo la fine di un turno, avvisa chi ha lasciato stanze non
// segnate come fatte.
async function sendMissedTurnReminders() {
  const yesterday = yesterdayStr();
  const houseIds = await db.getAllHouseIds();

  for (const houseId of houseIds) {
    try {
      const weeks = await db.getWeeks(houseId);
      const endedWeek = weeks.find(w => w.end === yesterday);
      if (!endedWeek) continue;

      const missedByUser = groupPendingByUser(endedWeek.assignments);
      await Promise.all([...missedByUser.entries()].map(([userId, roomNames]) =>
        sendNotification(houseId, {
          title: 'Turno non completato',
          body: `Non hai segnato come fatto: ${roomNames.join(', ')}.`,
          url: '/',
        }, userId)
      ));
    } catch (e) {
      console.error(`Reminder turno mancato fallito per casa ${houseId}:`, e.message);
    }
  }
}

// Ogni giorno alle 9:00, ora del server.
export function startReminderCron() {
  cron.schedule('0 9 * * *', sendDailyReminders);
  cron.schedule('0 9 * * *', sendMissedTurnReminders);
}
