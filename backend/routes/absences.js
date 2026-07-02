import { Router } from 'express';
import { db } from '../lib/db.js';
import { sendNotificationExcluding } from '../lib/push.js';

const router = Router({ mergeParams: true });

const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
function fmt(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${+d} ${MONTHS[+m - 1]}`;
}

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
    const absence = await db.insertAbsence(req.params.houseId, Number(userId), from, to);
    sendNotificationExcluding(req.params.houseId, {
      title: 'Nuova assenza',
      body: `${absence.userName} sarà assente dal ${fmt(from)} al ${fmt(to)}.`,
      url: '/',
    }, absence.userId).catch(e => console.error('Notifica assenza fallita:', e.message));
    res.status(201).json(absence);
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
