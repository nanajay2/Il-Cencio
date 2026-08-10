-- FEAT-03 / US-03.4 — rimappa gli id interi incorporati in rules.config
-- (nessun vincolo FK, lib/scheduler.js li legge come numeri grezzi) sui
-- nuovi UUID di rooms/users. Additiva: scrive in config_uuid, non tocca
-- ancora config — il rename/drop avviene in US-03.5 dopo verifica.

alter table rules add column if not exists config_uuid jsonb;

update rules
set config_uuid = case type
  when 'pool_restriction' then jsonb_build_object(
    'room_id', (select id_uuid from rooms where id = (config->>'room_id')::int),
    'user_ids', (
      select jsonb_agg(u.id_uuid)
      from jsonb_array_elements_text(config->'user_ids') as elem(user_id)
      join users u on u.id = elem.user_id::int
    )
  )
  when 'sequence' then jsonb_build_object(
    'from_room_id', (select id_uuid from rooms where id = (config->>'from_room_id')::int),
    'to_room_id',   (select id_uuid from rooms where id = (config->>'to_room_id')::int)
  )
  when 'exclusion' then jsonb_build_object(
    'room_id', (select id_uuid from rooms where id = (config->>'room_id')::int),
    'user_id', (select id_uuid from users where id = (config->>'user_id')::int)
  )
end;

alter table rules alter column config_uuid set not null;
