-- ================================================================
-- Migrazione 005 — Scambio turni con consenso reciproco
-- Additiva: eseguire nell'SQL Editor di Supabase dopo la migrazione 004.
-- ================================================================

create table shift_swaps (
  id           serial primary key,
  house_id     text not null references houses(id) on delete cascade,
  week_id      text not null,
  from_user_id int  not null references users(id) on delete cascade,
  from_room_id int  not null references rooms(id) on delete cascade,
  to_user_id   int  not null references users(id) on delete cascade,
  to_room_id   int  not null references rooms(id) on delete cascade,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  foreign key (week_id, house_id) references weeks(id, house_id) on delete cascade
);

alter table shift_swaps
  add constraint shift_swaps_status_check check (status in ('pending','accepted','declined'));

create index shift_swaps_house_status_idx on shift_swaps (house_id, status);
create index shift_swaps_to_user_idx      on shift_swaps (to_user_id, status);

-- L'app non usa Supabase Auth: il backend accede sempre con la anon key.
alter table shift_swaps disable row level security;
