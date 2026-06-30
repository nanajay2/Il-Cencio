import supabase from './supabase.js';

function assembleWeek(week, assignments) {
  const asgn = {}, done = {};
  for (const a of assignments) {
    asgn[a.person] = a.chore;
    done[a.person] = a.done;
  }
  return {
    id:          week.id,
    start:       week.start_date,
    end:         week.end_date,
    assignments: asgn,
    done,
  };
}

export async function getWeeks() {
  const { data: weeks, error: we } = await supabase
    .from('weeks').select('*').order('start_date');
  if (we) throw we;

  const { data: asgns, error: ae } = await supabase
    .from('assignments').select('*');
  if (ae) throw ae;

  return weeks.map(w =>
    assembleWeek(w, asgns.filter(a => a.week_id === w.id))
  );
}

export async function insertWeek(week) {
  const { error: we } = await supabase.from('weeks').insert({
    id:         week.id,
    start_date: week.start,
    end_date:   week.end,
  });
  if (we) throw we;

  const rows = Object.entries(week.assignments).map(([person, chore]) => ({
    week_id: week.id,
    person,
    chore,
    done: week.done?.[person] ?? false,
  }));
  const { error: ae } = await supabase.from('assignments').insert(rows);
  if (ae) throw ae;
}

export async function deleteWeeksBefore(cutoffDate) {
  const { error } = await supabase
    .from('weeks')
    .delete()
    .lt('end_date', cutoffDate);
  if (error) throw error;
}

export async function setDone(weekId, person, done) {
  const { error } = await supabase
    .from('assignments')
    .update({ done })
    .eq('week_id', weekId)
    .eq('person', person);
  if (error) throw error;
}

export async function getAbsences() {
  const { data, error } = await supabase
    .from('absences').select('*').order('from_date');
  if (error) throw error;
  return data.map(a => ({ id: a.id, person: a.person, from: a.from_date, to: a.to_date }));
}

export async function insertAbsence({ person, from, to }) {
  const { data, error } = await supabase
    .from('absences')
    .insert({ person, from_date: from, to_date: to })
    .select().single();
  if (error) throw error;
  return { id: data.id, person, from, to };
}

export async function deleteAbsence(id) {
  const { error } = await supabase.from('absences').delete().eq('id', id);
  if (error) throw error;
}

export const db = { getWeeks, insertWeek, deleteWeeksBefore, setDone, getAbsences, insertAbsence, deleteAbsence };
