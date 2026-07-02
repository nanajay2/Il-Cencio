import { Router } from 'express';
import { db } from '../lib/db.js';
import { computeNextWeek, ensureFutureWeeks, purgeOldWeeks } from '../lib/scheduler.js';
import { sendNotification } from '../lib/push.js';

const router = Router({ mergeParams: true });

// Notifica ogni coinquilino delle stanze assegnategli nella settimana appena generata.
async function notifyAssignedUsers(houseId, week) {
  const roomsByUser = new Map();
  for (const a of week.assignments) {
    if (!roomsByUser.has(a.userId)) roomsByUser.set(a.userId, []);
    roomsByUser.get(a.userId).push(a.roomName);
  }
  await Promise.all([...roomsByUser.entries()].map(([userId, roomNames]) =>
    sendNotification(houseId, {
      title: 'È il tuo turno',
      body: `Questa settimana tocca a te: ${roomNames.join(', ')}.`,
      url: '/',
    }, userId)
  ));
}

router.get('/', async (req, res) => {
  const { houseId } = req.params;
  try {
    await purgeOldWeeks(db, houseId);
    await ensureFutureWeeks(db, houseId);
    res.json(await db.getWeeks(houseId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { houseId } = req.params;
  try {
    const [weeks, users, rooms, rules, rotation, absences] = await Promise.all([
      db.getWeeks(houseId), db.getUsers(houseId),
      db.getRooms(houseId), db.getRules(houseId),
      db.getRotationConfig(houseId), db.getAbsences(houseId),
    ]);
    const nw = computeNextWeek(weeks, users, rooms, rules, rotation, absences);
    if (!nw) return res.status(409).json({ error: 'Il turno successivo esiste già' });
    await db.insertWeek(nw, houseId);
    const allWeeks = await db.getWeeks(houseId);
    const week = allWeeks.find(w => w.id === nw.id) ?? nw;
    notifyAssignedUsers(houseId, week).catch(e => console.error('Notifica nuovo turno fallita:', e.message));
    res.status(201).json(week);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/houses/:houseId/weeks/:weekId/done   body: { userId, roomId, done }
router.patch('/:weekId/done', async (req, res) => {
  const { houseId, weekId } = req.params;
  const { userId, roomId, done } = req.body;
  if (!userId || !roomId || done === undefined)
    return res.status(400).json({ error: 'userId, roomId e done richiesti' });
  try {
    await db.setDone(houseId, weekId, Number(userId), Number(roomId), Boolean(done));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
