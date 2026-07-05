
# Il Cencio · Turni di Casa — Via Risorgimento

Web app per gestire i turni di pulizia settimanali in una casa condivisa. Ogni casa configura le proprie stanze, i propri coinquilini e le proprie regole di assegnazione; l'algoritmo genera automaticamente il calendario dei turni.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS v4 (`frontend/`) |
| Backend | Node.js + Express (`backend/`) |
| Storage | Supabase (Postgres) |
| Hosting frontend | Netlify (vedi `netlify.toml`) |
| Fonts | Google Fonts — DM Serif Display + Plus Jakarta Sans |

## Features

- **Multi-casa** — ogni casa ha le proprie stanze, coinquilini e regole; nessun dato hardcoded
- **Weekly view** — una settimana alla volta, navigabile con freccia avanti/indietro
- **Per-task cards** — una card per ogni stanza/mansione configurata, con accento colorato personalizzabile
- **Pannello Admin (⚙️)** — gestione completa senza toccare il database:
  - Coinquilini: rimozione, codice invito casa
  - Stanze: creazione/rimozione con nome, icona ed emoji
  - Regole di assegnazione, con form guidato per ogni tipo:
    - 🚿 **Restrizione pool** — solo alcune persone possono fare una certa stanza
    - 🔄 **Sequenza** — chi fa una stanza una settimana fa automaticamente quella collegata la settimana dopo
    - 🚫 **Esclusione** — una persona non farà mai una certa stanza
  - Le stanze rimanenti ruotano per "meno recentemente assegnato"
- **Auto-generazione** — al caricamento l'app genera silenziosamente le prossime settimane mancanti e le salva
- **Ricalcolo automatico** — ogni modifica alle stanze (creazione/rimozione) invalida le settimane non ancora concluse, che vengono rigenerate da capo alla generazione successiva, evitando calendari con assegnazioni mancanti o orfane
- **Done check** — ogni coinquilino può segnare un task come completato; lo stato è condiviso in tempo reale
- **Assenze** — segna un periodo di assenza per una persona; la sua card viene mostrata come assente per quelle settimane
- **Accesso** — registrazione tramite codice invito della casa + PIN a 4 cifre, nessuna email richiesta
- **Versione app** — mostrata in basso nella schermata di benvenuto (letta da `frontend/package.json`)
- **PWA installabile e obbligatoria** — manifest + service worker (`frontend/public/sw.js`); in produzione l'app non è utilizzabile da browser normale, un gate (`InstallGate.jsx`) blocca l'accesso finché non è installata sulla schermata Home (bottone diretto su Chrome/Edge Android e desktop, istruzioni guidate su iOS Safari). In sviluppo (`npm run dev`) il gate è disattivato per comodità
- **Notifiche push** — il permesso viene richiesto automaticamente al primo accesso di ogni utente (solo se non è mai stato deciso prima; in seguito si riattiva/disattiva a mano da ⚙️ Impostazioni). Avvisano di: settimana con i propri turni generata, reminder giornaliero (9:00) per i task non ancora segnati come fatti, turno non completato il giorno dopo la fine settimana, nuova assenza registrata da un coinquilino. Su iOS richiede Safari 16.4+ e l'app installata da schermata Home (le Web Push non funzionano da Safari diretto)
- **Scambio turni** (🔁) — due coinquilini possono scambiarsi una stanza assegnata nella settimana corrente, oppure una persona può darne una direttamente a chi non ha turni quella settimana (trasferimento a senso unico); si applica solo dopo che il destinatario ha accettato, con notifica push a entrambi i passaggi. La notifica di richiesta apre l'app direttamente sulla proposta (deep link `?swap=`), e su Chrome/Edge (Android e desktop) ha i bottoni "Accetta"/"Rifiuta" direttamente sulla notifica, senza aprire l'app — non supportato da Safari iOS, dove resta comunque cliccabile per aprire l'app
- **Notifica nuova versione** — a ogni avvio il backend confronta la versione in `backend/package.json` con l'ultima notificata (tabella `app_meta`); se è cambiata, avvisa tutte le case che è disponibile un aggiornamento
- **Aggiornamento PWA in-place** — il service worker prende il controllo automaticamente a ogni nuova versione (`skipWaiting`/`clients.claim`); l'app rileva il cambio e si ricarica da sola una volta, senza bisogno di eliminare e reinstallare l'icona in home

## Setup

### Backend

1. Crea un progetto su [Supabase](https://supabase.com)
2. Esegui nell'SQL Editor di Supabase, in ordine:
   - `backend/supabase_schema_v2.sql` (schema multi-casa corrente)
   - `backend/supabase_migration_003_rotation.sql` (rotazione turni configurabile)
   - `backend/supabase_migration_004_push_subscriptions.sql` (notifiche push)
   - `backend/supabase_migration_005_shift_swaps.sql` (scambio turni)
   - `backend/supabase_migration_006_app_meta.sql` (metadati app, es. notifica nuova versione)
   - `backend/supabase_migration_007_swap_gift.sql` (scambio turni verso chi non ha turni)
3. Genera una coppia di chiavi VAPID per le notifiche push:
   ```
   cd backend && npx web-push generate-vapid-keys
   ```
4. Copia `backend/.env` da un template con:
   ```
   SUPABASE_URL=...
   SUPABASE_KEY=...
   PORT=3001
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_SUBJECT=mailto:tuo@indirizzo.it
   PUBLIC_API_URL=...   # solo in produzione: URL pubblico del backend (es. Railway),
                        # usato dal service worker per chiamare accetta/rifiuta scambio
                        # direttamente dai bottoni sulla notifica push. Vuoto in sviluppo.
   ```
5. `cd backend && npm install && npm run dev`

In produzione (es. Railway), imposta le stesse variabili d'ambiente (`SUPABASE_URL`, `SUPABASE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) nel pannello del servizio.

### Frontend

1. Copia `frontend/.env` con:
   ```
   VITE_VAPID_PUBLIC_KEY=...   # stessa VAPID_PUBLIC_KEY del backend
   ```
2. `cd frontend && npm install && npm run dev`
3. In sviluppo Vite fa da proxy verso `http://localhost:3001` per le chiamate `/api` (vedi `vite.config.js`)
4. In produzione, il frontend è pensato per essere buildato con `npm run build` e servito staticamente (Netlify, vedi `netlify.toml` — imposta `VITE_VAPID_PUBLIC_KEY` tra le env var di build); il backend va hostato separatamente (es. Railway) e la sua URL configurata come base per le chiamate API

### Prima casa

1. Dalla schermata di benvenuto → **+ Crea una nuova casa** → inserisci nome casa, il tuo nome e un PIN a 4 cifre
2. Da ⚙️ Admin, aggiungi le stanze e configura eventuali regole di assegnazione
3. Condividi il **codice invito casa** (visibile nel pannello Admin) con gli altri coinquilini

### Altri coinquilini

Dalla schermata di benvenuto → **Entra** → codice invito casa + registrazione con nome e PIN a 4 cifre.

## Struttura

```
frontend/            React + Vite + Tailwind (UI)
  public/sw.js         Service worker (cache app shell, push, notificationclick)
  src/components/      Schermate e pannelli (WelcomeScreen, AdminPanel, ChoreCard, ...)
  src/hooks/            Stato applicativo (useHouse, useWeeks, useAbsences, usePush, useBodyScrollLock)
backend/              API REST Express
  routes/             houses (case, stanze, regole, utenti, push), weeks, absences, swaps
  lib/scheduler.js    Algoritmo di calcolo turni
  lib/db.js           Accesso a Supabase
  lib/push.js         Invio notifiche push (web-push)
  lib/reminders.js    Cron giornaliero per i reminder push
  lib/versionNotifier.js Notifica push su nuova versione rilasciata
  supabase_schema_v2.sql                       Schema DB corrente (multi-casa)
  supabase_migration_003_rotation.sql          Rotazione turni configurabile
  supabase_migration_004_push_subscriptions.sql Notifiche push
  supabase_migration_005_shift_swaps.sql       Scambio turni
  supabase_migration_006_app_meta.sql          Metadati app (versione notificata)
netlify.toml          Config deploy frontend
README.md
```
