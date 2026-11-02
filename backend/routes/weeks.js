import { Router } from 'express';
import { db } from '../lib/db.js';
import { computeNextWeek, ensureFutureWeeks, purgeOldWeeks } from '../lib/scheduler.js';
import { requireAuth, requireMembership } from '../lib/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireMembership);

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
    // Nessuna notifica qui: i turni si generano anche in anticipo. L'avviso di
    // nuovo turno parte dal cron (reminders.js), il primo giorno del turno.
    res.status(201).json(allWeeks.find(w => w.id === nw.id) ?? nw);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/houses/:houseId/weeks/:weekId/done   body: { roomId, done }
// L'utente può segnare come fatto/non fatto solo il proprio turno: l'identità
// arriva dal JWT (req.userId), non più dal body.
router.patch('/:weekId/done', async (req, res) => {
  const { houseId, weekId } = req.params;
  const { roomId, done } = req.body;
  if (!roomId || done === undefined)
    return res.status(400).json({ error: 'roomId e done richiesti' });
  try {
    await db.setDone(houseId, weekId, req.userId, roomId, Boolean(done));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
