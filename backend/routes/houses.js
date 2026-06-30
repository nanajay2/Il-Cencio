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
  const { houseCode, name, email, pin } = req.body;
  if (!houseCode || !name || !email || !pin)
    return res.status(400).json({ error: 'houseCode, name, email e pin richiesti' });
  if (!/^\d{4}$/.test(pin))
    return res.status(400).json({ error: 'Il PIN deve essere di 4 cifre' });
  try {
    const { houseId } = await db.lookupHouseByCode(houseCode);
    const pinHash = await bcrypt.hash(pin, 10);
    res.status(201).json(await db.registerUser(houseId, name, email, pinHash));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Login (utente già registrato, nuovo dispositivo)
router.post('/auth', async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin) return res.status(400).json({ error: 'email e pin richiesti' });
  try {
    const user = await db.getUserByEmail(email);
    if (!user.pinHash) {
      // Utente legacy senza PIN: restituisce dati per far settare il PIN
      return res.json({
        needsPin: true,
        userId: user.userId, userName: user.userName,
        isAdmin: user.isAdmin, houseId: user.houseId, houseName: user.houseName,
      });
    }
    const ok = await bcrypt.compare(pin, user.pinHash);
    if (!ok) return res.status(401).json({ error: 'PIN non corretto' });
    res.json({
      userId: user.userId, userName: user.userName,
      isAdmin: user.isAdmin, houseId: user.houseId, houseName: user.houseName,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Imposta PIN (utenti legacy senza PIN)
router.post('/set-pin', async (req, res) => {
  const { userId, pin } = req.body;
  if (!userId || !pin) return res.status(400).json({ error: 'userId e pin richiesti' });
  if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'PIN deve essere 4 cifre' });
  try {
    const pinHash = await bcrypt.hash(pin, 10);
    await db.setPinHash(userId, pinHash);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Casa ─────────────────────────────────────────────────────────

// Crea nuova casa + admin
router.post('/', async (req, res) => {
  const { name, adminName, adminEmail, adminPin } = req.body;
  if (!name || !adminName || !adminEmail || !adminPin)
    return res.status(400).json({ error: 'name, adminName, adminEmail e adminPin richiesti' });
  if (!/^\d{4}$/.test(adminPin))
    return res.status(400).json({ error: 'Il PIN deve essere di 4 cifre' });
  try {
    const pinHash = await bcrypt.hash(adminPin, 10);
    res.status(201).json(await db.createHouse(name, adminName, adminEmail, pinHash));
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
