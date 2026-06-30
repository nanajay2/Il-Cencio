import supabase from './supabase.js';
import { sendReminderEmail } from './email.js';

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

export async function sendWeeklyReminders() {
  const today        = new Date().toISOString().split('T')[0]; // lunedì
  const prevWeekEnd  = addDays(today, -1);  // domenica scorsa
  const prevWeekStart = addDays(today, -7); // lunedì scorso

  console.log(`📧 Reminder: cerco settimana ${prevWeekStart} – ${prevWeekEnd}`);

  const { data: weeks, error: we } = await supabase
    .from('weeks')
    .select('id')
    .gte('start_date', prevWeekStart)
    .lte('end_date', prevWeekEnd);

  if (we || !weeks?.length) {
    console.log('📧 Nessuna settimana trovata, skip.');
    return;
  }

  const { data: assignments, error: ae } = await supabase
    .from('assignments')
    .select('*, users(id, name, email), rooms(id, name, icon), weeks(start_date, end_date)')
    .in('week_id', weeks.map(w => w.id))
    .eq('done', false);

  if (ae || !assignments?.length) {
    console.log('📧 Tutti i turni completati, nessun reminder.');
    return;
  }

  console.log(`📧 Invio ${assignments.length} reminder…`);

  for (const a of assignments) {
    if (!a.users?.email) continue;
    try {
      await sendReminderEmail({
        to:        a.users.email,
        name:      a.users.name,
        roomIcon:  a.rooms.icon,
        roomName:  a.rooms.name,
        weekStart: a.weeks.start_date,
        weekEnd:   a.weeks.end_date,
      });
      console.log(`  ✅ ${a.users.name} <${a.users.email}>`);
    } catch (e) {
      console.error(`  ❌ ${a.users.email}: ${e.message}`);
    }
  }
}
