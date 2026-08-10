-- FEAT-03 / US-03.5 — sostituisce le vecchie PK/FK intere/slug con gli
-- UUID additivi di US-03.3/US-03.4, dopo verifica righe/orfani (fatta)
-- e regressione scheduler (BUG-03.1, passata). Transazione unica: o
-- tutto o niente.
begin;

-- ── 1. drop vecchie FK (bloccano sia i drop PK che i drop colonna) ──
alter table absences           drop constraint absences_house_id_fkey;
alter table absences           drop constraint absences_user_id_fkey;
alter table push_subscriptions drop constraint push_subscriptions_house_id_fkey;
alter table push_subscriptions drop constraint push_subscriptions_user_id_fkey;
alter table rooms              drop constraint rooms_house_id_fkey;
alter table rules              drop constraint rules_house_id_fkey;
alter table shift_swaps        drop constraint shift_swaps_house_id_fkey;
alter table shift_swaps        drop constraint shift_swaps_from_user_id_fkey;
alter table shift_swaps        drop constraint shift_swaps_to_user_id_fkey;
alter table shift_swaps        drop constraint shift_swaps_from_room_id_fkey;
alter table shift_swaps        drop constraint shift_swaps_to_room_id_fkey;
alter table shift_swaps        drop constraint shift_swaps_week_id_house_id_fkey;
alter table users              drop constraint users_house_id_fkey;
alter table weeks              drop constraint weeks_house_id_fkey;
alter table assignments        drop constraint assignments_user_id_fkey;
alter table assignments        drop constraint assignments_room_id_fkey;
alter table assignments        drop constraint assignments_week_id_house_id_fkey;

-- ── 2. drop vecchie PK ────────────────────────────────────────────────
alter table houses             drop constraint houses_pkey;
alter table users              drop constraint users_pkey;
alter table rooms              drop constraint rooms_pkey;
alter table rules              drop constraint rules_pkey;
alter table absences           drop constraint absences_pkey;
alter table push_subscriptions drop constraint push_subscriptions_pkey;
alter table shift_swaps        drop constraint shift_swaps_pkey;
alter table weeks              drop constraint weeks_pkey;
alter table assignments        drop constraint assignments_pkey;

-- ── 3. drop i vincoli unique temporanei su *_uuid (ridondanti: la PK
--      che arriva dopo li sostituisce) ─────────────────────────────────
alter table houses             drop constraint houses_id_uuid_key;
alter table users              drop constraint users_id_uuid_key;
alter table rooms              drop constraint rooms_id_uuid_key;
alter table rules              drop constraint rules_id_uuid_key;
alter table absences           drop constraint absences_id_uuid_key;
alter table push_subscriptions drop constraint push_subscriptions_id_uuid_key;
alter table shift_swaps        drop constraint shift_swaps_id_uuid_key;

-- ── 4. drop indici secondari sulle vecchie colonne (ricreati al passo 8) ──
drop index push_subscriptions_house_user_idx;
drop index shift_swaps_house_status_idx;
drop index shift_swaps_to_user_idx;

-- ── 5. drop vecchie colonne intere/slug (e rules.config vecchio) ──────
alter table houses             drop column id;
alter table users              drop column id, drop column house_id;
alter table rooms              drop column id, drop column house_id;
alter table rules              drop column id, drop column house_id, drop column config;
alter table absences           drop column id, drop column house_id, drop column user_id;
alter table push_subscriptions drop column id, drop column house_id, drop column user_id;
alter table shift_swaps        drop column id, drop column house_id,
                                drop column from_user_id, drop column to_user_id,
                                drop column from_room_id, drop column to_room_id;
alter table weeks              drop column house_id;
alter table assignments        drop column house_id, drop column user_id, drop column room_id;

-- ── 6. rename *_uuid -> nomi definitivi ────────────────────────────────
alter table houses             rename column id_uuid to id;
alter table users              rename column id_uuid to id;
alter table users              rename column house_id_uuid to house_id;
alter table rooms              rename column id_uuid to id;
alter table rooms              rename column house_id_uuid to house_id;
alter table rules              rename column id_uuid to id;
alter table rules              rename column house_id_uuid to house_id;
alter table rules              rename column config_uuid to config;
alter table absences           rename column id_uuid to id;
alter table absences           rename column house_id_uuid to house_id;
alter table absences           rename column user_id_uuid to user_id;
alter table push_subscriptions rename column id_uuid to id;
alter table push_subscriptions rename column house_id_uuid to house_id;
alter table push_subscriptions rename column user_id_uuid to user_id;
alter table shift_swaps        rename column id_uuid to id;
alter table shift_swaps        rename column house_id_uuid to house_id;
alter table shift_swaps        rename column from_user_id_uuid to from_user_id;
alter table shift_swaps        rename column to_user_id_uuid to to_user_id;
alter table shift_swaps        rename column from_room_id_uuid to from_room_id;
alter table shift_swaps        rename column to_room_id_uuid to to_room_id;
alter table weeks              rename column house_id_uuid to house_id;
alter table assignments        rename column house_id_uuid to house_id;
alter table assignments        rename column user_id_uuid to user_id;
alter table assignments        rename column room_id_uuid to room_id;

-- ── 7. ricrea PK ────────────────────────────────────────────────────
alter table houses             add primary key (id);
alter table users              add primary key (id);
alter table rooms              add primary key (id);
alter table rules              add primary key (id);
alter table absences           add primary key (id);
alter table push_subscriptions add primary key (id);
alter table shift_swaps        add primary key (id);
alter table weeks              add primary key (id, house_id);
alter table assignments        add primary key (week_id, house_id, user_id, room_id);

-- ── 8. ricrea FK + indici secondari ─────────────────────────────────
alter table users              add constraint users_house_id_fkey              foreign key (house_id) references houses(id) on delete cascade;
alter table rooms              add constraint rooms_house_id_fkey              foreign key (house_id) references houses(id) on delete cascade;
alter table rules              add constraint rules_house_id_fkey              foreign key (house_id) references houses(id) on delete cascade;
alter table weeks              add constraint weeks_house_id_fkey              foreign key (house_id) references houses(id) on delete cascade;
alter table absences           add constraint absences_house_id_fkey          foreign key (house_id) references houses(id) on delete cascade;
alter table absences           add constraint absences_user_id_fkey           foreign key (user_id)  references users(id)  on delete cascade;
alter table push_subscriptions add constraint push_subscriptions_house_id_fkey foreign key (house_id) references houses(id) on delete cascade;
alter table push_subscriptions add constraint push_subscriptions_user_id_fkey  foreign key (user_id)  references users(id)  on delete cascade;
alter table shift_swaps        add constraint shift_swaps_house_id_fkey        foreign key (house_id) references houses(id) on delete cascade;
alter table shift_swaps        add constraint shift_swaps_from_user_id_fkey    foreign key (from_user_id) references users(id) on delete cascade;
alter table shift_swaps        add constraint shift_swaps_to_user_id_fkey      foreign key (to_user_id)   references users(id) on delete cascade;
alter table shift_swaps        add constraint shift_swaps_from_room_id_fkey    foreign key (from_room_id) references rooms(id) on delete cascade;
alter table shift_swaps        add constraint shift_swaps_to_room_id_fkey      foreign key (to_room_id)   references rooms(id) on delete cascade;
alter table shift_swaps        add constraint shift_swaps_week_id_house_id_fkey foreign key (week_id, house_id) references weeks(id, house_id) on delete cascade;
alter table assignments        add constraint assignments_user_id_fkey        foreign key (user_id) references users(id) on delete cascade;
alter table assignments        add constraint assignments_room_id_fkey        foreign key (room_id) references rooms(id) on delete cascade;
alter table assignments        add constraint assignments_week_id_house_id_fkey foreign key (week_id, house_id) references weeks(id, house_id) on delete cascade;

create index push_subscriptions_house_user_idx on push_subscriptions(house_id, user_id);
create index shift_swaps_house_status_idx      on shift_swaps(house_id, status);
create index shift_swaps_to_user_idx           on shift_swaps(to_user_id, status);

commit;
