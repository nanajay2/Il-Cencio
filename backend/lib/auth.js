import supabase from './supabase.js';
import { db } from './db.js';

// Verifica l'header Authorization: Bearer <token> con Supabase Auth.
// Nessuna verifica di appartenenza qui: serve anche alle route di
// onboarding (/claim, creazione casa, /mine) dove l'identità è
// verificata ma la casa non è ancora nota o non è nell'URL.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token di autenticazione mancante' });
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
    req.authId = data.user.id;
    req.authEmail = data.user.email;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}

// Risolve l'appartenenza dell'identità autenticata alla casa richiesta
// nell'URL e allega userId/isAdmin alla request. Va usato dopo
// requireAuth. Un'identità Supabase può essere collegata a più case
// (auth_id NON è unique da FEAT-02/US-02.5 in poi): l'appartenenza va
// sempre risolta per la coppia (auth_id, houseId), mai per auth_id da
// solo — altrimenti si tornerebbe al bug della Fase 1 pre-migrazione
// 009 in cui una sola casa per identità era imposta dal DB.
//
// Distingue due casi di "non trovato":
//  - l'identità non è collegata a NESSUNA casa  -> 409 NOT_CLAIMED
//    (serve un primo /claim, non ha ancora fatto nessun onboarding)
//  - l'identità è collegata ad altre case ma non a questa -> 403
//    (IDOR cross-house: sta chiedendo dati di una casa che non è sua)
export async function requireMembership(req, res, next) {
  const houseId = req.params.houseId;
  try {
    const membership = await db.getMembership(req.authId, houseId);
    if (membership) {
      req.userId = membership.userId;
      req.houseId = houseId;
      req.isAdmin = membership.isAdmin;
      return next();
    }
    const hasAnyMembership = await db.hasAnyMembership(req.authId);
    if (!hasAnyMembership) {
      return res.status(409).json({
        error: 'Account non ancora collegato a nessuna casa',
        code: 'NOT_CLAIMED',
      });
    }
    return res.status(403).json({ error: 'Non fai parte di questa casa' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Solo l'admin della casa può procedere.
export function requireAdmin(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Azione riservata agli amministratori della casa' });
  }
  next();
}
