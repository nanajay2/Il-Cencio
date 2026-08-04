import { randomBytes } from 'crypto';
import supabase from './supabase.js';

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

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

export async function createHouse(name, adminName, pinHash) {
  const id = slugify(name);

  const { error: he } = await supabase
    .from('houses')
    .insert({ id, name, house_invite_code: randomBytes(4).toString('hex').toUpperCase() });
  if (he) throw he;

  const { data: user, error: ue } = await supabase
    .from('users')
    .insert({ house_id: id, name: adminName, is_admin: true, claimed: true, pin_hash: pinHash })
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
    .from('users').select('id, name, pin_hash')
    .eq('house_id', houseId).order('id');
  if (ue) throw ue;

  return {
    houseId:   house.id,
    houseName: house.name,
    users: users.map(u => ({ id: u.id, name: u.name, hasPin: !!u.pin_hash })),
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
    .select('id, name, pin_hash')
    .eq('house_id', data.id)
    .order('id');
  if (ue) throw ue;

  return {
    houseId:   data.id,
    houseName: data.name,
    users: users.map(u => ({ id: u.id, name: u.name, hasPin: !!u.pin_hash })),
  };
}

export async function registerUser(houseId, name, pinHash) {
  const { data, error } = await supabase
    .from('users')
    .insert({ house_id: houseId, name: name.trim(), is_admin: false, claimed: true, pin_hash: pinHash })
    .select('*, houses(id, name)').single();
  if (error) throw error;

  return {
    userId: data.id, userName: data.name,
    isAdmin: data.is_admin, houseId: data.house_id, houseName: data.houses.name,
  };
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, is_admin, claimed, pin_hash, house_id, houses(id, name)')
    .eq('id', userId)
    .eq('claimed', true)
    .single();
  if (error || !data) throw new Error('Utente non trovato');
  return {
    userId: data.id, userName: data.name,
    isAdmin: data.is_admin, houseId: data.house_id, houseName: data.houses.name,
    pinHash: data.pin_hash,
  };
}

export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*, houses(id, name)')
    .eq('email', email.toLowerCase().trim())
    .eq('claimed', true)
    .maybeSingle();
  if (error || !data) throw new Error('Utente non trovato');
  return {
    userId: data.id, userName: data.name, userEmail: data.email,
    isAdmin: data.is_admin, houseId: data.house_id, houseName: data.houses.name,
    pinHash: data.pin_hash,
  };
}

export async function setPinHash(userId, pinHash) {
  const { error } = await supabase.from('users').update({ pin_hash: pinHash, claimed: true }).eq('id', userId);
  if (error) throw error;
}

// ── Users ─────────────────────────────────────────────────────────

export async function getUsers(houseId) {
  const { data, error } = await supabase
    .from('users').select('id, house_id, name, is_admin, claimed, pin_hash').eq('house_id', houseId).order('id');
  if (error) throw error;
  return data.map(u => ({
    id: u.id, houseId: u.house_id, name: u.name,
    isAdmin: u.is_admin, claimed: u.claimed, hasPin: !!u.pin_hash,
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

export async function claimUserSlot(code) {
  const { data, error } = await supabase
    .from('users')
    .update({ claimed: true })
    .eq('invite_code', code.toUpperCase())
    .select('*, houses(id, name)').single();
  if (error || !data) throw new Error('Codice invito non valido');
  return {
    userId:    data.id,
    userName:  data.name,
    userEmail: data.email,
    isAdmin:   data.is_admin,
    houseId:   data.house_id,
    houseName: data.houses.name,
  };
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
  getHouseMembers, lookupHouseByCode, registerUser, getUserById, getUserByEmail, setPinHash,
  getUsers, createUserSlot, claimUserSlot, deleteUser, leaveHouse,
  getRooms, createRoom, updateRoom, deleteRoom,
  getRules, createRule, updateRule, deleteRule,
  getWeeks, insertWeek, deleteWeeksBefore, deleteWeeksFrom, setDone,
  getAbsences, insertAbsence, updateAbsence, deleteAbsence, deleteExpiredAbsences,
  getPushSubscriptions, savePushSubscription, deletePushSubscription, deletePushSubscriptionByEndpoint,
  getSwapRequests, getSwapById, createSwapRequest, updateSwapStatus, getAssignment, swapAssignments,
  getAppMeta, setAppMeta,
};
