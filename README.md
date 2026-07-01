
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

## Setup

### Backend

1. Crea un progetto su [Supabase](https://supabase.com)
2. Esegui `backend/supabase_schema_v2.sql` nell'SQL Editor di Supabase (schema multi-casa corrente)
3. Copia `backend/.env` da un template con:
   ```
   SUPABASE_URL=...
   SUPABASE_KEY=...
   PORT=3001
   ```
4. `cd backend && npm install && npm run dev`

### Frontend

1. `cd frontend && npm install && npm run dev`
2. In sviluppo Vite fa da proxy verso `http://localhost:3001` per le chiamate `/api` (vedi `vite.config.js`)
3. In produzione, il frontend è pensato per essere buildato con `npm run build` e servito staticamente (Netlify); il backend va hostato separatamente e la sua URL configurata come base per le chiamate API

### Prima casa

1. Dalla schermata di benvenuto → **+ Crea una nuova casa** → inserisci nome casa, il tuo nome e un PIN a 4 cifre
2. Da ⚙️ Admin, aggiungi le stanze e configura eventuali regole di assegnazione
3. Condividi il **codice invito casa** (visibile nel pannello Admin) con gli altri coinquilini

### Altri coinquilini

Dalla schermata di benvenuto → **Entra** → codice invito casa + registrazione con nome e PIN a 4 cifre.

## Struttura

```
frontend/            React + Vite + Tailwind (UI)
  src/components/     Schermate e pannelli (WelcomeScreen, AdminPanel, ChoreCard, ...)
  src/hooks/          Stato applicativo (useHouse, useWeeks, useAbsences)
backend/              API REST Express
  routes/             houses (case, stanze, regole, utenti), weeks, absences
  lib/scheduler.js    Algoritmo di calcolo turni
  lib/db.js           Accesso a Supabase
  supabase_schema_v2.sql   Schema DB corrente (multi-casa)
netlify.toml          Config deploy frontend
README.md
```
