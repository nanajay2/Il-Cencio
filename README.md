# Turni di Casa · Via Risorgimento

Static single-page web app for managing weekly cleaning schedules in a shared flat. Hosted on GitHub Pages, data persisted via [JSONBin.io](https://jsonbin.io).

## Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML / CSS / JS — no build step, no dependencies |
| Storage | JSONBin.io REST API (one shared JSON bin) |
| Hosting | GitHub Pages |
| Fonts | Google Fonts — DM Serif Display + Plus Jakarta Sans |

## Features

- **Weekly view** — one week at a time, navigable with prev/next arrows
- **Per-task cards** — one card per chore (Cucina, Bagno 1, Bagno 2, Corridoio, Spazzatura), each with a coloured left-border accent
- **Assignment rules**
  - Bagno 1 → only Giada, Silvia, Eliana
  - Bagno 2 → only Marco, Giulia
  - Whoever does Cucina one week gets Corridoio the next
  - Remaining chores rotate by least-recently-assigned
- **Auto-generation** — on load the app silently generates the next 4 future weeks if missing, then saves them back to the bin
- **Done check** — any household member can mark a task as completed; state is shared in real time via JSONBin
- **Absences** — mark a person absent for a date range; their card is greyed out for that week
- **First 3 weeks** are hard-coded as the initial seed (1–7 Jun, 8–14 Jun, 15–21 Jun 2026)

## Setup

### First person
1. Create a free account at [jsonbin.io](https://jsonbin.io)
2. Copy your **Master Key** from *Account → API Keys*
3. Open the app → ⚙️ → paste the Master Key, leave Bin ID empty → **Salva e connetti**
4. The app creates the bin and shows the **Bin ID** — share it with the other flatmates

### Other flatmates
Open the app → ⚙️ → enter the same Master Key + the Bin ID received from the first person.

Credentials are stored in `localStorage` on each device — nothing is committed to the repo.

## Files

```
index.html   ← entire app (HTML + CSS + JS, self-contained)
README.md
```
