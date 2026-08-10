-- ================================================================
-- Migrazione 009 — Vera multi-casa per identità Supabase
-- Additiva/non distruttiva: eseguire nell'SQL Editor di Supabase
-- dopo la migrazione 008.
--
-- La migrazione 008 aveva reso auth_id UNIQUE, il che limitava ogni
-- identità Supabase a UN SOLO coinquilino/casa in tutto il sistema.
-- US-02.5 (FEAT-02) richiede invece che una persona con una sola
-- identità possa appartenere a più case (switch senza re-login).
--
-- Qui rimuoviamo solo il vincolo di unicità (non la colonna, non il
-- riferimento a auth.users(id)): auth_id resta un UUID collegato a
-- Supabase Auth, ma la stessa identità può ora comparire su più righe
-- `users` (una per casa). L'appartenenza a una casa specifica viene
-- risolta dal backend con (auth_id, house_id), non più da auth_id da
-- solo — vedi lib/auth.js:requireMembership.
-- ================================================================

alter table users drop constraint if exists users_auth_id_key;

-- Sostituisce l'indice implicito dell'unique (appena rimosso) con uno
-- esplicito non-unique: auth_id resta cercato ad ogni richiesta
-- autenticata (via requireMembership / GET /houses/mine).
create index if not exists users_auth_id_idx on users(auth_id);
