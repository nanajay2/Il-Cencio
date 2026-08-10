-- Fix: FEAT-01 (createHouse/claimUserSlotByAuth/registerUserWithAuth in
-- backend/lib/db.js) scrive users.email, ma la colonna non esiste sul
-- DB reale (drift: supabase_schema_v2.sql committato la dichiara `not
-- null`, il DB live non ce l'ha mai avuta). Additiva, nullable — gli
-- slot creati da admin (createUserSlot) restano senza email finché non
-- vengono rivendicati.
alter table users add column if not exists email text;
