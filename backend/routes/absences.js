import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    res.json(await db.getAbsences(req.params.houseId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { userId, from, to } = req.body;
  if (!userId || !from || !to) return res.status(400).json({ error: 'userId, from, to richiesti' });
  if (from > to) return res.status(400).json({ error: 'from deve essere ≤ to' });
  try {
    res.status(201).json(
      await db.insertAbsence(req.params.houseId, Number(userId), from, to)
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:absenceId', async (req, res) => {
  try {
    await db.deleteAbsence(req.params.houseId, Number(req.params.absenceId));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
