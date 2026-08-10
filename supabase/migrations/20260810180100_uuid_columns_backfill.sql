-- FEAT-03 / US-03.3 — colonne UUID additive + backfill.
-- Non distruttiva: le vecchie PK/FK intere/slug restano intatte finché
-- US-03.5 non le sostituisce, dopo verifica (BUG-03.1 regressione
-- scheduler + US-03.4 remap rules.config).
--
-- gen_random_uuid() come default su ADD COLUMN forza un rewrite della
-- tabella che valorizza ogni riga esistente in un colpo solo (oltre a
-- fissare il default per le righe future) — non serve un UPDATE separato
-- per le colonne *_id_uuid (PK), solo per le FK che puntano al genitore.

-- ── PK id_uuid per ogni tabella in scope ─────────────────────────────
alter table houses             add column if not exists id_uuid uuid not null default gen_random_uuid();
alter table users              add column if not exists id_uuid uuid not null default gen_random_uuid();
alter table rooms              add column if not exists id_uuid uuid not null default gen_random_uuid();
alter table rules              add column if not exists id_uuid uuid not null default gen_random_uuid();
alter table absences           add column if not exists id_uuid uuid not null default gen_random_uuid();
alter table push_subscriptions add column if not exists id_uuid uuid not null default gen_random_uuid();
alter table shift_swaps        add column if not exists id_uuid uuid not null default gen_random_uuid();

alter table houses             add constraint houses_id_uuid_key             unique (id_uuid);
alter table users              add constraint users_id_uuid_key              unique (id_uuid);
alter table rooms              add constraint rooms_id_uuid_key              unique (id_uuid);
alter table rules              add constraint rules_id_uuid_key              unique (id_uuid);
alter table absences           add constraint absences_id_uuid_key           unique (id_uuid);
alter table push_subscriptions add constraint push_subscriptions_id_uuid_key unique (id_uuid);
alter table shift_swaps        add constraint shift_swaps_id_uuid_key        unique (id_uuid);

-- ── FK *_uuid: colonna + backfill via mappa vecchio id -> nuovo uuid ──

-- users.house_id
alter table users add column if not exists house_id_uuid uuid;
update users u set house_id_uuid = h.id_uuid from houses h where h.id = u.house_id;
alter table users alter column house_id_uuid set not null;

-- rooms.house_id
alter table rooms add column if not exists house_id_uuid uuid;
update rooms r set house_id_uuid = h.id_uuid from houses h where h.id = r.house_id;
alter table rooms alter column house_id_uuid set not null;

-- rules.house_id
alter table rules add column if not exists house_id_uuid uuid;
update rules ru set house_id_uuid = h.id_uuid from houses h where h.id = ru.house_id;
alter table rules alter column house_id_uuid set not null;

-- weeks.house_id (weeks.id resta text: data di inizio settimana, esclusa dallo scope)
alter table weeks add column if not exists house_id_uuid uuid;
update weeks w set house_id_uuid = h.id_uuid from houses h where h.id = w.house_id;
alter table weeks alter column house_id_uuid set not null;

-- absences.house_id, absences.user_id
alter table absences add column if not exists house_id_uuid uuid;
alter table absences add column if not exists user_id_uuid uuid;
update absences a set house_id_uuid = h.id_uuid from houses h where h.id = a.house_id;
update absences a set user_id_uuid  = u.id_uuid from users  u where u.id = a.user_id;
alter table absences alter column house_id_uuid set not null;
alter table absences alter column user_id_uuid  set not null;

-- push_subscriptions.house_id, push_subscriptions.user_id
alter table push_subscriptions add column if not exists house_id_uuid uuid;
alter table push_subscriptions add column if not exists user_id_uuid uuid;
update push_subscriptions p set house_id_uuid = h.id_uuid from houses h where h.id = p.house_id;
update push_subscriptions p set user_id_uuid  = u.id_uuid from users  u where u.id = p.user_id;
alter table push_subscriptions alter column house_id_uuid set not null;
alter table push_subscriptions alter column user_id_uuid  set not null;

-- shift_swaps.house_id, from/to_user_id, from/to_room_id (to_room_id nullable, resta nullable)
alter table shift_swaps add column if not exists house_id_uuid uuid;
alter table shift_swaps add column if not exists from_user_id_uuid uuid;
alter table shift_swaps add column if not exists to_user_id_uuid uuid;
alter table shift_swaps add column if not exists from_room_id_uuid uuid;
alter table shift_swaps add column if not exists to_room_id_uuid uuid;
update shift_swaps s set house_id_uuid     = h.id_uuid from houses h where h.id = s.house_id;
update shift_swaps s set from_user_id_uuid = u.id_uuid from users  u where u.id = s.from_user_id;
update shift_swaps s set to_user_id_uuid   = u.id_uuid from users  u where u.id = s.to_user_id;
update shift_swaps s set from_room_id_uuid = r.id_uuid from rooms  r where r.id = s.from_room_id;
update shift_swaps s set to_room_id_uuid   = r.id_uuid from rooms  r where r.id = s.to_room_id and s.to_room_id is not null;
alter table shift_swaps alter column house_id_uuid     set not null;
alter table shift_swaps alter column from_user_id_uuid set not null;
alter table shift_swaps alter column to_user_id_uuid   set not null;
alter table shift_swaps alter column from_room_id_uuid set not null;
-- to_room_id_uuid resta nullable (trasferimento a senso unico, migrazione 007)

-- assignments (no PK propria in scope: week_id/house_id/user_id/room_id sono tutti FK)
alter table assignments add column if not exists house_id_uuid uuid;
alter table assignments add column if not exists user_id_uuid uuid;
alter table assignments add column if not exists room_id_uuid uuid;
update assignments a set house_id_uuid = h.id_uuid from houses h where h.id = a.house_id;
update assignments a set user_id_uuid  = u.id_uuid from users  u where u.id = a.user_id;
update assignments a set room_id_uuid  = r.id_uuid from rooms  r where r.id = a.room_id;
alter table assignments alter column house_id_uuid set not null;
alter table assignments alter column user_id_uuid  set not null;
alter table assignments alter column room_id_uuid  set not null;
