import { Router } from 'express';
import { db } from '../lib/db.js';
import { invalidateUpcomingWeeks } from '../lib/scheduler.js';
import { requireAuth, requireMembership, requireAdmin } from '../lib/auth.js';

const router = Router();

const protect      = [requireAuth, requireMembership];
const protectAdmin = [...protect, requireAdmin];

// ── Onboarding ───────────────────────────────────────────────────
// NOTA: queste route devono stare prima di /:houseId

// Lookup casa dal codice — pubblico, serve prima ancora di autenticarsi
router.post('/lookup', async (req, res) => {
  const { houseCode } = req.body;
  if (!houseCode) return res.status(400).json({ error: 'houseCode richiesto' });
  try {
    res.json(await db.lookupHouseByCode(houseCode));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Lista membri per device già associato (senza codice invito) — pubblico,
// non espone nulla di sensibile (solo nome e stato "collegato")
router.get('/:houseId/members', async (req, res) => {
  try {
    res.json(await db.getHouseMembers(req.params.houseId));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Collega l'identità Supabase appena autenticata (login/signup fatto lato
// client con l'SDK) a una riga `users` esistente (slot creato da un admin,
// selezionato via userId) o nuova (self-serve join, con name). Un'identità
// può fare /claim per più case diverse (vedi requireMembership); qui si
// blocca solo il doppio-claim sulla STESSA casa.
router.post('/claim', requireAuth, async (req, res) => {
  const { houseCode, userId, name } = req.body;
  if (!houseCode) return res.status(400).json({ error: 'houseCode richiesto' });
  try {
    const { houseId } = await db.lookupHouseByCode(houseCode);

    const already = await db.getMembership(req.authId, houseId);
    if (already) return res.status(409).json({ error: 'Fai già parte di questa casa' });

    const claimed = userId
      ? await db.claimUserSlotByAuth(houseId, Number(userId), req.authId, req.authEmail)
      : await registerNew(houseId, name, req.authId, req.authEmail);

    res.status(201).json(claimed);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

async function registerNew(houseId, name, authId, email) {
  if (!name || !name.trim()) throw new Error('name richiesto per un nuovo coinquilino');
  return db.registerUserWithAuth(houseId, name.trim(), authId, email);
}

// Tutte le case a cui l'identità autenticata appartiene (per lo switcher
// del frontend: un'identità, N case, nessun re-login per passare da una
// all'altra — la selezione è solo un puntatore lato client).
router.get('/mine', requireAuth, async (req, res) => {
  try {
    res.json(await db.getHousesForAuth(req.authId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Casa ─────────────────────────────────────────────────────────

// Crea nuova casa + admin, collegati subito all'identità Supabase
// autenticata. La stessa identità può creare/appartenere a più case.
router.post('/', requireAuth, async (req, res) => {
  const { name, adminName } = req.body;
  if (!name || !adminName)
    return res.status(400).json({ error: 'name e adminName richiesti' });
  try {
    res.status(201).json(await db.createHouse(name, adminName, req.authId, req.authEmail));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dati casa (users, rooms, rules)
router.get('/:houseId', ...protect, async (req, res) => {
  try {
    res.json(await db.getHouse(req.params.houseId));
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// ── Rotazione ────────────────────────────────────────────────────

// Cambia la cadenza dei turni (settimanale/giornaliera personalizzata/mensile).
// Si applica solo in avanti: invalidateUpcomingWeeks cancella i turni da oggi
// in poi così vengono rigenerati con la nuova cadenza; il passato resta invariato.
router.put('/:houseId/rotation', ...protectAdmin, async (req, res) => {
  const { rotationType, rotationDays } = req.body;
  if (!['weekly', 'daily', 'monthly'].includes(rotationType))
    return res.status(400).json({ error: 'rotationType non valido' });
  if (rotationType === 'daily' && !(Number.isInteger(rotationDays) && rotationDays >= 1 && rotationDays <= 30))
    return res.status(400).json({ error: 'rotationDays deve essere un intero tra 1 e 30' });
  try {
    await db.updateRotation(req.params.houseId, rotationType, rotationType === 'daily' ? rotationDays : null);
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Utenti ────────────────────────────────────────────────────────

// Aggiungi coinquilino (slot non attivato; sceglierà il proprio login al
// primo accesso tramite POST /claim)
router.post('/:houseId/users', ...protectAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name richiesto' });
  try {
    const user = await db.createUserSlot(req.params.houseId, name.trim());
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.status(201).json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rimuovi utente (admin)
router.delete('/:houseId/users/:userId', ...protectAdmin, async (req, res) => {
  try {
    await db.deleteUser(req.params.houseId, Number(req.params.userId));
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Un utente (admin o no) abbandona volontariamente la casa — sempre se
// stesso: l'identità arriva dal JWT, non dal body
router.post('/:houseId/leave', ...protect, async (req, res) => {
  try {
    const result = await db.leaveHouse(req.params.houseId, req.userId);
    if (!result.houseDeleted) await invalidateUpcomingWeeks(db, req.params.houseId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Stanze ───────────────────────────────────────────────────────

router.post('/:houseId/rooms', ...protectAdmin, async (req, res) => {
  const { name, icon, color, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'name richiesto' });
  try {
    const room = await db.createRoom(req.params.houseId, { name, icon, color, sortOrder });
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.status(201).json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:houseId/rooms/:roomId', ...protectAdmin, async (req, res) => {
  try {
    await db.updateRoom(req.params.houseId, Number(req.params.roomId), req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:houseId/rooms/:roomId', ...protectAdmin, async (req, res) => {
  try {
    await db.deleteRoom(req.params.houseId, Number(req.params.roomId));
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Regole ───────────────────────────────────────────────────────

router.post('/:houseId/rules', ...protectAdmin, async (req, res) => {
  const { type, config } = req.body;
  if (!type || !config) return res.status(400).json({ error: 'type e config richiesti' });
  try {
    const rule = await db.createRule(req.params.houseId, type, config);
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.status(201).json(rule);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:houseId/rules/:ruleId', ...protectAdmin, async (req, res) => {
  const { type, config } = req.body;
  if (!type || !config) return res.status(400).json({ error: 'type e config richiesti' });
  try {
    await db.updateRule(req.params.houseId, Number(req.params.ruleId), { type, config });
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:houseId/rules/:ruleId', ...protectAdmin, async (req, res) => {
  try {
    await db.deleteRule(req.params.houseId, Number(req.params.ruleId));
    await invalidateUpcomingWeeks(db, req.params.houseId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Push notifications ──────────────────────────────────────────────

router.post('/:houseId/push/subscribe', ...protect, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription?.endpoint || !subscription?.keys)
    return res.status(400).json({ error: 'subscription richiesta' });
  try {
    await db.savePushSubscription(req.params.houseId, req.userId, subscription);
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:houseId/push/subscribe', ...protect, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint richiesto' });
  try {
    await db.deletePushSubscription(req.params.houseId, endpoint);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
