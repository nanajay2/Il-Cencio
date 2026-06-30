import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db.js';

const router = Router();

// ── Auth / onboarding ─────────────────────────────────────────────
// NOTA: queste route devono stare prima di /:houseId

// Lookup casa dal codice
router.post('/lookup', async (req, res) => {
  const { houseCode } = req.body;
  if (!houseCode) return res.status(400).json({ error: 'houseCode richiesto' });
  try {
    res.json(await db.lookupHouseByCode(houseCode));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Registrazione nuovo utente
router.post('/register', async (req, res) => {
  const { houseCode, name, pin } = req.body;
  if (!houseCode || !name || !pin)
    return res.status(400).json({ error: 'houseCode, name e pin richiesti' });
  if (!/^\d{4}$/.test(pin))
    return res.status(400).json({ error: 'Il PIN deve essere di 4 cifre' });
  try {
    const { houseId } = await db.lookupHouseByCode(houseCode);
    const pinHash = await bcrypt.hash(pin, 10);
    res.status(201).json(await db.registerUser(houseId, name, pinHash));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login (utente già registrato, nuovo dispositivo) — usa userId + pin
router.post('/auth', async (req, res) => {
  const { userId, pin } = req.body;
  if (!userId || !pin) return res.status(400).json({ error: 'userId e pin richiesti' });
  try {
    const user = await db.getUserById(Number(userId));
    const ok = await bcrypt.compare(pin, user.pinHash ?? '');
    if (!ok) return res.status(401).json({ error: 'PIN non corretto' });
    res.json({
      userId: user.userId, userName: user.userName,
      isAdmin: user.isAdmin, houseId: user.houseId, houseName: user.houseName,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Imposta PIN (utenti legacy senza PIN) — richiede codice casa come verifica identità
router.post('/set-pin', async (req, res) => {
  const { userId, houseCode, pin } = req.body;
  if (!userId || !houseCode || !pin) return res.status(400).json({ error: 'userId, houseCode e pin richiesti' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN deve essere 4 cifre' });
  try {
    // Verifica che l'utente appartenga alla casa con quel codice
    const house = await db.lookupHouseByCode(houseCode);
    const users = await db.getUsers(house.houseId);
    if (!users.find(u => u.id === Number(userId))) {
      return res.status(403).json({ error: 'Codice casa non corretto' });
    }
    const pinHash = await bcrypt.hash(pin, 10);
    await db.setPinHash(Number(userId), pinHash);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ── Casa ─────────────────────────────────────────────────────────

// Crea nuova casa + admin
router.post('/', async (req, res) => {
  const { name, adminName, adminPin } = req.body;
  if (!name || !adminName || !adminPin)
    return res.status(400).json({ error: 'name, adminName e adminPin richiesti' });
  if (!/^\d{4}$/.test(adminPin))
    return res.status(400).json({ error: 'Il PIN deve essere di 4 cifre' });
  try {
    const pinHash = await bcrypt.hash(adminPin, 10);
    res.status(201).json(await db.createHouse(name, adminName, pinHash));
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

// ── Utenti ────────────────────────────────────────────────────────

// Rimuovi utente (admin)
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
