-- ================================================================
-- Schema v2 — Multi-casa configurabile
-- Esegui nell'SQL Editor di Supabase (sostituisce lo schema v1)
-- ================================================================

drop table if exists assignments cascade;
drop table if exists absences    cascade;
drop table if exists weeks       cascade;
drop table if exists rules       cascade;
drop table if exists rooms       cascade;
drop table if exists users       cascade;
drop table if exists houses      cascade;

-- ── Case ─────────────────────────────────────────────────────────
create table houses (
  id   text primary key,  -- slug leggibile, es. 'il-cencio'
  name text not null
);

-- ── Coinquilini ───────────────────────────────────────────────────
create table users (
  id          serial primary key,
  house_id    text    not null references houses(id) on delete cascade,
  name        text    not null,
  email       text    not null,
  is_admin    boolean not null default false,
  invite_code text    unique,          -- 8 char HEX, NULL per admin creato inline
  claimed     boolean not null default false
);

-- ── Stanze (turni configurabili per casa) ────────────────────────
create table rooms (
  id         serial primary key,
  house_id   text    not null references houses(id) on delete cascade,
  name       text    not null,
  icon       text    not null default '🏠',
  color      text    not null default '#888888',
  sort_order int     not null default 0
);

-- ── Regole di assegnazione ────────────────────────────────────────
create table rules (
  id       serial primary key,
  house_id text    not null references houses(id) on delete cascade,
  type     text    not null check (type in ('pool_restriction','sequence','exclusion')),
  config   jsonb   not null
  -- pool_restriction : { "room_id": 1, "user_ids": [1,2,3] }
  -- sequence         : { "from_room_id": 1, "to_room_id": 4 }
  -- exclusion        : { "room_id": 5, "user_id": 3 }
);

-- ── Settimane ─────────────────────────────────────────────────────
create table weeks (
  id         text  not null,
  house_id   text  not null references houses(id) on delete cascade,
  start_date date  not null,
  end_date   date  not null,
  primary key (id, house_id)
);

-- ── Assegnazioni ──────────────────────────────────────────────────
create table assignments (
  week_id  text not null,
  house_id text not null,
  user_id  int  not null references users(id) on delete cascade,
  room_id  int  not null references rooms(id) on delete cascade,
  done     boolean not null default false,
  primary key (week_id, house_id, user_id),
  foreign key (week_id, house_id) references weeks(id, house_id) on delete cascade
);

-- ── Assenze ───────────────────────────────────────────────────────
create table absences (
  id        serial primary key,
  house_id  text not null references houses(id) on delete cascade,
  user_id   int  not null references users(id) on delete cascade,
  from_date date not null,
  to_date   date not null
);
