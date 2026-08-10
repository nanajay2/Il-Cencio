-- ================================================================
-- Fix — Disattiva la Row Level Security su tutte le tabelle.
--
-- Eseguire nell'SQL Editor di Supabase.
--
-- BUG-01.2 (FEAT-01) — decisione documentata esplicitamente:
-- da FEAT-01 in poi l'app USA Supabase Auth (vedi lib/auth.js), ma il
-- backend continua ad accedere a Supabase con una chiave server-side
-- fidata (non con il token dell'utente finale), perché lo scheduler
-- (lib/scheduler.js) deve poter leggere/scrivere dati dell'intera casa
-- per conto di qualunque utente, non solo del chiamante. Con la RLS
-- attiva e senza policy dedicate alla chiave server-side, ogni query
-- verrebbe bloccata anche sulle tabelle storiche (es. "houses").
--
-- Il vero cancello di autorizzazione è il middleware Express
-- (requireAuth / requireUser / requireHouseMatch / requireAdmin in
-- lib/auth.js), che verifica il JWT e l'appartenenza alla casa PRIMA
-- che qualunque query Supabase venga eseguita. La RLS resta quindi
-- disattivata per scelta, non per svista: potrà essere aggiunta in
-- futuro come difesa in profondità, ma non sostituisce il middleware.
-- ================================================================

alter table houses            disable row level security;
alter table users             disable row level security;
alter table rooms             disable row level security;
alter table rules             disable row level security;
alter table weeks             disable row level security;
alter table assignments       disable row level security;
alter table absences          disable row level security;
alter table push_subscriptions disable row level security;
alter table shift_swaps       disable row level security;
alter table app_meta          disable row level security;
