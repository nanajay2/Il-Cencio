-- BUG-01.2 (nota difesa in profondità) — accende RLS su tutte le tabelle
-- app, senza policy. Funziona SOLO se il backend usa la service_role key
-- (bypassa RLS) invece della anon key — altrimenti blocca tutto, come
-- successe la prima volta (vedi supabase_fix_disable_rls.sql).
--
-- Effetto: il backend (service_role) continua a funzionare esattamente
-- come prima; qualunque query diretta con la anon key (es. dal bundle
-- frontend, pubblico per design) su queste tabelle ora fallisce, forzando
-- il passaggio dal middleware Express — quello resta il vero cancello di
-- autorizzazione, RLS qui è solo un livello in più.
alter table houses             enable row level security;
alter table users              enable row level security;
alter table rooms              enable row level security;
alter table rules              enable row level security;
alter table weeks              enable row level security;
alter table assignments        enable row level security;
alter table absences           enable row level security;
alter table push_subscriptions enable row level security;
alter table shift_swaps        enable row level security;
alter table app_meta           enable row level security;
alter table invites            enable row level security;
