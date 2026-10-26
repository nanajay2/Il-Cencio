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

function groupByUser(assignments, { pendingOnly }) {
  const byUser = new Map();
  for (const a of assignments) {
    if (pendingOnly && a.done) continue;
    if (!byUser.has(a.userId)) byUser.set(a.userId, []);
    byUser.get(a.userId).push(a.roomName);
  }
  return byUser;
}

// Per ogni casa, due soli avvisi per turno invece di uno ogni giorno:
// - il primo giorno del turno, a tutti, le stanze assegnate;
// - l'ultimo giorno, a chi ha ancora stanze non segnate come fatte.
// Con turni di un giorno solo (inizio = fine) parte solo il primo.
async function sendTurnReminders() {
  const today = todayStr();
  const houseIds = await db.getAllHouseIds();

  for (const houseId of houseIds) {
    try {
      const weeks = await db.getWeeks(houseId);
      const currentWeek = weeks.find(w => today >= w.start && today <= w.end);
      if (!currentWeek) continue;

      if (today === currentWeek.start) {
        const byUser = groupByUser(currentWeek.assignments, { pendingOnly: false });
        await Promise.all([...byUser.entries()].map(([userId, roomNames]) =>
          sendNotification(houseId, {
            title: 'Nuovo turno',
            body: `Questo turno hai ${roomNames.join(', ')}.`,
            url: '/',
          }, userId)
        ));
      } else if (today === currentWeek.end) {
        const pendingByUser = groupByUser(currentWeek.assignments, { pendingOnly: true });
        await Promise.all([...pendingByUser.entries()].map(([userId, roomNames]) =>
          sendNotification(houseId, {
            title: 'Ultimo giorno del turno',
            body: `Devi ancora fare ${roomNames.join(', ')}: oggi è l'ultimo giorno.`,
            url: '/',
          }, userId)
        ));
      }
    } catch (e) {
      console.error(`Reminder turno fallito per casa ${houseId}:`, e.message);
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

      const missedByUser = groupByUser(endedWeek.assignments, { pendingOnly: true });
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
  cron.schedule('0 9 * * *', sendTurnReminders);
  cron.schedule('0 9 * * *', sendMissedTurnReminders);
}
