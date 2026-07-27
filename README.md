# Minduel Lite

## Project Overview

Minduel Lite is a mobile-first full-stack web application for short, anonymous, two-player intellectual competitions. It is an academic MVP for IU course **DLBSEPPSD01_E — Software Development** (Task 2: Development of a web application).

Users create a temporary profile (display name, avatar, three interests), enter a matchmaking pool, and play a ten-question peer-scored duel against a compatible opponent. There are no permanent accounts, chat, rankings, or cloud deployment.

**Authoritative product rules (Knowledge Base V2.0):**  
`docs/MinduelLite-Knowledge-Base-KB.txt` (also at root: `MinduelLite Knowledge Base KB.txt`).

V2.0 specifies a **live-audio** competition (LiveKit). The previously completed **text-answer** build is preserved on branch `safety/text-answer-mvp` (tag `text-answer-mvp-complete`); V1.0 text-only KB is under `docs/archive/knowledge-base-v1.0-text-answers/`.

## Features

- Temporary anonymous profile (name, one of 12 avatars, exactly 3 of 32 interests)
- Interest-based matchmaking (prefer 3 shared interests, then 2, then 1; never 0)
- Synchronized ten-question match with peer scoring (1–10) and score review / flags
- **Target (KB V2.0):** live spoken interaction via LiveKit during the match (text-answer MVP frozen on `safety/text-answer-mvp`)
- Accept or flag received scores; three combined flags end the match early
- Final average of non-flagged scores; winner or draw
- Play again (same temporary profile) or reset profile
- Single-command local run via Docker Compose

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, JavaScript, React Router, plain CSS |
| Backend | Node.js, Express, `pg` |
| Database | PostgreSQL 16 |
| Communication | REST/JSON, ~1 second short polling |
| Tests | Vitest, React Testing Library, Supertest |
| Infrastructure | Docker, Docker Compose |

## Architecture

```
User (browser)
      |
      v
React SPA  (port 5173)
      |  REST / JSON
      v
Node.js / Express API  (port 3001)
      |  parameterized SQL
      v
PostgreSQL  (port 5432)
```

The backend is authoritative for matchmaking, match phases, scores, flags, and results.  
Further diagrams: `docs/architecture.md` (C4), `docs/er-diagram.md` (data model).

## Prerequisites

Only this is required for the default path:

1. **Docker Desktop** installed and **running** (Windows, macOS, or Linux)
2. A terminal in the project root (this repository folder)

No local Node.js or PostgreSQL install is required when using Docker Compose.  
(Optional for developers: Node.js 20+ to run unit tests on the host.)

Copying `.env` is **not** required for Compose: defaults are set in `docker-compose.yml`.  
`.env.example` documents variable names if you customize them later.

## Running the Application

From the project root:

```bash
docker compose up --build
```

Wait until the three services are up (database healthy, backend listening, Vite ready).  
First start may take a few minutes while images build and the database seeds 1,000 questions.

Stop with `Ctrl+C`, or in another terminal:

```bash
docker compose down
```

Clean database (removes the volume and re-runs schema + seed on next start):

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

### Two-player demonstration

1. Open **Chrome** → http://localhost:5173  
2. Open **Chrome Incognito** → http://localhost:5173  
3. Create two profiles that share **2 or 3** interests  
4. Both click **Enter pool** → they should match and see the same question  
5. Play answer → score → answer → score → review through the match  

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

On a **new** Docker volume, PostgreSQL runs both files automatically via `docker-entrypoint-initdb.d`.  
Default credentials (Compose defaults): user `minduel`, password `minduel`, database `minduel`.

## Project Structure

```
MinduelLite/                 (project root)
├── frontend/                React SPA (Vite)
│   ├── src/
│   │   ├── pages/           Welcome, Pool, Match, Result
│   │   ├── components/      Avatar, interests, score pickers
│   │   ├── api/             HTTP + sessionStorage helpers
│   │   └── assets/avatars/  12 predefined avatars
│   ├── tests/
│   └── Dockerfile
├── backend/                 Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/        matchmaking, match engine, validation
│   │   └── middleware/      temporary session headers
│   ├── tests/
│   ├── scripts/             demo / acceptance helpers
│   └── Dockerfile
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/                    concept, architecture, wireframes, KB
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## Known Limitations

This MVP intentionally prioritizes a reliable local demonstration over production systems:

- No permanent accounts, login, or email
- Temporary session headers only (not production auth)
- Short polling instead of WebSockets
- No disconnect recovery
- Subjective peer scoring only
- No match history UI, rankings, chat, or audio
- Static seeded question bank
- Single local Docker deployment (no cloud)
- Demonstration-level security (parameterized SQL, Helmet, CORS, body limit)

These may be discussed as future improvements in the oral project report; they are out of scope for this submission.
