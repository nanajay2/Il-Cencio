import { randomBytes, randomUUID } from 'crypto';
import supabase from './supabase.js';

// ── House ─────────────────────────────────────────────────────────

export async function getHouse(houseId) {
  const { data: house, error: he } = await supabase
    .from('houses').select('*').eq('id', houseId).single();
  if (he) throw he;

  const [users, rooms, rules] = await Promise.all([
    getUsers(houseId), getRooms(houseId), getRules(houseId),
  ]);

  return {
    ...house,
    houseInviteCode: house.house_invite_code,
    rotationType: house.rotation_type,
    rotationDays: house.rotation_days,
    users, rooms, rules,
  };
}

export async function getAllHouseIds() {
  const { data, error } = await supabase.from('houses').select('id');
  if (error) throw error;
  return data.map(h => h.id);
}

export async function getRotationConfig(houseId) {
  const { data, error } = await supabase
    .from('houses').select('rotation_type, rotation_days').eq('id', houseId).single();
  if (error) throw error;
  return { type: data.rotation_type, days: data.rotation_days };
}

export async function updateRotation(houseId, rotationType, rotationDays) {
  const { error } = await supabase
    .from('houses')
    .update({
      rotation_type: rotationType,
      rotation_days: rotationType === 'daily' ? rotationDays : null,
    })
    .eq('id', houseId);
  if (error) throw error;
}

export async function createHouse(name, adminName, authId, email) {
  const id = randomUUID();

  const { error: he } = await supabase
    .from('houses')
    .insert({ id, name, house_invite_code: randomBytes(4).toString('hex').toUpperCase() });
  if (he) throw he;

  const { data: user, error: ue } = await supabase
    .from('users')
    .insert({ house_id: id, name: adminName, is_admin: true, claimed: true, auth_id: authId, email })
    .select().single();
  if (ue) throw ue;

  const { data: house } = await supabase.from('houses').select('house_invite_code').eq('id', id).single();

  return {
    houseId:         id,
    houseName:       name,
    userId:          user.id,
    userName:        user.name,
    isAdmin:         true,
    houseInviteCode: house?.house_invite_code ?? null,
  };
}

export async function getHouseMembers(houseId) {
  const { data: house, error: he } = await supabase
    .from('houses').select('id, name').eq('id', houseId).single();
  if (he || !house) throw new Error('Casa non trovata');

  const { data: users, error: ue } = await supabase
    .from('users').select('id, name, auth_id')
    .eq('house_id', houseId).order('id');
  if (ue) throw ue;

  return {
    houseId:   house.id,
    houseName: house.name,
    // "claimed" qui = collegato a un'identità Supabase (auth_id), non il
    // vecchio flag DB `claimed` (che significava "ha impostato un PIN" e
    // per gli utenti reali migrati da prima di FEAT-01 è già true).
    users: users.map(u => ({ id: u.id, name: u.name, claimed: u.auth_id != null })),
  };
}

export async function lookupHouseByCode(code) {
  const { data, error } = await supabase
    .from('houses')
    .select('id, name, house_invite_code')
    .eq('house_invite_code', code.trim().toUpperCase())
    .single();
  if (error || !data) throw new Error('Codice casa non valido');

  const { data: users, error: ue } = await supabase
    .from('users')
    .select('id, name, auth_id')
    .eq('house_id', data.id)
    .order('id');
  if (ue) throw ue;

  return {
    houseId:   data.id,
    houseName: data.name,
    users: users.map(u => ({ id: u.id, name: u.name, claimed: u.auth_id != null })),
  };
}

// Collega l'identità Supabase autenticata (authId/email) a una riga
// `users` già creata da un admin (createUserSlot) ma non ancora
// rivendicata. Fallisce in modo pulito se lo slot è già stato
// collegato a un'altra identità.
export async function claimUserSlotByAuth(houseId, userId, authId, email) {
  const { data: existing, error: fe } = await supabase
    .from('users').select('id, auth_id')
    .eq('id', userId).eq('house_id', houseId).maybeSingle();
  if (fe) throw fe;
  if (!existing) throw new Error('Utente non trovato in questa casa');
  if (existing.auth_id) throw new Error('Questo coinquilino ha già un account collegato');

  const { data, error } = await supabase
    .from('users')
    .update({ auth_id: authId, email, claimed: true })
    .eq('id', userId)
    .select('*, houses(id, name)').single();
  if (error) throw error;

  return {
    userId: data.id, userName: data.name, userEmail: data.email,
    isAdmin: data.is_admin, houseId: data.house_id, houseName: data.houses.name,
  };
}

// Crea un nuovo coinquilino già collegato all'identità Supabase
// autenticata che lo sta registrando (self-serve join con codice casa).
export async function registerUserWithAuth(houseId, name, authId, email) {
  const { data, error } = await supabase
    .from('users')
    .insert({ house_id: houseId, name: name.trim(), is_admin: false, claimed: true, auth_id: authId, email })
    .select('*, houses(id, name)').single();
  if (error) throw error;

  return {
    userId: data.id, userName: data.name, userEmail: data.email,
    isAdmin: data.is_admin, houseId: data.house_id, houseName: data.houses.name,
  };
}

// ── Inviti (link + QR, FEAT-06) ──────────────────────────────────────

const INVITE_TTL_DAYS = 30;

// userId nullo = invito casa (multi-uso finché non scade); valorizzato =
// invito personale per quel coinquilino (uso singolo, si consuma al claim).
export async function createInvite(houseId, userId, createdByUserId) {
  const token = randomBytes(16).toString('base64url');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from('invites')
    .insert({ token, house_id: houseId, user_id: userId ?? null, expires_at: expiresAt, created_by: createdByUserId });
  if (error) throw error;
  return { token, expiresAt };
}

// Risolve un token in (houseId, houseName, userId?, userName?) senza
// esporre altro. Fallisce in modo pulito su token scaduto/consumato/
// inesistente — messaggio identico nei tre casi per non far trapelare
// quale sia il motivo a chi indovina token a caso.
export async function resolveInvite(token) {
  const { data, error } = await supabase
    .from('invites')
    .select('house_id, user_id, expires_at, used_at, houses(name), users!invites_user_id_fkey(name)')
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  if (!data || new Date(data.expires_at) < new Date() || (data.user_id && data.used_at))
    throw new Error('Invito non valido o scaduto');
  return {
    houseId: data.house_id, houseName: data.houses.name,
    userId: data.user_id, userName: data.users?.name ?? null,
  };
}

export async function consumeInvite(token) {
  const { error } = await supabase.from('invites').update({ used_at: new Date().toISOString() }).eq('token', token);
  if (error) throw error;
}

// Risolve l'appartenenza dell'identità autenticata a UNA casa
// specifica (auth_id non è più unique: la stessa identità può avere
// una riga per ogni casa di cui fa parte — vedi migrazione 009).
export async function getMembership(authId, houseId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, is_admin')
    .eq('auth_id', authId).eq('house_id', houseId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { userId: data.id, userName: data.name, isAdmin: data.is_admin };
}

// Esistenza pura: l'identità è collegata ad almeno una casa? Usata dal
// middleware solo per distinguere "non ancora rivendicato in nessuna
// casa" (409) da "non fa parte di QUESTA casa" (403).
export async function hasAnyMembership(authId) {
  const { data, error } = await supabase
    .from('users').select('id').eq('auth_id', authId).limit(1);
  if (error) throw error;
  return data.length > 0;
}

// Tutte le case a cui l'identità autenticata appartiene — usata dallo
// switcher del frontend (GET /houses/mine) per elencare le case senza
// dover ri-autenticarsi per ognuna.
export async function getHousesForAuth(authId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, is_admin, house_id, houses(id, name)')
    .eq('auth_id', authId);
  if (error) throw error;
  return data.map(u => ({
    userId: u.id, userName: u.name, isAdmin: u.is_admin,
    houseId: u.house_id, houseName: u.houses.name,
  }));
}

// ── Users ─────────────────────────────────────────────────────────

export async function getUsers(houseId) {
  const { data, error } = await supabase
    .from('users').select('id, house_id, name, is_admin, auth_id').eq('house_id', houseId).order('id');
  if (error) throw error;
  return data.map(u => ({
    id: u.id, houseId: u.house_id, name: u.name,
    isAdmin: u.is_admin, claimed: u.auth_id != null,
  }));
}

export async function createUserSlot(houseId, name) {
  const { data, error } = await supabase
    .from('users')
    .insert({ house_id: houseId, name, is_admin: false, claimed: false })
    .select().single();
  if (error) throw error;
  return { id: data.id, name, claimed: false };
}

export async function deleteUser(houseId, userId) {
  const { error } = await supabase
    .from('users').delete().eq('id', userId).eq('house_id', houseId);
  if (error) throw error;
}

// Un utente abbandona volontariamente la casa. Se era l'unico membro, la casa
// viene eliminata (cascade su rooms/rules/weeks/absences). Se era admin, un
// coinquilino rimasto a caso viene promosso prima di rimuoverlo.
export async function leaveHouse(houseId, userId) {
  const { data: users, error: ue } = await supabase
    .from('users').select('id, is_admin').eq('house_id', houseId);
  if (ue) throw ue;

  const leaving = users.find(u => u.id === userId);
  if (!leaving) throw new Error('Utente non trovato in questa casa');

  const remaining = users.filter(u => u.id !== userId);

  if (remaining.length === 0) {
    const { error } = await supabase.from('houses').delete().eq('id', houseId);
    if (error) throw error;
    return { houseDeleted: true };
  }

  if (leaving.is_admin) {
    const promoted = remaining[Math.floor(Math.random() * remaining.length)];
    const { error: pe } = await supabase.from('users').update({ is_admin: true }).eq('id', promoted.id);
    if (pe) throw pe;
  }

  const { error: de } = await supabase
    .from('users').delete().eq('id', userId).eq('house_id', houseId);
  if (de) throw de;

  return { houseDeleted: false };
}

// ── Rooms ─────────────────────────────────────────────────────────

export async function getRooms(houseId) {
  const { data, error } = await supabase
    .from('rooms').select('*').eq('house_id', houseId).order('sort_order');
  if (error) throw error;
  return data.map(r => ({
    id: r.id, houseId: r.house_id, name: r.name,
    icon: r.icon, color: r.color, sortOrder: r.sort_order,
  }));
}

export async function createRoom(houseId, { name, icon, color, sortOrder }) {
  const { data, error } = await supabase
    .from('rooms')
    .insert({ house_id: houseId, name, icon: icon || '🏠', color: color || '#888888', sort_order: sortOrder ?? 99 })
    .select().single();
  if (error) throw error;
  return { id: data.id, name: data.name, icon: data.icon, color: data.color, sortOrder: data.sort_order };
}

export async function updateRoom(houseId, roomId, { name, icon, color, sortOrder }) {
  const patch = {};
  if (name      !== undefined) patch.name       = name;
  if (icon      !== undefined) patch.icon        = icon;
  if (color     !== undefined) patch.color       = color;
  if (sortOrder !== undefined) patch.sort_order  = sortOrder;
  const { error } = await supabase
    .from('rooms').update(patch).eq('id', roomId).eq('house_id', houseId);
  if (error) throw error;
}

export async function deleteRoom(houseId, roomId) {
  const { error } = await supabase
    .from('rooms').delete().eq('id', roomId).eq('house_id', houseId);
  if (error) throw error;
}

// ── Rules ─────────────────────────────────────────────────────────

export async function getRules(houseId) {
  const { data, error } = await supabase
    .from('rules').select('*').eq('house_id', houseId);
  if (error) throw error;
  return data.map(r => ({ id: r.id, type: r.type, config: r.config }));
}

export async function createRule(houseId, type, config) {
  const { data, error } = await supabase
    .from('rules').insert({ house_id: houseId, type, config }).select().single();
  if (error) throw error;
  return { id: data.id, type: data.type, config: data.config };
}

export async function updateRule(houseId, ruleId, { type, config }) {
  const patch = {};
  if (type   !== undefined) patch.type   = type;
  if (config !== undefined) patch.config = config;
  const { error } = await supabase
    .from('rules').update(patch).eq('id', ruleId).eq('house_id', houseId);
  if (error) throw error;
}

export async function deleteRule(houseId, ruleId) {
  const { error } = await supabase
    .from('rules').delete().eq('id', ruleId).eq('house_id', houseId);
  if (error) throw error;
}

// ── Weeks ─────────────────────────────────────────────────────────

export async function getWeeks(houseId) {
  const { data: weeks, error: we } = await supabase
    .from('weeks').select('*').eq('house_id', houseId).order('start_date');
  if (we) throw we;
  if (!weeks.length) return [];

  const { data: asgns, error: ae } = await supabase
    .from('assignments')
    .select('*, users(id, name), rooms(id, name, icon, color)')
    .eq('house_id', houseId)
    .in('week_id', weeks.map(w => w.id));
  if (ae) throw ae;

  return weeks.map(w => ({
    id:    w.id,
    start: w.start_date,
    end:   w.end_date,
    assignments: asgns
      .filter(a => a.week_id === w.id)
      .map(a => ({
        userId:    a.user_id,
        userName:  a.users.name,
        roomId:    a.room_id,
        roomName:  a.rooms.name,
        roomIcon:  a.rooms.icon,
        roomColor: a.rooms.color,
        done:      a.done,
      })),
  }));
}

export async function insertWeek(week, houseId) {
  const { error: we } = await supabase
    .from('weeks').insert({ id: week.id, house_id: houseId, start_date: week.start, end_date: week.end });
  if (we) throw we;

  const rows = week.assignments.map(a => ({
    week_id: week.id, house_id: houseId,
    user_id: a.user_id, room_id: a.room_id, done: a.done ?? false,
  }));
  const { error: ae } = await supabase.from('assignments').insert(rows);
  if (ae) throw ae;
}

export async function deleteWeeksBefore(houseId, cutoffDate) {
  const { error } = await supabase
    .from('weeks').delete().eq('house_id', houseId).lt('end_date', cutoffDate);
  if (error) throw error;
}

// Usata quando le stanze cambiano: le settimane non ancora concluse vanno
// rigenerate da capo, altrimenti restano con assignment orfani/mancanti.
export async function deleteWeeksFrom(houseId, fromDate) {
  const { error } = await supabase
    .from('weeks').delete().eq('house_id', houseId).gte('end_date', fromDate);
  if (error) throw error;
}

export async function setDone(houseId, weekId, userId, roomId, done) {
  const { error } = await supabase
    .from('assignments').update({ done })
    .eq('week_id', weekId).eq('house_id', houseId).eq('user_id', userId).eq('room_id', roomId);
  if (error) throw error;
}

// ── Absences ──────────────────────────────────────────────────────

export async function getAbsences(houseId) {
  const { data, error } = await supabase
    .from('absences')
    .select('*, users(id, name)')
    .eq('house_id', houseId)
    .order('from_date');
  if (error) throw error;
  return data.map(a => ({
    id: a.id, userId: a.user_id, userName: a.users.name,
    from: a.from_date, to: a.to_date,
  }));
}

export async function insertAbsence(houseId, userId, from, to) {
  const { data, error } = await supabase
    .from('absences')
    .insert({ house_id: houseId, user_id: userId, from_date: from, to_date: to })
    .select('*, users(id, name)').single();
  if (error) throw error;
  return { id: data.id, userId: data.user_id, userName: data.users.name, from: data.from_date, to: data.to_date };
}

export async function updateAbsence(houseId, absenceId, { userId, from, to }) {
  const patch = {};
  if (userId !== undefined) patch.user_id   = userId;
  if (from   !== undefined) patch.from_date = from;
  if (to     !== undefined) patch.to_date   = to;
  const { data, error } = await supabase
    .from('absences').update(patch).eq('id', absenceId).eq('house_id', houseId)
    .select('*, users(id, name)').single();
  if (error) throw error;
  return { id: data.id, userId: data.user_id, userName: data.users.name, from: data.from_date, to: data.to_date };
}

export async function deleteAbsence(houseId, absenceId) {
  const { error } = await supabase
    .from('absences').delete().eq('id', absenceId).eq('house_id', houseId);
  if (error) throw error;
}

// Cancella fisicamente le assenze ormai concluse (to_date nel passato): non
// intersecano più nessun turno corrente/futuro, tenerle intasa solo la UI.
export async function deleteExpiredAbsences(cutoffDate) {
  const { data, error } = await supabase
    .from('absences').delete().lt('to_date', cutoffDate).select('id');
  if (error) throw error;
  return data?.length ?? 0;
}

// ── Push subscriptions ───────────────────────────────────────────

export async function getPushSubscriptions(houseId) {
  const { data, error } = await supabase
    .from('push_subscriptions').select('*').eq('house_id', houseId);
  if (error) throw error;
  return data.map(s => ({
    id: s.id, houseId: s.house_id, userId: s.user_id,
    endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth },
  }));
}

export async function savePushSubscription(houseId, userId, { endpoint, keys }) {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { house_id: houseId, user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' }
    );
  if (error) throw error;
}

export async function deletePushSubscription(houseId, endpoint) {
  const { error } = await supabase
    .from('push_subscriptions').delete().eq('house_id', houseId).eq('endpoint', endpoint);
  if (error) throw error;
}

export async function deletePushSubscriptionByEndpoint(endpoint) {
  const { error } = await supabase
    .from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) throw error;
}

// ── Shift swaps ───────────────────────────────────────────────────

function mapSwap(s) {
  return {
    id: s.id, houseId: s.house_id, weekId: s.week_id, status: s.status,
    fromUserId: s.from_user_id, fromUserName: s.from_user.name,
    fromRoomId: s.from_room_id, fromRoomName: s.from_room.name,
    toUserId: s.to_user_id, toUserName: s.to_user.name,
    toRoomId: s.to_room_id, toRoomName: s.to_room?.name ?? null,
    createdAt: s.created_at,
  };
}

const SWAP_SELECT = '*, from_user:users!shift_swaps_from_user_id_fkey(id, name), ' +
  'to_user:users!shift_swaps_to_user_id_fkey(id, name), ' +
  'from_room:rooms!shift_swaps_from_room_id_fkey(id, name), ' +
  'to_room:rooms!shift_swaps_to_room_id_fkey(id, name)';

export async function getSwapRequests(houseId) {
  const { data, error } = await supabase
    .from('shift_swaps').select(SWAP_SELECT).eq('house_id', houseId).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapSwap);
}

export async function getSwapById(houseId, swapId) {
  const { data, error } = await supabase
    .from('shift_swaps').select(SWAP_SELECT).eq('house_id', houseId).eq('id', swapId).single();
  if (error) throw error;
  return mapSwap(data);
}

export async function createSwapRequest(houseId, { weekId, fromUserId, fromRoomId, toUserId, toRoomId }) {
  const { data, error } = await supabase
    .from('shift_swaps')
    .insert({
      house_id: houseId, week_id: weekId,
      from_user_id: fromUserId, from_room_id: fromRoomId,
      to_user_id: toUserId, to_room_id: toRoomId,
    })
    .select('id').single();
  if (error) throw error;
  return getSwapById(houseId, data.id);
}

export async function updateSwapStatus(houseId, swapId, status) {
  const { error } = await supabase
    .from('shift_swaps').update({ status }).eq('id', swapId).eq('house_id', houseId);
  if (error) throw error;
}

export async function getAssignment(houseId, weekId, userId, roomId) {
  const { data, error } = await supabase
    .from('assignments').select('*')
    .eq('house_id', houseId).eq('week_id', weekId).eq('user_id', userId).eq('room_id', roomId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Scambia le stanze assegnate a due utenti nella stessa settimana. Se
// toRoomId e' null, e' un trasferimento a senso unico (il destinatario
// non aveva turni: riceve la stanza senza restituirne una). Il
// completamento (done) non viene portato dietro: la responsabilita' del
// task cambia persona.
export async function swapAssignments(houseId, weekId, fromUserId, fromRoomId, toUserId, toRoomId) {
  const deleteFilter = toRoomId != null
    ? `and(user_id.eq.${fromUserId},room_id.eq.${fromRoomId}),and(user_id.eq.${toUserId},room_id.eq.${toRoomId})`
    : `and(user_id.eq.${fromUserId},room_id.eq.${fromRoomId})`;
  const { error: de } = await supabase
    .from('assignments').delete()
    .eq('house_id', houseId).eq('week_id', weekId)
    .or(deleteFilter);
  if (de) throw de;

  const rows = [{ house_id: houseId, week_id: weekId, user_id: toUserId, room_id: fromRoomId, done: false }];
  if (toRoomId != null) {
    rows.push({ house_id: houseId, week_id: weekId, user_id: fromUserId, room_id: toRoomId, done: false });
  }
  const { error: ie } = await supabase.from('assignments').insert(rows);
  if (ie) throw ie;
}

// ── App meta ──────────────────────────────────────────────────────

export async function getAppMeta(key) {
  const { data, error } = await supabase
    .from('app_meta').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setAppMeta(key, value) {
  const { error } = await supabase
    .from('app_meta').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export const db = {
  getHouse, createHouse, getAllHouseIds, getRotationConfig, updateRotation,
  getHouseMembers, lookupHouseByCode,
  claimUserSlotByAuth, registerUserWithAuth,
  createInvite, resolveInvite, consumeInvite,
  getMembership, hasAnyMembership, getHousesForAuth,
  getUsers, createUserSlot, deleteUser, leaveHouse,
  getRooms, createRoom, updateRoom, deleteRoom,
  getRules, createRule, updateRule, deleteRule,
  getWeeks, insertWeek, deleteWeeksBefore, deleteWeeksFrom, setDone,
  getAbsences, insertAbsence, updateAbsence, deleteAbsence, deleteExpiredAbsences,
  getPushSubscriptions, savePushSubscription, deletePushSubscription, deletePushSubscriptionByEndpoint,
  getSwapRequests, getSwapById, createSwapRequest, updateSwapStatus, getAssignment, swapAssignments,
  getAppMeta, setAppMeta,
};
