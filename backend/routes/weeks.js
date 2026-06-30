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
    const [weeks, users, rooms, rules] = await Promise.all([
      db.getWeeks(houseId), db.getUsers(houseId),
      db.getRooms(houseId), db.getRules(houseId),
    ]);
    const nw = computeNextWeek(weeks, users, rooms, rules);
    if (!nw) return res.status(409).json({ error: 'La settimana successiva esiste già' });
    await db.insertWeek(nw, houseId);
    const allWeeks = await db.getWeeks(houseId);
    res.status(201).json(allWeeks.find(w => w.id === nw.id) ?? nw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/houses/:houseId/weeks/:weekId/done   body: { userId, done }
router.patch('/:weekId/done', async (req, res) => {
  const { houseId, weekId } = req.params;
  const { userId, done } = req.body;
  if (!userId || done === undefined)
    return res.status(400).json({ error: 'userId e done richiesti' });
  try {
    await db.setDone(houseId, weekId, Number(userId), Boolean(done));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
