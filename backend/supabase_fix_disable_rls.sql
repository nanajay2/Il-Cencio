-- ================================================================
-- Fix — Disattiva la Row Level Security su tutte le tabelle.
-- L'app non usa Supabase Auth: il backend accede sempre con la anon
-- key e gestisce l'autenticazione (PIN) per conto suo. Con la RLS
-- attiva e senza policy, ogni query viene bloccata anche sulle
-- tabelle storiche (es. "houses"), rompendo l'intera app.
-- Eseguire nell'SQL Editor di Supabase.
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
