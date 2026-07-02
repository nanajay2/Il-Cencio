import { Router } from 'express';
import { db } from '../lib/db.js';
import { sendNotification } from '../lib/push.js';

const router = Router({ mergeParams: true });

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
  const { weekId, fromUserId, fromRoomId, toUserId, toRoomId } = req.body;
  if (!weekId || !fromUserId || !fromRoomId || !toUserId || !toRoomId)
    return res.status(400).json({ error: 'weekId, fromUserId, fromRoomId, toUserId, toRoomId richiesti' });
  if (Number(fromUserId) === Number(toUserId))
    return res.status(400).json({ error: 'Non puoi proporre uno scambio con te stesso' });

  try {
    const weeks = await db.getWeeks(houseId);
    const week = weeks.find(w => w.id === weekId);
    if (!week) return res.status(404).json({ error: 'Settimana non trovata' });
    if (week.end < todayStr()) return res.status(400).json({ error: 'Non puoi scambiare un turno gia\' passato' });

    const [fromAsg, toAsg] = await Promise.all([
      db.getAssignment(houseId, weekId, Number(fromUserId), Number(fromRoomId)),
      db.getAssignment(houseId, weekId, Number(toUserId), Number(toRoomId)),
    ]);
    if (!fromAsg || !toAsg)
      return res.status(400).json({ error: 'Una delle due assegnazioni indicate non esiste in questa settimana' });

    const swap = await db.createSwapRequest(houseId, {
      weekId, fromUserId: Number(fromUserId), fromRoomId: Number(fromRoomId),
      toUserId: Number(toUserId), toRoomId: Number(toRoomId),
    });

    sendNotification(houseId, {
      title: 'Richiesta di scambio turno',
      body: `${swap.fromUserName} ti propone di scambiare ${swap.fromRoomName} con ${swap.toRoomName}.`,
      url: '/',
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
    if (swap.status !== 'pending') return res.status(409).json({ error: 'Richiesta gia\' evasa' });

    const [fromAsg, toAsg] = await Promise.all([
      db.getAssignment(houseId, swap.weekId, swap.fromUserId, swap.fromRoomId),
      db.getAssignment(houseId, swap.weekId, swap.toUserId, swap.toRoomId),
    ]);
    if (!fromAsg || !toAsg) {
      await db.updateSwapStatus(houseId, swap.id, 'declined');
      return res.status(409).json({ error: 'Le assegnazioni originali non esistono piu\' (impostazioni cambiate nel frattempo)' });
    }

    await db.swapAssignments(houseId, swap.weekId, swap.fromUserId, swap.fromRoomId, swap.toUserId, swap.toRoomId);
    await db.updateSwapStatus(houseId, swap.id, 'accepted');

    sendNotification(houseId, {
      title: 'Scambio turno accettato',
      body: `${swap.toUserName} ha accettato lo scambio: ora fai ${swap.toRoomName} invece di ${swap.fromRoomName}.`,
      url: '/',
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
    if (swap.status !== 'pending') return res.status(409).json({ error: 'Richiesta gia\' evasa' });

    await db.updateSwapStatus(houseId, swap.id, 'declined');

    sendNotification(houseId, {
      title: 'Scambio turno rifiutato',
      body: `${swap.toUserName} ha rifiutato la proposta di scambio.`,
      url: '/',
    }, swap.fromUserId).catch(e => console.error('Notifica esito scambio fallita:', e.message));

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
