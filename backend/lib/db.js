import { randomBytes } from 'crypto';
import supabase from './supabase.js';

function inviteCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

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

  return { ...house, users, rooms, rules };
}

export async function createHouse(name, adminName, adminEmail) {
  const id = slugify(name);

  const { error: he } = await supabase.from('houses').insert({ id, name });
  if (he) throw he;

  const { data: user, error: ue } = await supabase
    .from('users')
    .insert({ house_id: id, name: adminName, email: adminEmail, is_admin: true, claimed: true })
    .select().single();
  if (ue) throw ue;

  return {
    houseId:  id,
    houseName: name,
    userId:   user.id,
    userName: user.name,
    isAdmin:  true,
    inviteCode: user.invite_code ?? null,
  };
}

// ── Users ─────────────────────────────────────────────────────────

export async function getUsers(houseId) {
  const { data, error } = await supabase
    .from('users').select('*').eq('house_id', houseId).order('id');
  if (error) throw error;
  return data.map(u => ({
    id: u.id, houseId: u.house_id, name: u.name, email: u.email,
    isAdmin: u.is_admin, inviteCode: u.invite_code, claimed: u.claimed,
  }));
}

export async function createUserSlot(houseId, name, email) {
  const code = inviteCode();
  const { data, error } = await supabase
    .from('users')
    .insert({ house_id: houseId, name, email, is_admin: false, invite_code: code, claimed: false })
    .select().single();
  if (error) throw error;
  return { id: data.id, name, email, inviteCode: code, claimed: false };
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

export async function setDone(houseId, weekId, userId, done) {
  const { error } = await supabase
    .from('assignments').update({ done })
    .eq('week_id', weekId).eq('house_id', houseId).eq('user_id', userId);
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

export async function deleteAbsence(houseId, absenceId) {
  const { error } = await supabase
    .from('absences').delete().eq('id', absenceId).eq('house_id', houseId);
  if (error) throw error;
}

export const db = {
  getHouse, createHouse,
  getUsers, createUserSlot, claimUserSlot, deleteUser,
  getRooms, createRoom, updateRoom, deleteRoom,
  getRules, createRule, deleteRule,
  getWeeks, insertWeek, deleteWeeksBefore, setDone,
  getAbsences, insertAbsence, deleteAbsence,
};
