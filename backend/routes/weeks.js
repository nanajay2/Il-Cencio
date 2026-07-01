import { Router } from 'express';
import { db } from '../lib/db.js';
import { computeNextWeek, ensureFutureWeeks, purgeOldWeeks } from '../lib/scheduler.js';

const router = Router({ mergeParams: true });

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
    const [weeks, users, rooms, rules, rotation] = await Promise.all([
      db.getWeeks(houseId), db.getUsers(houseId),
      db.getRooms(houseId), db.getRules(houseId),
      db.getRotationConfig(houseId),
    ]);
    const nw = computeNextWeek(weeks, users, rooms, rules, rotation);
    if (!nw) return res.status(409).json({ error: 'Il turno successivo esiste già' });
    await db.insertWeek(nw, houseId);
    const allWeeks = await db.getWeeks(houseId);
    res.status(201).json(allWeeks.find(w => w.id === nw.id) ?? nw);
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
