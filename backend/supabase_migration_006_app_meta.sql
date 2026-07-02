-- ================================================================
-- Migrazione 006 — Metadati app (es. ultima versione notificata)
-- Additiva: eseguire nell'SQL Editor di Supabase dopo la migrazione 005.
-- ================================================================

create table app_meta (
  key   text primary key,
  value text not null
);

-- L'app non usa Supabase Auth: il backend accede sempre con la anon key.
alter table app_meta disable row level security;
