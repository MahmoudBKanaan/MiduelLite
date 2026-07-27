# Minduel Lite

## Project Overview

Minduel Lite is a mobile-first full-stack web application for short, anonymous, two-player **live-audio intellectual competitions**. It is an academic MVP for IU course **DLBSEPPSD01_E — Software Development** (Task 2: Development of a web application).

Users create a temporary profile (display name, avatar, three interests), enter a matchmaking pool, and compete in a ten-question peer-scored duel. During the match they speak answers over a **LiveKit** browser-to-browser audio room (not typed answers). There are no permanent accounts, chat, rankings, or cloud deployment of the app stack.

**Authoritative product rules (Knowledge Base V2.0):**  
`docs/MinduelLite-Knowledge-Base-KB.txt` (also at root: `MinduelLite Knowledge Base KB.txt`).

A frozen **text-answer** snapshot remains on branch `safety/text-answer-mvp` (tag `text-answer-mvp-complete`) for history only. Current development follows **V2.0 live audio**.

## Features

- Temporary anonymous profile (name, one of 12 avatars, exactly 3 of 32 interests)
- Interest-based matchmaking (prefer 3 shared interests, then 2, then 1; never 0)
- **Live spoken answers** over LiveKit for the duration of each match
- Turn completion via **Answer complete** (no answer text sent to the server)
- Peer scoring (1–10), accept/flag review; three flags by either same player end the match early (the two players' counts never combine)
- Final average of non-flagged scores; winner or draw
- Play again (same temporary profile) or reset profile
- Single-command local run via Docker Compose (app services only; LiveKit is managed cloud)

### Spoken audio privacy (important)

- Spoken audio is **not recorded**
- Spoken audio is **not stored** in PostgreSQL or any app table
- Spoken audio is **not transcribed**
- The backend only marks that a player finished speaking (`answer-complete`); media stays on the LiveKit path in the browser

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, JavaScript, React Router, plain CSS, **livekit-client** |
| Backend | Node.js, Express, `pg`, **livekit-server-sdk** |
| Database | PostgreSQL 16 |
| Gameplay sync | REST/JSON, ~1 second short polling |
| Live audio | **LiveKit** (managed Cloud preferred; optional local `--profile local-audio` for dev only) |
| Tests | Vitest, React Testing Library, Supertest |
| Infrastructure | Docker, Docker Compose (frontend, backend, database only) |

## Architecture

```
User (browser)  ←→  LiveKit Cloud (microphone audio only)
      |
      | REST / JSON  (+ short-lived LiveKit JWT from backend)
      v
React SPA  (port 5173)
      |
      v
Node.js / Express API  (port 3001)
      |  parameterized SQL
      v
PostgreSQL  (port 5432)
```

The backend is authoritative for matchmaking, match phases, scores, flags, and results.  
LiveKit carries **media only**; it does not replace game-state polling.  
Further diagrams: `docs/architecture.md` (C4), `docs/er-diagram.md` (data model).

## Prerequisites

1. **Docker Desktop** installed and **running** (Windows, macOS, or Linux)
2. A terminal in the project root (this repository folder)
3. A **microphone** (for the live-audio demonstration in two browser sessions)
4. An **internet connection** (required for LiveKit Cloud live audio)
5. A free **LiveKit Cloud** project ([https://cloud.livekit.io](https://cloud.livekit.io)) with API credentials

No local Node.js or PostgreSQL install is required when using Docker Compose.  
(Optional for developers: Node.js 20+ to run unit tests on the host.)

## Environment variables

Copy `.env.example` to `.env` in the project root and fill LiveKit values.  
**Never commit `.env`.** Secrets must not appear in frontend code or client responses.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `LIVEKIT_URL` | Backend | LiveKit WebSocket URL (e.g. `wss://….livekit.cloud`) |
| `LIVEKIT_API_KEY` | Backend only | LiveKit API key (never sent to the browser) |
| `LIVEKIT_API_SECRET` | Backend only | LiveKit API secret (never sent to the browser) |
| `PORT` | Backend | API port (default `3001`) |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `FRONTEND_ORIGIN` | Backend | CORS origin (default `http://localhost:5173`) |
| `POSTGRES_DB` / `USER` / `PASSWORD` | Database service | Compose defaults: `minduel` / `minduel` / `minduel` |

Docker Compose passes the three `LIVEKIT_*` variables into the **backend** service only.  
Default `docker compose up` runs **three** app services (frontend, backend, database).  
Optional local LiveKit (dev keys `devkey` / `secret`, URL `ws://localhost:7880`):

```bash
docker compose --profile local-audio up -d
```

Prefer managed **LiveKit Cloud** for submission demos when you have Cloud credentials.

Example `.env` (values are placeholders):

```env
# Cloud (recommended for real demos):
# LIVEKIT_URL=wss://your-project.livekit.cloud
# LIVEKIT_API_KEY=your_api_key
# LIVEKIT_API_SECRET=your_api_secret

# Local open-source LiveKit (--profile local-audio):
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

Without LiveKit credentials the app stack still starts; matchmaking and phases work, but `POST /api/matches/:id/audio-token` returns **503** and the UI shows audio unavailable.

## Running the Application

From the project root (with `.env` configured for live audio):

```bash
docker compose up --build
```

Wait until the three services are up (database healthy, backend listening, Vite ready).  
First start may take a few minutes while images build and the database seeds 1,000 questions.

After changing LiveKit variables:

```bash
docker compose up -d backend
```

Stop with `Ctrl+C`, or:

```bash
docker compose down
```

Clean database (new schema + seed on next start):

```bash
docker compose down -v
docker compose up --build
```

## Application URLs

| Service | URL |
|---------|-----|
| Frontend (SPA) | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/api/health |

### Two-player live-audio demonstration

1. Prefer **headphones** to avoid feedback  
2. Open **Chrome** → http://localhost:5173  
3. Open **Chrome Incognito** → http://localhost:5173  
4. Create two profiles that share **2 or 3** interests  
5. Both **Enter pool** → same match, allow **microphone** when prompted  
6. Confirm **Live audio connected** on both sides  
7. Speak answers; use **Answer complete** (no typing); score and review through the match  

## Running Tests

With Docker Compose already running (so Postgres is available for backend integration tests):

**Backend**

```bash
cd backend
npm install
```

Windows PowerShell:

```powershell
$env:DATABASE_URL="postgresql://minduel:minduel@localhost:5432/minduel"
$env:FRONTEND_ORIGIN="http://localhost:5173"
npm test
```

macOS / Linux:

```bash
export DATABASE_URL="postgresql://minduel:minduel@localhost:5432/minduel"
export FRONTEND_ORIGIN="http://localhost:5173"
npm test
```

Without `DATABASE_URL`, unit tests still run; database integration tests are skipped.

**Frontend**

```bash
cd frontend
npm install
npm test
```

Optional smoke scripts (stack must be running):

```bash
cd backend
node scripts/verify-basic-sequence.mjs
node scripts/demo-two-browsers.mjs
node scripts/acceptance-155-162.mjs
```

## Database

| File | Purpose |
|------|---------|
| `database/schema.sql` | Tables: players, queue_entries, questions, matches, match_rounds |
| `database/seed.sql` | 100 competitions × 10 questions = **1,000** static questions |

`match_rounds` stores **answer completion flags** and scores/reviews only — **not** answer text, audio, or transcripts.

For an existing development volume created before per-player score-strike
counts were introduced, run once:

```bash
docker compose exec -T database psql -U minduel -d minduel \
  < database/migrate-per-player-flags.sql
```

On a **new** Docker volume, PostgreSQL runs both files automatically via `docker-entrypoint-initdb.d`.  
Default credentials (Compose defaults): user `minduel`, password `minduel`, database `minduel`.

## Project Structure

```
MinduelLite/                 (project root)
├── frontend/                React SPA (Vite) + livekit-client
│   ├── src/
│   │   ├── pages/           Welcome, Pool, Match, Result
│   │   ├── components/      MatchAudio, Avatar, interests, score pickers
│   │   ├── api/             HTTP + sessionStorage helpers
│   │   └── assets/avatars/  12 predefined avatars
│   ├── tests/
│   └── Dockerfile
├── backend/                 Express API + livekit-server-sdk
│   ├── src/
│   │   ├── routes/
│   │   ├── services/        matchmaking, match engine, audio tokens
│   │   └── middleware/      temporary session headers
│   ├── tests/
│   ├── scripts/             demo / acceptance helpers
│   └── Dockerfile
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/                    concept, architecture, wireframes, KB V2.0
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Known Limitations

This MVP prioritizes a reliable local demonstration over production systems:

- No permanent accounts, login, or email
- Temporary session headers only (not production auth)
- Short polling for game state (LiveKit for audio media only)
- No production-grade disconnect recovery
- Subjective peer scoring only
- No match history UI, rankings, or chat
- **No recording, storage, or transcription of spoken audio**
- Static seeded question bank
- LiveKit Cloud required for audio (internet); app not cloud-deployed as a whole
- Demonstration-level security (parameterized SQL, Helmet, CORS, body limit; secrets server-side only)

Historical note: a text-answer prototype is archived on `safety/text-answer-mvp` and under `docs/archive/`; it is **not** the current product specification.
