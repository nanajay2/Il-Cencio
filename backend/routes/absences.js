import { Router } from 'express';
import { db } from '../lib/db.js';
import { sendNotificationExcluding } from '../lib/push.js';
import { invalidateUpcomingWeeks } from '../lib/scheduler.js';
import { requireAuth, requireMembership } from '../lib/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireMembership);

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

// L'invalidazione delle settimane future è un effetto collaterale, non
// l'operazione principale: se la scrittura primaria (assenza) è andata a
// buon fine ma invalidateUpcomingWeeks fallisce (rete, permessi), l'utente
// non deve vedere un 500 che lascia credere che l'assenza non sia stata
// salvata quando invece lo è. Il ricalcolo verrà comunque ritentato alla
// prossima chiamata (ensureFutureWeeks in GET /weeks non dipende da questo),
// qui logghiamo soltanto per non perdere visibilità sul fallimento.
async function invalidateBestEffort(houseId) {
  try {
    await invalidateUpcomingWeeks(db, houseId);
  } catch (e) {
    console.error(`Invalidazione settimane fallita per casa ${houseId}:`, e.message);
  }
}

router.post('/', async (req, res) => {
  const { userId, from, to } = req.body;
  if (!userId || !from || !to) return res.status(400).json({ error: 'userId, from, to richiesti' });
  if (from > to) return res.status(400).json({ error: 'from deve essere ≤ to' });
  try {
    const absence = await db.insertAbsence(req.params.houseId, userId, from, to);
    await invalidateBestEffort(req.params.houseId);
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

router.put('/:absenceId', async (req, res) => {
  const { userId, from, to } = req.body;
  if (!userId || !from || !to) return res.status(400).json({ error: 'userId, from, to richiesti' });
  if (from > to) return res.status(400).json({ error: 'from deve essere ≤ to' });
  try {
    const absence = await db.updateAbsence(req.params.houseId, req.params.absenceId, {
      userId, from, to,
    });
    await invalidateBestEffort(req.params.houseId);
    res.json(absence);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:absenceId', async (req, res) => {
  try {
    await db.deleteAbsence(req.params.houseId, req.params.absenceId);
    await invalidateBestEffort(req.params.houseId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
