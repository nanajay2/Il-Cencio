-- FEAT-06 / US-06.1 — tabella invites: sostituisce house_invite_code /
-- users.invite_code con token opachi, esposti come link+QR (US-06.3).
-- user_id NULL = invito casa (multi-uso fino a scadenza, chiunque lo apre
-- sceglie/crea il proprio slot); user_id valorizzato = invito personale
-- per un coinquilino specifico (uso singolo, si autoconsuma su used_at).
--
-- house_invite_code/users.invite_code NON vengono toccate qui: la
-- rimozione è US-06.5, un passo separato dopo il rollout del nuovo
-- meccanismo.
create table invites (
  token       text primary key,
  house_id    uuid not null references houses(id) on delete cascade,
  user_id     uuid references users(id) on delete cascade,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_by  uuid references users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index invites_house_id_idx on invites(house_id);
