-- Scambio turni: consenti di chiedere la stanza di un coinquilino senza darne
-- una in cambio. from_room_id NULL = chi propone prende la stanza (to_room_id);
-- to_room_id NULL = chi propone cede la stanza (from_room_id). Almeno una delle
-- due deve esserci.
alter table shift_swaps alter column from_room_id drop not null;
alter table shift_swaps add constraint shift_swaps_room_check
  check (from_room_id is not null or to_room_id is not null);
