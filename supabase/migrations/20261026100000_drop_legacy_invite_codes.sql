-- US-06.5 — l'ingresso con il codice casa è stato rimosso (si entra solo con
-- link/QR d'invito, tabella `invites`): le colonne legacy non servono più.
-- Chi resta fuori rientra con il link d'invito personale.
alter table houses drop column if exists house_invite_code;
alter table users  drop column if exists invite_code;
