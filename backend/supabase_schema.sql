-- Esegui questo script nell'editor SQL di Supabase

create table if not exists weeks (
  id         text primary key,
  start_date date not null,
  end_date   date not null
);

create table if not exists assignments (
  week_id text not null references weeks(id) on delete cascade,
  person  text not null,
  chore   text not null,
  done    boolean not null default false,
  primary key (week_id, person)
);

create table if not exists absences (
  id        serial primary key,
  person    text not null,
  from_date date not null,
  to_date   date not null
);

-- Dati seed (settimane storiche + corrente)
insert into weeks (id, start_date, end_date) values
  ('2026-06-01', '2026-06-01', '2026-06-07'),
  ('2026-06-08', '2026-06-08', '2026-06-14'),
  ('2026-06-15', '2026-06-15', '2026-06-21'),
  ('2026-06-22', '2026-06-22', '2026-06-28'),
  ('2026-06-29', '2026-06-29', '2026-07-05')
on conflict do nothing;

insert into assignments (week_id, person, chore, done) values
  ('2026-06-01', 'Eliana', 'Cucina',     false),
  ('2026-06-01', 'Silvia', 'Bagno 1',    false),
  ('2026-06-01', 'Marco',  'Bagno 2',    false),
  ('2026-06-01', 'Giada',  'Corridoio',  false),
  ('2026-06-01', 'Giulia', 'Spazzatura', false),

  ('2026-06-08', 'Marco',  'Cucina',     false),
  ('2026-06-08', 'Giada',  'Bagno 1',    false),
  ('2026-06-08', 'Giulia', 'Bagno 2',    false),
  ('2026-06-08', 'Eliana', 'Corridoio',  false),
  ('2026-06-08', 'Silvia', 'Spazzatura', false),

  ('2026-06-15', 'Silvia', 'Cucina',     false),
  ('2026-06-15', 'Eliana', 'Bagno 1',    false),
  ('2026-06-15', 'Marco',  'Bagno 2',    false),
  ('2026-06-15', 'Giada',  'Corridoio',  false),
  ('2026-06-15', 'Giulia', 'Spazzatura', false),

  ('2026-06-22', 'Giada',  'Cucina',     false),
  ('2026-06-22', 'Silvia', 'Bagno 1',    false),
  ('2026-06-22', 'Giulia', 'Bagno 2',    false),
  ('2026-06-22', 'Silvia', 'Corridoio',  false),
  ('2026-06-22', 'Marco',  'Spazzatura', false),

  ('2026-06-29', 'Giulia', 'Cucina',     false),
  ('2026-06-29', 'Giada',  'Bagno 1',    false),
  ('2026-06-29', 'Marco',  'Bagno 2',    false),
  ('2026-06-29', 'Giada',  'Corridoio',  false),
  ('2026-06-29', 'Eliana', 'Spazzatura', false)
on conflict do nothing;
