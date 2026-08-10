import { Router } from 'express';
import { db } from '../lib/db.js';
import { sendNotification } from '../lib/push.js';
import { requireAuth, requireMembership } from '../lib/auth.js';

const router = Router({ mergeParams: true });
router.use(requireAuth, requireMembership);

// URL assoluto del backend, necessario al service worker per chiamare
// l'API accetta/rifiuta direttamente dalla notifica push (in dev, vuoto:
// usa il proxy relativo di Vite verso localhost:3001).
const API_BASE = process.env.PUBLIC_API_URL || '';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

router.get('/', async (req, res) => {
  try {
    res.json(await db.getSwapRequests(req.params.houseId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const { houseId } = req.params;
  const { weekId, fromRoomId, toUserId, toRoomId } = req.body;
  const fromUserId = req.userId; // solo il proprietario del turno può proporlo in scambio
  if (!weekId || !fromRoomId || !toUserId)
    return res.status(400).json({ error: 'weekId, fromRoomId, toUserId richiesti' });
  if (fromUserId === Number(toUserId))
    return res.status(400).json({ error: 'Non puoi proporre uno scambio con te stesso' });

  try {
    const weeks = await db.getWeeks(houseId);
    const week = weeks.find(w => w.id === weekId);
    if (!week) return res.status(404).json({ error: 'Settimana non trovata' });
    if (week.end < todayStr()) return res.status(400).json({ error: 'Non puoi scambiare un turno gia\' passato' });

    // toRoomId assente = trasferimento a senso unico verso un coinquilino
    // senza turni questa settimana: nessuna assegnazione da verificare per lui.
    const checks = [db.getAssignment(houseId, weekId, fromUserId, Number(fromRoomId))];
    if (toRoomId) checks.push(db.getAssignment(houseId, weekId, Number(toUserId), Number(toRoomId)));
    const [fromAsg, toAsg] = await Promise.all(checks);
    if (!fromAsg || (toRoomId && !toAsg))
      return res.status(400).json({ error: 'Una delle due assegnazioni indicate non esiste in questa settimana' });

    const swap = await db.createSwapRequest(houseId, {
      weekId, fromUserId, fromRoomId: Number(fromRoomId),
      toUserId: Number(toUserId), toRoomId: toRoomId ? Number(toRoomId) : null,
    });

    sendNotification(houseId, {
      title: 'Richiesta di scambio turno',
      body: swap.toRoomName
        ? `${swap.fromUserName} ti propone di scambiare ${swap.fromRoomName} con ${swap.toRoomName}.`
        : `${swap.fromUserName} ti propone di darti ${swap.fromRoomName}.`,
      url: `/?swap=${swap.id}`,
      houseId, swapId: swap.id, apiBase: API_BASE,
      actionable: true,
    }, swap.toUserId).catch(e => console.error('Notifica richiesta scambio fallita:', e.message));

    res.status(201).json(swap);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:swapId/accept', async (req, res) => {
  const { houseId, swapId } = req.params;
  try {
    const swap = await db.getSwapById(houseId, Number(swapId));
    if (swap.toUserId !== req.userId)
      return res.status(403).json({ error: 'Solo il destinatario può rispondere a questa richiesta' });
    if (swap.status !== 'pending') return res.status(409).json({ error: 'Richiesta gia\' evasa' });

    const checks = [db.getAssignment(houseId, swap.weekId, swap.fromUserId, swap.fromRoomId)];
    if (swap.toRoomId) checks.push(db.getAssignment(houseId, swap.weekId, swap.toUserId, swap.toRoomId));
    const [fromAsg, toAsg] = await Promise.all(checks);
    if (!fromAsg || (swap.toRoomId && !toAsg)) {
      await db.updateSwapStatus(houseId, swap.id, 'declined');
      return res.status(409).json({ error: 'Le assegnazioni originali non esistono piu\' (impostazioni cambiate nel frattempo)' });
    }

    await db.swapAssignments(houseId, swap.weekId, swap.fromUserId, swap.fromRoomId, swap.toUserId, swap.toRoomId);
    await db.updateSwapStatus(houseId, swap.id, 'accepted');

    sendNotification(houseId, {
      title: 'Scambio turno accettato',
      body: swap.toRoomName
        ? `${swap.toUserName} ha accettato lo scambio: ora fai ${swap.toRoomName} invece di ${swap.fromRoomName}.`
        : `${swap.toUserName} ha accettato: ora ${swap.fromRoomName} tocca a lui/lei.`,
      url: `/?swap=${swap.id}`,
    }, swap.fromUserId).catch(e => console.error('Notifica esito scambio fallita:', e.message));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:swapId/decline', async (req, res) => {
  const { houseId, swapId } = req.params;
  try {
    const swap = await db.getSwapById(houseId, Number(swapId));
    if (swap.toUserId !== req.userId)
      return res.status(403).json({ error: 'Solo il destinatario può rispondere a questa richiesta' });
    if (swap.status !== 'pending') return res.status(409).json({ error: 'Richiesta gia\' evasa' });

    await db.updateSwapStatus(houseId, swap.id, 'declined');

    sendNotification(houseId, {
      title: 'Scambio turno rifiutato',
      body: `${swap.toUserName} ha rifiutato la proposta di scambio.`,
      url: `/?swap=${swap.id}`,
    }, swap.fromUserId).catch(e => console.error('Notifica esito scambio fallita:', e.message));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
