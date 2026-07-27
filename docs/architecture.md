# Software Architecture — C4 Container Diagram (final)

**Notation:** C4 Model — **Container** level only.  
**System:** Minduel Lite (**text-answer MVP as implemented** on branch `safety/text-answer-mvp`).

> **V2.0 note:** Knowledge Base **Version 2.0** adds a **LiveKit** live-audio path (browser ↔ LiveKit cloud/self-host) while keeping REST polling for game state. This diagram still documents the shipped text MVP. Update containers when the audio refactor lands. Authoritative rules: `docs/MinduelLite-Knowledge-Base-KB.txt` (V2.0).

---

## C4 Container diagram

```
                    +-----------------------------+
                    |          Person             |
                    |   User (web browser)        |
                    |   Chrome / Incognito demo   |
                    +-------------+---------------+
                                  |
                                  | HTTP
                                  | http://localhost:5173
                                  v
                    +-----------------------------+
                    |   Container: Frontend       |
                    |   React SPA (Vite)          |
                    |   port 5173                 |
                    |                             |
                    |   Screens:                  |
                    |     /  Welcome              |
                    |     /pool                   |
                    |     /match/:matchId         |
                    |     /result/:matchId        |
                    |   sessionStorage:           |
                    |     playerId, sessionToken  |
                    |   Poll API ~1s (pool/match) |
                    +-------------+---------------+
                                  |
                                  | REST / JSON
                                  | X-Player-Id
                                  | X-Session-Token
                                  | http://localhost:3001
                                  v
                    +-----------------------------+
                    |   Container: Backend        |
                    |   Node.js + Express         |
                    |   port 3001                 |
                    |                             |
                    |   /api/health, /api/config  |
                    |   /api/players              |
                    |   /api/pool/*               |
                    |   /api/matches/*            |
                    |   Authoritative game state  |
                    |   Helmet, CORS, 10kb JSON   |
                    +-------------+---------------+
                                  |
                                  | parameterized SQL
                                  | DATABASE_URL
                                  v
                    +-----------------------------+
                    |   Container: Database       |
                    |   PostgreSQL 16             |
                    |   port 5432                 |
                    |                             |
                    |   players, queue_entries,   |
                    |   questions, matches,       |
                    |   match_rounds              |
                    |   seed: 1000 questions      |
                    +-----------------------------+
```

### Compact form

```
User
  |
  v
React SPA
  |
  v
Node.js / Express
  |
  v
PostgreSQL
```

---

## Container responsibilities (as built)

| Container | Technology | Responsibility |
|-----------|------------|----------------|
| Frontend | React, Vite, React Router, plain CSS | Four screens; collect input; store temporary session; poll server; never invent game rules |
| Backend | Express, `pg` | Validate input; matchmaking; own phases/answers/scores/flags/results |
| Database | PostgreSQL | Persist temporary players, queue, question bank, matches, rounds |

---

## Docker Compose topology

Three services on one Compose network:

| Service | Image / build | Host ports |
|---------|---------------|------------|
| `frontend` | `./frontend` Dockerfile (`node:20-alpine`, Vite `--host 0.0.0.0`) | 5173 |
| `backend` | `./backend` Dockerfile (`node:20-alpine`) | 3001 |
| `database` | `postgres:16-alpine` | 5432 |

Startup: `docker compose up --build`

---

## Matchmaking calculation

Each player selects **exactly 3** interests from 32.

```
sharedInterestCount = | interests(A) ∩ interests(B) |   ∈ {0, 1, 2, 3}

similarity = sharedInterestCount / 3
```

| Shared | similarity | Matchmaking |
|--------|------------|-------------|
| 3 | 1.00 | Highest priority |
| 2 | ≈ 0.67 | Next |
| 1 | ≈ 0.33 | Lowest eligible |
| 0 | 0.00 | **Never matched** |

Implementation: `calculateInterestOverlap()` then sort by overlap DESC, `joined_at` ASC.  
No machine learning, embeddings, or vector database.

---

## Match state machine (as built)

### Match status

`ACTIVE` | `ENDED`

### Phases while ACTIVE

```
P1_ANSWER
    |
    | Player 1 submits answer
    v
P2_SCORE_P1
    |
    | Player 2 scores 1–10
    v
P2_ANSWER
    |
    | Player 2 submits answer
    v
P1_SCORE_P2
    |
    | Player 1 scores 1–10
    v
REVIEW
    |
    | both players ACCEPT or FLAG their received score
    |
    +-- flag_count >= 3 -------> ENDED (end_reason = THREE_FLAGS)
    |
    +-- current_question = 10 -> ENDED (end_reason = COMPLETED)
    |
    +-- otherwise -------------> current_question += 1
                                 phase = P1_ANSWER
```

Implementation: `submitAnswer`, `submitScore`, `submitReview`, `advanceMatch()`, `calculateResult()`.

### Roles

- Player already in queue → **Player 1**  
- Joining player → **Player 2**  

---

## Architectural decisions

| ID | Text MVP (implemented / frozen) | Knowledge Base V2.0 (authoritative going forward) |
|----|----------------------------------|-----------------------------------------------------|
| ADR-001 | No live audio / WebRTC (V1) | **Live spoken interaction via LiveKit** (browser mic audio; server issues tokens only) |
| ADR-002 | Short polling instead of WebSockets | Unchanged for **gameplay state**; LiveKit handles **media**, not turn logic |
| ADR-003 | Backend is authoritative for game state | Unchanged |
| ADR-004 | Temporary session headers, not account login | Unchanged |
| ADR-005 | Direct SQL via `pg`, no ORM | Unchanged |

V1 ADR-001 (“audio out of scope”) is **archived** with Knowledge Base V1.0 under `docs/archive/`.
