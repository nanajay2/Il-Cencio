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

function requestBody(swap) {
  if (!swap.fromRoomName) return `${swap.fromUserName} ti chiede di prendere ${swap.toRoomName} al posto tuo.`;
  if (!swap.toRoomName) return `${swap.fromUserName} ti propone di darti ${swap.fromRoomName}.`;
  return `${swap.fromUserName} ti propone di scambiare ${swap.fromRoomName} con ${swap.toRoomName}.`;
}

function acceptedBody(swap) {
  if (!swap.fromRoomName) return `${swap.toUserName} ha accettato: ora ${swap.toRoomName} tocca a te.`;
  if (!swap.toRoomName) return `${swap.toUserName} ha accettato: ora ${swap.fromRoomName} tocca a lui/lei.`;
  return `${swap.toUserName} ha accettato lo scambio: ora fai ${swap.toRoomName} invece di ${swap.fromRoomName}.`;
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
  if (!weekId || !toUserId || (!fromRoomId && !toRoomId))
    return res.status(400).json({ error: 'weekId, toUserId e almeno una stanza richiesti' });
  if (fromUserId === toUserId)
    return res.status(400).json({ error: 'Non puoi proporre uno scambio con te stesso' });

  try {
    const weeks = await db.getWeeks(houseId);
    const week = weeks.find(w => w.id === weekId);
    if (!week) return res.status(404).json({ error: 'Settimana non trovata' });
    if (week.end < todayStr()) return res.status(400).json({ error: 'Non puoi scambiare un turno gia\' passato' });

    // Una delle due stanze può mancare: senza toRoomId chi propone cede la sua
    // stanza, senza fromRoomId prende quella dell'altro.
    const [fromAsg, toAsg] = await Promise.all([
      fromRoomId ? db.getAssignment(houseId, weekId, fromUserId, fromRoomId) : true,
      toRoomId ? db.getAssignment(houseId, weekId, toUserId, toRoomId) : true,
    ]);
    if (!fromAsg || !toAsg)
      return res.status(400).json({ error: 'Una delle due assegnazioni indicate non esiste in questa settimana' });

    const swap = await db.createSwapRequest(houseId, {
      weekId, fromUserId, fromRoomId: fromRoomId || null,
      toUserId, toRoomId: toRoomId || null,
    });

    sendNotification(houseId, {
      title: 'Richiesta di scambio turno',
      body: requestBody(swap),
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
    const swap = await db.getSwapById(houseId, swapId);
    if (swap.toUserId !== req.userId)
      return res.status(403).json({ error: 'Solo il destinatario può rispondere a questa richiesta' });
    if (swap.status !== 'pending') return res.status(409).json({ error: 'Richiesta gia\' evasa' });

    const [fromAsg, toAsg] = await Promise.all([
      swap.fromRoomId ? db.getAssignment(houseId, swap.weekId, swap.fromUserId, swap.fromRoomId) : true,
      swap.toRoomId ? db.getAssignment(houseId, swap.weekId, swap.toUserId, swap.toRoomId) : true,
    ]);
    if (!fromAsg || !toAsg) {
      await db.updateSwapStatus(houseId, swap.id, 'declined');
      return res.status(409).json({ error: 'Le assegnazioni originali non esistono piu\' (impostazioni cambiate nel frattempo)' });
    }

    await db.swapAssignments(houseId, swap.weekId, swap.fromUserId, swap.fromRoomId, swap.toUserId, swap.toRoomId);
    await db.updateSwapStatus(houseId, swap.id, 'accepted');

    sendNotification(houseId, {
      title: 'Scambio turno accettato',
      body: acceptedBody(swap),
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
    const swap = await db.getSwapById(houseId, swapId);
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
