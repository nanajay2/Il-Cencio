import { Router } from 'express';
import { db } from '../lib/db.js';

const router = Router();

// Crea nuova casa + admin
router.post('/', async (req, res) => {
  const { name, adminName, adminEmail } = req.body;
  if (!name || !adminName || !adminEmail)
    return res.status(400).json({ error: 'name, adminName, adminEmail richiesti' });
  try {
    const result = await db.createHouse(name, adminName, adminEmail);
    res.status(201).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dati casa (users, rooms, rules)
router.get('/:houseId', async (req, res) => {
  try {
    res.json(await db.getHouse(req.params.houseId));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Unisciti con codice invito
router.post('/:houseId/join', async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'inviteCode richiesto' });
  try {
    const user = await db.claimUserSlot(inviteCode);
    if (user.houseId !== req.params.houseId)
      return res.status(403).json({ error: 'Codice non valido per questa casa' });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Entra con codice (senza houseId noto — per WelcomeScreen)
router.post('/join', async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'inviteCode richiesto' });
  try {
    res.json(await db.claimUserSlot(inviteCode));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Utenti ────────────────────────────────────────────────────────

// Admin crea slot utente
router.post('/:houseId/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name ed email richiesti' });
  try {
    res.status(201).json(await db.createUserSlot(req.params.houseId, name, email));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rimuovi utente (admin) o esci dalla casa (self)
router.delete('/:houseId/users/:userId', async (req, res) => {
  try {
    await db.deleteUser(req.params.houseId, Number(req.params.userId));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Stanze ───────────────────────────────────────────────────────

router.post('/:houseId/rooms', async (req, res) => {
  const { name, icon, color, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'name richiesto' });
  try {
    res.status(201).json(await db.createRoom(req.params.houseId, { name, icon, color, sortOrder }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:houseId/rooms/:roomId', async (req, res) => {
  try {
    await db.updateRoom(req.params.houseId, Number(req.params.roomId), req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:houseId/rooms/:roomId', async (req, res) => {
  try {
    await db.deleteRoom(req.params.houseId, Number(req.params.roomId));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Regole ───────────────────────────────────────────────────────

router.post('/:houseId/rules', async (req, res) => {
  const { type, config } = req.body;
  if (!type || !config) return res.status(400).json({ error: 'type e config richiesti' });
  try {
    res.status(201).json(await db.createRule(req.params.houseId, type, config));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:houseId/rules/:ruleId', async (req, res) => {
  try {
    await db.deleteRule(req.params.houseId, Number(req.params.ruleId));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
