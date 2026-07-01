-- ================================================================
-- Migrazione 003 — Rotazione turni configurabile + multi-stanza per persona
-- Additiva: eseguire nell'SQL Editor di Supabase dopo lo schema v2.
-- ================================================================

-- ── Rotazione turni per casa ───────────────────────────────────────
alter table houses
  add column if not exists rotation_type text not null default 'weekly',
  add column if not exists rotation_days int;

alter table houses
  add constraint houses_rotation_type_check
    check (rotation_type in ('weekly','daily','monthly'));

alter table houses
  add constraint houses_rotation_days_check
    check (
      rotation_type <> 'daily' or
      (rotation_days is not null and rotation_days between 1 and 30)
    );

-- ── Multi-stanza per persona per turno ─────────────────────────────
-- NOTA: verificare prima il nome reale del vincolo PK su assignments:
--   select conname from pg_constraint where conrelid = 'assignments'::regclass and contype = 'p';
-- Se il nome differisse da 'assignments_pkey', sostituirlo qui sotto.
alter table assignments drop constraint assignments_pkey;
alter table assignments
  add constraint assignments_pkey primary key (week_id, house_id, user_id, room_id);
