import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await db.getAbsences());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { person, from, to } = req.body;
  if (!person || !from || !to) return res.status(400).json({ error: 'person, from, to richiesti' });
  if (from > to) return res.status(400).json({ error: 'from deve essere ≤ to' });
  try {
    const absence = await db.insertAbsence({ person, from, to });
    res.status(201).json(absence);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.deleteAbsence(Number(req.params.id));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
