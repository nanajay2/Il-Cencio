-- ================================================================
-- Migrazione 004 — Notifiche push (subscription Web Push)
-- Additiva: eseguire nell'SQL Editor di Supabase dopo la migrazione 003.
-- ================================================================

create table push_subscriptions (
  id         serial primary key,
  house_id   text not null references houses(id) on delete cascade,
  user_id    int  not null references users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_house_user_idx on push_subscriptions (house_id, user_id);

-- L'app non usa Supabase Auth: il backend accede sempre con la anon key.
alter table push_subscriptions disable row level security;
