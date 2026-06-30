/**
 * Migrazione one-time: JSONBin → Supabase
 * Mantiene settimana corrente + future, scarta le passate.
 *
 * Uso:  node backend/migrate-jsonbin.js
 *
 * Richiede in .env:
 *   SUPABASE_URL, SUPABASE_KEY
 *   JSONBIN_MK   (Master Key JSONBin)
 *   JSONBIN_ID   (Bin ID JSONBin)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const MK     = process.env.JSONBIN_MK || '$2a$10$lK7YJ.j9d/xrukvKk73PFuF9hRVod6ldJVvmcvli7nQ.dkgd6.Sde';
const BIN_ID = process.env.JSONBIN_ID || '6a22e58af5f4af5e29be65b0';

const TODAY = new Date().toISOString().split('T')[0];

// ── Configurazione Via Risorgimento ────────────────────────────────
const HOUSE = { id: 'via-risorgimento', name: 'Via Risorgimento' };

const PEOPLE_SEED = [
  { name: 'Giada',  email: 'giada.dt02@gmail.com',          is_admin: true  },
  { name: 'Silvia', email: 'silvia.saladino90@gmail.com',    is_admin: false },
  { name: 'Giulia', email: 'giuliabracchitta2@gmail.com',    is_admin: false },
  { name: 'Eliana', email: 'ely.maria75@gmail.com',          is_admin: false },
  { name: 'Marco',  email: 'marcoskype3@gmail.com',          is_admin: false },
];

const ROOMS_SEED = [
  { name: 'Cucina',     icon: '🍳',  color: '#c97b4b', sort_order: 0 },
  { name: 'Bagno 1',   icon: '🚿',  color: '#5a9e8a', sort_order: 1 },
  { name: 'Bagno 2',   icon: '🛁',  color: '#6a96c4', sort_order: 2 },
  { name: 'Corridoio', icon: '🧹',  color: '#c9a84c', sort_order: 3 },
  { name: 'Spazzatura',icon: '🗑️', color: '#8c9e8a', sort_order: 4 },
];

// ── Helper ────────────────────────────────────────────────────────
function generateInviteCode() {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('').toUpperCase();
}

async function fetchBin() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}?meta=false`, {
    headers: { 'X-Master-Key': MK },
  });
  if (!res.ok) throw new Error(`JSONBin error: ${res.status}`);
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────
async function migrate() {
  console.log('📦 Lettura da JSONBin…');
  const binData = await fetchBin();
  const allWeeks = (binData.weeks || []).sort((a, b) => a.start.localeCompare(b.start));
  const weeksTomigrate = allWeeks.filter(w => w.end >= TODAY);
  console.log(`   Trovate ${allWeeks.length} settimane, migro ${weeksTomigrate.length} (corrente + future)`);

  // 1. Casa
  console.log('\n🏠 Creazione casa…');
  await supabase.from('houses').upsert(HOUSE);

  // 2. Coinquilini
  console.log('👥 Creazione coinquilini…');
  const userRows = PEOPLE_SEED.map(p => ({
    house_id:    HOUSE.id,
    name:        p.name,
    email:       p.email,
    is_admin:    p.is_admin,
    invite_code: generateInviteCode(),
    claimed:     true,
  }));
  const { data: insertedUsers, error: ue } = await supabase
    .from('users').insert(userRows).select();
  if (ue) throw ue;
  const userMap = Object.fromEntries(insertedUsers.map(u => [u.name, u.id]));
  console.log('   Utenti:', Object.keys(userMap).join(', '));

  // 3. Stanze
  console.log('🚿 Creazione stanze…');
  const { data: insertedRooms, error: re } = await supabase
    .from('rooms').insert(ROOMS_SEED.map(r => ({ ...r, house_id: HOUSE.id }))).select();
  if (re) throw re;
  const roomMap = Object.fromEntries(insertedRooms.map(r => [r.name, r.id]));
  console.log('   Stanze:', Object.keys(roomMap).join(', '));

  // 4. Regole
  console.log('📋 Creazione regole…');
  const rules = [
    {
      house_id: HOUSE.id, type: 'pool_restriction',
      config: { room_id: roomMap['Bagno 1'], user_ids: [userMap['Giada'], userMap['Silvia'], userMap['Eliana']] },
    },
    {
      house_id: HOUSE.id, type: 'pool_restriction',
      config: { room_id: roomMap['Bagno 2'], user_ids: [userMap['Marco'], userMap['Giulia']] },
    },
    {
      house_id: HOUSE.id, type: 'sequence',
      config: { from_room_id: roomMap['Cucina'], to_room_id: roomMap['Corridoio'] },
    },
  ];
  const { error: rle } = await supabase.from('rules').insert(rules);
  if (rle) throw rle;
  console.log('   3 regole inserite');

  // 5. Settimane + Assegnazioni
  console.log('\n📅 Migrazione settimane…');
  for (const w of weeksTomigrate) {
    const { error: we } = await supabase.from('weeks').insert({
      id: w.id, house_id: HOUSE.id, start_date: w.start, end_date: w.end,
    });
    if (we) { console.warn(`   ⚠️  Week ${w.id}:`, we.message); continue; }

    const asgRows = Object.entries(w.assignments || {}).map(([personName, choreName]) => ({
      week_id:  w.id,
      house_id: HOUSE.id,
      user_id:  userMap[personName],
      room_id:  roomMap[choreName],
      done:     w.done?.[personName] ?? false,
    })).filter(r => r.user_id && r.room_id);

    const { error: ae } = await supabase.from('assignments').insert(asgRows);
    if (ae) console.warn(`   ⚠️  Assignments ${w.id}:`, ae.message);
    else console.log(`   ✅ ${w.start} – ${w.end}`);
  }

  // 6. Assenze (se presenti)
  const absences = binData.absences || [];
  if (absences.length) {
    console.log(`\n📆 Migrazione ${absences.length} assenze…`);
    const absRows = absences
      .map(a => ({ house_id: HOUSE.id, user_id: userMap[a.person], from_date: a.from, to_date: a.to }))
      .filter(r => r.user_id);
    const { error: abe } = await supabase.from('absences').insert(absRows);
    if (abe) console.warn('   ⚠️ Assenze:', abe.message);
    else console.log('   ✅ Assenze migrate');
  }

  console.log('\n✅ Migrazione completata!');
  console.log('\nCodici invito generati (per i coinquilini che devono fare il primo accesso):');
  insertedUsers.forEach(u => console.log(`   ${u.name}: ${u.invite_code}`));
}

migrate().catch(e => { console.error('❌', e.message, e.cause ?? ''); process.exit(1); });
