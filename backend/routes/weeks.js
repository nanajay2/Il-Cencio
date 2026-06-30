import { Router } from 'express';
import { db } from '../lib/db.js';
import { computeNextWeek, ensureFutureWeeks, purgeOldWeeks } from '../lib/scheduler.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await purgeOldWeeks(db);
    await ensureFutureWeeks(db);
    const weeks = await db.getWeeks();
    res.json(weeks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const weeks = await db.getWeeks();
    const nw = computeNextWeek(weeks);
    if (!nw) return res.status(409).json({ error: 'La settimana successiva esiste già' });
    await db.insertWeek(nw);
    res.status(201).json(nw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/weeks/:id/done  body: { person, done }
router.patch('/:id/done', async (req, res) => {
  const { person, done } = req.body;
  if (!person || done === undefined) return res.status(400).json({ error: 'person e done richiesti' });
  try {
    await db.setDone(req.params.id, person, Boolean(done));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
