# Il Cencio — Roadmap ristrutturazione completa

> Consolida le note dell'utente + analisi diretta del codice (2026-08-19). Complementare a `STATO_PROGETTO.md` (stato attuale, §13 rischi multi-device). Ogni punto è verificato nel codice dove possibile — non ipotesi.

---

## 1. Pubblicazione su Play Store

L'app è una PWA. Per pubblicarla su Play Store va impacchettata come **TWA** (Trusted Web Activity, via [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) o [PWABuilder](https://www.pwabuilder.com/)) — non serve riscrivere in nativo.

### 1.1 Requisiti tecnici TWA

| Requisito | Stato attuale | Azione |
|---|---|---|
| HTTPS + manifest valido | ✅ Netlify HTTPS, manifest presente | — |
| `assetlinks.json` (Digital Asset Links, verifica dominio↔package Android) | ❌ non esiste | crearlo, servirlo da `/.well-known/assetlinks.json` |
| Icone corrette in tutte le size richieste (48–512px, adaptive icon Android) | ⚠️ presenti 192/512/maskable, da verificare contro le [linee guida icone Android](https://developer.android.com/distribute/best-practices/launch/icon-design) | audit dedicato |
| `display: standalone` | ✅ già impostato | — |
| Versione/build number allineati Play Console | n/a (nuovo processo) | definire versioning Android separato da `package.json` |

### 1.2 Requisiti di policy (bloccanti, non tecnici-UI)

- **Cancellazione account** (Google Play — *User Data policy*): se l'app permette creazione account, deve offrire un modo per **cancellare account e dati** dall'app stessa (non solo via richiesta email). **Verificato: non esiste.** `leaveHouse` (`backend/lib/db.js:265`) rimuove solo l'appartenenza a UNA casa — l'identità `auth.users` su Supabase resta per sempre, nessuna route chiama `supabase.auth.admin.deleteUser`. **Gap bloccante da colmare prima della submission.**
- **Data Safety form**: va dichiarato cosa si raccoglie — email (Supabase Auth), nome, endpoint push (browser/device token), IP nei log Supabase. Va scritta anche una **privacy policy pubblica** (URL, non esiste ancora nel repo).
- **Developer verification** (nuova policy Android, il link che hai allegato): verifica d'identità dello sviluppatore/organizzazione a livello di account Play Console — non è un problema di codice, è amministrativo (documento identità o D-U-N-S se organizzazione). Da fare per tempo, ha tempi di approvazione non istantanei.
- **Account/dati minori**: se in casa potrebbero esserci minori (coinquilinati studenteschi), verificare se serve dichiarazione età minima nel content rating questionnaire.
- **Permessi richiesti**: solo notifiche push — nessun permesso sensibile aggiuntivo, questionario contenuti dovrebbe essere semplice.

**Priorità**: la cancellazione account è l'unico punto qui che è anche un vero gap architetturale (manca sempre, a prescindere dallo store) — va risolto insieme al refactor auth di §2.

---

## 2. Onboarding: eliminare "Chi sei?" a favore di link personali

**Buona notizia verificata nel codice**: l'infrastruttura per questo esiste già, non è un redesign da zero.

- La tabella `invites` (migrazione `20260810190000_invites_table.sql`) supporta già **due modalità**: `user_id = NULL` → invito casa multi-uso (quello che oggi mostra ancora "Chi sei?"), `user_id` valorizzato → **invito personale**, che salta la lista e va dritto a `confirm-personal` (`frontend/src/components/JoinHouseScreen.jsx:30-42`).
- Il componente `SelectUserModal.jsx` ("Tocca il tuo nome per accedere") è quindi già evitabile: **è mostrato solo quando si usa un invito-casa condiviso**, non quando si usa un invito personale.

### 2.1 Cosa manca davvero

1. **UI admin**: `POST /houses/:houseId/invites` (`backend/routes/houses.js:150`) già accetta un `userId` opzionale per generare invito personale — va verificato/completato il pannello Admin/`CoinquiliniScreen.jsx` per generare **un link personale per coinquilino** (invece del singolo house code condiviso), con QR per condivisione diretta (1:1, via chat personale).
2. **Deprecare il flusso house-code condiviso** lato UI: se ogni coinquilino ha il proprio link, `SelectUserModal`/step `select` di `JoinHouseScreen` diventano dead code da rimuovere, non solo da nascondere.
3. **Rimozione colonne legacy** già segnalata in `STATO_PROGETTO.md §12`: `house_invite_code` / `users.invite_code` — pianificata come US-06.5 ma mai eseguita. Va chiusa: oggi coesistono **due sistemi di invito**, uno dei due (quello vecchio) non scade mai (rischio di sicurezza, vedi `STATO_PROGETTO.md §13.6 riga 4`).

### 2.2 Refactor tabella (la tua nota "alleghiamo il nome utente all'utenza della casa effettiva")

Il modello attuale **già fa questo**: `users` è per-casa (`house_id` + `auth_id`), non c'è un utente "globale" con lista di nomi — ogni riga `users` è "il coinquilino X nella casa Y", collegata a un'identità Supabase via `auth_id`. Il problema che percepisci non è lo schema, è la **UI di collegamento** (house-code + lista nomi invece di link diretto già named). Non serve toccare lo schema DB per questo, serve solo completare il punto 2.1.

---

## 3. Supabase vs Firebase — raccomandazione: **non migrare**

Hai messo un "(?)" — giusto, vale la pena valutarlo con calma prima di agire, è una decisione costosa da invertire.

**Contro la migrazione**:
- Il DB è **relazionale con FK/join profondi** (case→utenti→stanze→regole→turni→assegnazioni→scambi, vedi ER in `STATO_PROGETTO.md §3`) — Firestore è NoSQL, orientato a documenti: `scheduler.js` (join impliciti via query multiple + logica JS) andrebbe riscritto da zero, `swapAssignments`/`insertWeek` (già oggi senza transazioni, §13) diventerebbero **ancora più difficili** da rendere atomici su Firestore senza ridisegnare tutto in sotto-collezioni.
- Perderesti Postgres/SQL, RLS, Supabase Auth già integrato con `auth.users` — tutto da riscrivere (`lib/auth.js`, ogni query in `lib/db.js`).
- È un rewrite totale backend+frontend, settimane di lavoro, per un problema (bug auth visti in test) che è quasi certamente **non un limite della piattaforma**.

**Il bug auth che hai visto**: non l'ho riprodotto (serve il caso specifico), ma è più probabile sia legato a: gestione refresh-token multi-tab, o alla race di claim (`STATO_PROGETTO.md §13.4`, TOCTOU su `claimUserSlotByAuth`), o a stato locale (`localStorage` legacy, `hasLegacySession()` in `App.jsx:59-63`) che confonde il flusso — tutte cose risolvibili **restando su Supabase**.

**Per i log, invece di cambiare piattaforma**:
- Supabase Dashboard → Auth → Logs / Postgres Logs già esistono, spesso sotto-usati.
- Aggiungere **Sentry** (o self-hosted GlitchTip) sia su backend Express che su frontend React — cattura errori auth con stack trace, contesto utente, breadcrumb — copre anche il punto "notifiche in caso di crash" (§7).
- Aggiungere logging strutturato lato backend (§6) con `houseId`/`userId`/`authId` in ogni riga: oggi `console.error` è sparso in ogni route senza contesto (es. `backend/routes/weeks.js`, `absences.js`, `swaps.js` — tutti `console.error(msg, e.message)` senza chi/dove).

Se dopo Sentry+logging strutturato il bug auth persiste ed è riproducibile, allora si valuta un problema specifico (non serve cambiare piattaforma per risolverlo).

---

## 4. UI/UX e palette

Stato attuale (verificato in `frontend/src/index.css`): Tailwind v4 con `@theme` custom — palette marrone/crema (`--color-brown: #BDB395`, `--color-cream: #F6F0F0`, `--color-ink: #4E220F`...), font DM Serif Display + Plus Jakarta Sans. Coerente e già "a sistema" (token centralizzati, non colori sparsi).

**Problema verificato, non percezione**: `frontend/public/manifest.webmanifest` e `frontend/index.html` usano ancora `theme_color`/`background_color: #8A8C5A` — un **verde oliva** che non esiste da nessuna parte nella palette Tailwind attuale (marrone/crema). Questo è quasi certamente parte del "logo vecchio" percepito (vedi §5) — è uno scarto di un tema precedente mai aggiornato quando la palette è cambiata.

**Consigliato**:
1. Audit palette end-to-end: allineare `theme_color`/`background_color` del manifest e `<meta name="theme-color">` in `index.html:11` alla palette Tailwind reale (es. `--color-cream` o `--color-brown`).
2. Revisione UX mirata, non "rifacciamo tutto": la struttura a schermate (`WelcomeScreen` → `LoginScreen` → `ChooseHouseScreen`/`JoinHouseScreen` → app) è già lineare; i punti deboli concreti trovati finora sono l'onboarding (§2) e la coerenza tema (qui), non l'impianto generale.
3. Contrast check accessibilità (WCAG AA) sulla palette attuale, specialmente `--color-ink-2` su `--color-cream` — da verificare con uno strumento (es. axe DevTools), non a occhio.

---

## 5. Bug: "il logo in apertura è sempre quello vecchio"

Due cause distinte, verificate, **non mutuamente esclusive**:

1. **Mismatch colori manifest** (§4): lo splash screen che Android/iOS mostrano all'avvio da home screen è generato da `background_color`/`theme_color` del manifest — oggi verde oliva `#8A8C5A`, non la palette crema/marrone attuale. Se l'icona "sembra vecchia" per via dello sfondo/contrasto, questa è la causa diretta e va corretta subito (fix a costo zero, un valore da cambiare).
2. **Limite strutturale delle PWA, non un bug applicativo**: una volta installata su home screen, **Android e iOS cristallizzano l'icona al momento dell'installazione** — cambiare `icon-192.png`/`icon-512.png`/`icon.svg` nel repo e fare deploy **non aggiorna l'icona di chi ha già installato l'app**. Serve disinstallare e reinstallare. Questo NON è risolvibile lato codice; se l'obiettivo è "tutti vedono sempre l'icona più recente", l'unica strada reale è: (a) documentarlo come limite noto, con istruzioni "reinstalla per aggiornare l'icona", oppure (b) pubblicare su Play Store (§1) dove gli aggiornamenti icona passano da un canale diverso (aggiornamento app, non PWA install cache).

Nota tecnica: il service worker (`frontend/public/sw.js`) **non ha alcuna cache app-shell** (verificato: nessun `caches.open`/`caches.match` nel file, solo gestione `push`/`notificationclick`/`skipWaiting`) — quindi la staleness **non** è colpa della cache del service worker (spesso il primo sospettato in questi casi), è proprio la cache d'icona a livello OS.

---

## 6. Logging strutturato ("event message parlanti")

Oggi: `console.log`/`console.error` sparsi, senza formato comune, senza contesto (`houseId`, `userId`, `route`, `requestId`). Esempi verificati: `backend/index.js:24` (`console.error('Controllo nuova versione fallito:', e.message)`), ogni `catch` in `routes/*.js` fa `res.status(500).json({ error: e.message })` senza loggare lato server in molti casi.

**Consigliato**: introdurre `pino` (leggero, JSON strutturato, adatto a Node/Express) con:
- middleware che logga ogni richiesta con `requestId`, `houseId`, `userId` (da `req.authId`/`req.userId` dopo `requireAuth`/`requireMembership`);
- livelli (`info` per eventi di business — "turno generato", "scambio accettato" —, `warn` per race/conflitti gestiti, `error` per eccezioni);
- log "parlanti" = messaggio in linguaggio naturale + campi strutturati accanto (non solo stack trace), es. `log.info({ houseId, weekId, count: assignments.length }, 'Turno generato automaticamente')`.

Questo dà anche visibilità diretta sulle race condition di `STATO_PROGETTO.md §13` (es. loggare ogni conflitto PK su `insertWeek` invece di farlo sparire in un generico 500).

---

## 7. Notifiche in caso di crash

**Consigliato**: **Sentry** (self-hosted GlitchTip se si vuole evitare SaaS a pagamento) integrato su:
- **Backend Express**: cattura eccezioni non gestite, promise rejections, errori 500 — con contesto `houseId`/`userId` come in §6.
- **Frontend React**: error boundary + cattura errori runtime, utile anche per il bug auth "visto sul telefono" (§3) — con session replay se serve riprodurre.
- **Service worker**: cattura errori su `push`/`notificationclick` (oggi silenziosi se falliscono).
- Alert via email/Slack/Discord webhook su errori nuovi o spike di frequenza — risponde direttamente a "un modo per avere notifiche in caso di crash".

Non serve altro stack (es. Firebase Crashlytics) — Sentry copre sia frontend che backend con un solo strumento, senza dover migrare piattaforma dati (§3).

---

## 8. Tailwind — verificato, già a posto

**Risposta diretta**: sì, il frontend usa già Tailwind CSS v4 (`@import "tailwindcss"` in `frontend/src/index.css:1`, `@tailwindcss/vite` in `package.json`, palette a token via `@theme`). Il CSS custom è **72 righe totali**, quasi tutte `@keyframes` per animazioni (non esprimibili in Tailwind puro) — non è CSS "personalizzato che pesa alla lunga", è la parte minima che Tailwind non copre by design. **Nessun rifacimento necessario su questo fronte.**

---

## 9. Bug segnalati dagli utenti

### 9.1 Assegnazioni turni errate in base alle assenze / impossibile aggiungere assenze / turni mai ricalcolati

Tre sintomi, causa radice comune — analisi diretta del codice:

- **Mismatch soglia assenza**: backend esclude una persona dal turno se l'assenza copre più del 75% del periodo (`ABSENCE_EXCLUSION_THRESHOLD`, `backend/lib/scheduler.js:20`); frontend mostra il badge "assente" solo se l'assenza copre il 100% della settimana (`isAbsent`, `frontend/src/hooks/useAbsences.js`). Il commento nel frontend cita una funzione `isFullyAbsent` che non esiste più in `scheduler.js` (rinominata `isAbsentEnoughToExclude`, logica cambiata) — drift tra le due metà mai riallineato. Risultato: il backend esclude una persona dal turno, la UI non mostra perché, l'assegnazione sembra sbagliata.
- **Route non atomica**: `POST /absences` (`backend/routes/absences.js:24-36`) fa `insertAbsence` e poi `invalidateUpcomingWeeks` nello stesso `try`. Se la seconda chiamata fallisce (RLS mal configurata, rete, permessi), l'assenza è già salvata nel DB ma la route risponde 500 — l'utente vede errore, crede che l'inserimento sia fallito, spesso riprova (assenza duplicata) o rinuncia.
- **Frontend a cascata**: `handleAddAbsence` (`frontend/src/App.jsx:321-328`) fa `await addAbsence` e poi `await weeksHook.load`. Se la prima chiamata lancia (per il bug sopra), la seconda non viene mai eseguita — i turni non si ricaricano mai in UI, anche nei rari casi in cui il backend avesse comunque ricalcolato correttamente.
- **Sospetto aggravante da verificare**: `backend/lib/supabase.js` usa una `SUPABASE_KEY` generica senza distinguere anon/service_role nel codice. La RLS è attiva su `weeks`/`assignments`/`absences` (migrazione `20260811100000_enable_rls.sql`) e funziona solo con la chiave `service_role` — se in produzione è configurata per errore la chiave `anon`, ogni scrittura su queste tabelle fallisce silenziosamente sempre, spiegando "turni mai ricalcolati" in modo ancora più diretto. Va controllato il valore reale in `backend/.env` di produzione.

**Fix concordato** → vedi §12 (redesign completo: soglia binaria + decisione utente esplicita, scrittura atomica via RPC).

### 9.2 Pagina mensile bloccata

`useAggregateView` (`frontend/src/hooks/useAggregateView.js`) chiama `ensureThrough` a ogni cambio mese; se una chiamata precedente è già in corso (`navLoading`), quella nuova fa `return` silenzioso — nessun errore, solo frecce disabilitate (`MonthAggregateView.jsx`, riceve solo `navLoading`, mai `error`). Se `computeNextWeek` resta bloccato in loop 409 (stesso bug di race §13.2 in `STATO_PROGETTO.md`), `ensureThrough` si ferma con un errore che non viene mai mostrato — l'utente vede solo frecce grigie, zero spiegazione. Fix in §12.11.

### 9.3 Altri bug non ancora segnalati

Se emergono altri bug utente oltre ai tre sopra, servirà l'elenco (anche grezzo — screenshot, dump dell'issue tracker) per classificarli allo stesso modo: sintomo di una race già mappata in `STATO_PROGETTO.md §13`, o bug distinto da investigare ex-novo.

---

## 10. Riepilogo priorità

| Priorità | Voce | Perché prima |
|---|---|---|
| 🔴 Alta | Cancellazione account (§1.2) | bloccante per Play Store, gap reale a prescindere |
| 🔴 Alta | Redesign algoritmo turni + concorrenza (§12: RPC transazionali, soglia assenza esplicita, claim atomico) | causa radice confermata dei bug utente in §9.1 |
| 🟠 Media | Onboarding link personali (§2) — l'infrastruttura c'è già, va solo completata la UI | miglioramento UX diretto, costo contenuto |
| 🟠 Media | Fix mismatch colori manifest (§4/§5) | costo quasi zero, risolve parte della lamentela sul logo |
| 🟠 Media | Logging strutturato + Sentry (§6/§7) | necessario per diagnosticare tutto il resto con dati reali invece di supposizioni |
| 🟡 Bassa | Rimozione invite-code legacy (§2.1) | sicurezza, non urgente ma va chiuso |
| 🟡 Bassa | Privacy policy + Data Safety form + Digital Asset Links (§1) | necessario solo quando si è pronti a sottomettere |
| ⚪ Non necessario | Migrazione Firebase (§3) | costo altissimo, beneficio incerto — rivalutare solo se Sentry+logging non spiegano il bug auth |
| ⚪ Non necessario | Rewrite Tailwind (§8) | già fatto |

---

## 12. Redesign algoritmo turni e fix concorrenza

Motivato direttamente da §9.1 — la causa radice dei bug utente più segnalati è l'assenza di transazioni/lock attorno alla scrittura, più la soglia assenza duplicata e divergente tra frontend e backend. Il calcolo (`computeNextWeek`, `pickLeast` in `backend/lib/scheduler.js`) resta in JS, testabile con Vitest, portabile — cambia solo **come e dove si scrive**.

### 12.1 Soglia assenza → decisione esplicita dell'utente

Sostituisce del tutto `ABSENCE_EXCLUSION_THRESHOLD` (75% hardcoded, divergente dal frontend). Quando si aggiunge un'assenza, ogni settimana toccata dal range viene classificata:

- **copertura 0%** → nessuna azione, turno normale;
- **copertura 100%** → esclusione automatica, nessun popup;
- **copertura parziale** → popup `"Riesci a fare il turno che va dal [start] al [end]?"` con bottoni Sì/No.

Esempio concreto (rotazione settimanale, oggi giovedì 20 agosto, assenza 21 agosto → 2 settembre):
- turno 17–23 ago: parziale (3/7gg) → chiede;
- turno 24–30 ago: pieno → auto-esclude, silenzioso;
- turno 31 ago–6 set: parziale (3/7gg) → chiede.

**Storage**: nuova tabella `absence_week_decisions` (`house_id`, `week_id`, `user_id`, `can_do boolean`, riferita all'assenza). `computeNextWeek` legge questa tabella per le settimane parziali invece di calcolare una percentuale.

**Flusso UI** (`AbsencesScreen.jsx`): dopo la scelta di persona+range, prima del submit — genera/assicura le settimane fino a `absence.to` (`ensureThrough`), classifica ciascuna, mostra il popup in sequenza solo per quelle parziali, raccoglie le risposte in un array. Submit unico: `POST /absences` con body esteso `{ userId, from, to, weekDecisions: [{ weekId, canDo }] }`.

**Fallback**: se una settimana parziale non ha decisione registrata (es. inserimento via API diretta, non dalla UI) → default conservativo, esclude.

**Caso aperto**: modifica di un'assenza esistente deve ri-classificare solo le settimane il cui overlap è cambiato, non ri-chiedere quelle già decise e ancora valide.

### 12.2 Scritture multi-step → RPC Postgres transazionali

| # | Problema | File | Fix |
|---|---|---|---|
| 1 | `insertWeek` fa 2 insert separati (weeks poi assignments), nessuna transazione — crash a metà lascia turno vuoto | `backend/lib/db.js: insertWeek` | Funzione RPC `plpgsql` (`BEGIN`/`COMMIT`) che riceve il payload calcolato da JS e scrive weeks+assignments in un colpo solo |
| 2 | Due `GET /weeks` paralleli (due dispositivi) calcolano lo stesso turno, uno vince l'insert, l'altro prende un 500 Postgres grezzo | `backend/routes/weeks.js`, `STATO_PROGETTO.md §13.2` | `pg_advisory_xact_lock(hashtext(houseId))` dentro la stessa RPC del punto 1 — la seconda richiesta aspetta il lock, poi trova il turno già esistente, no-op pulito, zero errore utente |
| 3 | `swapAssignments` fa DELETE poi INSERT separati — stesso rischio di perdita task a metà operazione | `backend/lib/db.js: swapAssignments`, `STATO_PROGETTO.md §13.3` | Stessa pattern RPC transazionale |
| 4 | `insertAbsence` + `invalidateUpcomingWeeks` non atomici (causa diretta di §9.1) | `backend/routes/absences.js` | Stessa RPC: `insertAbsence` + `absence_week_decisions` (§12.1) + `invalidateUpcomingWeeks` in un solo `BEGIN`/`COMMIT` |
| 5 | `claimUserSlotByAuth` fa SELECT-poi-UPDATE — due persone claimano lo stesso slot, l'ultima vince silenziosa, la prima perde accesso senza errore | `backend/lib/db.js: claimUserSlotByAuth`, `STATO_PROGETTO.md §13.4` | Compare-and-swap in una query sola: `UPDATE users SET auth_id=$1, email=$2, claimed=true WHERE id=$3 AND house_id=$4 AND auth_id IS NULL RETURNING *`. Se 0 righe → slot già preso, errore pulito immediato |

### 12.3 Costanti configurabili per casa

Soglia assenza (ora sostituita da §12.1, ma il pattern resta utile) e orizzonte di generazione (`AUTO_GENERATE_HORIZON_DAYS = 30`, `backend/lib/scheduler.js:5`) oggi hardcoded. Fix: colonna `generate_horizon_days` su `houses`, default 30 — nessuna rottura per case esistenti, ma regolabile.

### 12.4 Realtime al posto del sync "a scatti"

Sostituisce il refresh solo-su-focus/push (`STATO_PROGETTO.md §13.1`) con **Supabase Realtime** (`postgres_changes`) su `weeks`, `assignments`, `absences`, `shift_swaps`, filtrato per `house_id`. Il frontend sottoscrive un canale per la casa attiva, aggiorna lo state React sugli eventi INSERT/UPDATE/DELETE. Chiude anche parte di §9.1: un secondo dispositivo vede il ricalcolo appena accade, non al prossimo focus della tab.

### 12.5 Cron/notifiche duplicate se il backend scala

`STATO_PROGETTO.md §13.5`: `startReminderCron()` e `notifyIfNewVersion()` girano in-process senza lock — con più istanze backend, reminder e notifica-nuova-versione si duplicano per ogni istanza attiva. Fix: `pg_advisory_lock` (non transazionale, tenuto per la durata del job) attorno a `sendDailyReminders`/`sendMissedTurnReminders`/`notifyIfNewVersion` — chi prende il lock esegue, le altre skip pulito. Alternativa più semplice se non serve scaling imminente: cron come processo dedicato separato (uno solo), web server senza `startReminderCron()`.

### 12.6 Hardening indipendente (bassa complessità, alto valore)

- **CORS aperto** (`backend/index.js:13`, `STATO_PROGETTO.md §13.6`): `cors({ origin: process.env.FRONTEND_URL })` invece di `cors()` nudo.
- **Nessun rate limit**: `express-rate-limit` per IP + per `authId` sulle rotte mutanti (POST/PUT/DELETE).
- **Errori Postgres grezzi esposti** (`{ error: e.message }` in ogni route): mappare i codici noti (es. `23505` unique violation) a messaggi utente specifici prima della risposta; il messaggio grezzo va solo nel log strutturato (§6), mai al client.
- **Invite legacy mai rimossi** (`house_invite_code`/`users.invite_code`, mai scadono, coesistono col sistema `invites`): migrazione che droppa le colonne, `createHouse` smette di generarle, `lookupHouseByCode` rimossa — chiude US-06.5.

### 12.7 Pagina mensile — errore silenzioso (§9.2)

`MonthAggregateView` riceve solo `navLoading` da `useWeeks`, mai `error`. Fix: passare anche `error`, mostrare messaggio + bottone "Riprova" invece di frecce disabilitate senza spiegazione. Inoltre: se `ensureThrough` è già in corso e arriva una nuova richiesta di navigazione, oggi viene scartata silenziosa — va accodata invece di droppata, eseguita a fine di quella corrente.

---

## 13. Prossimo passo

Questo documento è una **proposta di roadmap**, non ha ancora toccato codice. Prima di iniziare a implementare serve sapere da te:
1. Via libera per iniziare da §12 (algoritmo + concorrenza) — schema RPC/migrazioni prima, o implementazione diretta punto per punto?
2. Conferma priorità di §10 — o un ordine diverso se hai vincoli (es. deadline Play Store).
3. Per §2: confermi che l'obiettivo è **un link personale/via email per coinquilino sempre** (§3 idea invito via email), eliminando del tutto l'invito-casa condiviso (non solo affiancarlo)?
4. Altri bug utente oltre a §9.1/§9.2, se ce ne sono.
