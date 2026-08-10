-- ================================================================
-- Migrazione 008 — Collega i coinquilini a Supabase Auth
-- Additiva: eseguire nell'SQL Editor di Supabase dopo la migrazione 007.
-- Parte di FEAT-01 (Sessioni e autorizzazione backend): il PIN a 4
-- cifre viene sostituito da Supabase Auth (email+password / Google).
-- auth_id collega la riga "coinquilino" esistente all'identità
-- verificata da Supabase; il middleware Express (lib/auth.js) risolve
-- ogni richiesta autenticata tramite questa colonna.
--
-- pin_hash NON viene toccata da questa migrazione: resta finché il
-- rollout degli utenti reali esistenti (FEAT-05 / US-01.5) non è
-- stato verificato completo, poi verrà rimossa in una migrazione
-- separata.
-- ================================================================

alter table users
  add column auth_id uuid unique references auth.users(id);
