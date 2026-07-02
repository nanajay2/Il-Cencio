-- ================================================================
-- Migrazione 007 — Scambio turni: consenti proposte a chi non ha turni
-- Additiva: eseguire nell'SQL Editor di Supabase dopo la migrazione 006.
-- to_room_id NULL = trasferimento a senso unico (il destinatario non
-- aveva nessuna stanza questa settimana, quindi non c'e' nulla da
-- restituire in cambio).
-- ================================================================

alter table shift_swaps alter column to_room_id drop not null;
