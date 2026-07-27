# Software Architecture — C4 Container Diagram (live-audio MVP)

**Notation:** C4 Model — **Container** level (+ one external system).  
**System:** Minduel Lite as built for Knowledge Base **V2.0**.  
**Authoritative rules:** `docs/MinduelLite-Knowledge-Base-KB.txt`.

---

## C4 Container diagram

```
                    +-----------------------------+
                    |          Person             |
                    |   User (web browser)        |
                    |   Chrome / Incognito demo   |
                    |   + microphone              |
                    +-------------+---------------+
                                  |
                                  | HTTP  http://localhost:5173
                                  v
                    +-----------------------------+
                    |   Container: Frontend       |
                    |   React SPA (Vite)          |
                    |   port 5173                 |
                    |                             |
                    |   Welcome / Pool / Match /  |
                    |   Result                    |
                    |   MatchAudio (livekit-client)|
                    |   sessionStorage session    |
                    |   Poll pool/match ~1s       |
                    +------+--------------+--------+
                           |              |
              REST / JSON  |              | live microphone audio
           X-Player-Id     |              | (media only; simple link)
           X-Session-Token |              |
                           v              v
        +------------------------+   +---------------------------+
        | Container: Backend     |   | External: LiveKit         |
        | Node.js + Express      |   | (managed Cloud service)   |
        | port 3001              |   |                           |
        | Authoritative game     |   | No ICE/STUN/TURN diagram  |
        | state                  |   | (kept intentionally simple)|
        +-----------+------------+   +------------^--------------+
                    |                             |
                    | signed authorization/token  |
                    | (JWT for room + identity)   |
                    +-----------------------------+
                    |
                    | SQL (parameterized)
                    v
        +-----------------------------+
        |   Container: Database       |
        |   PostgreSQL 16             |
        |   port 5432                 |
        |   no audio/transcript tables|
        |   seed: 1000 questions      |
        +-----------------------------+
```

### Compact paths (keep simple — no detailed WebRTC infrastructure)

**Game state and persistence**

```
React SPA
    |
    | REST / JSON
    v
Express
    |
    | SQL
    v
PostgreSQL
```

**Authorization for live audio**

```
Express
    |
    | signed authorization / token
    | (JWT: room match-{matchId}, identity playerId)
    v
LiveKit
```

**Live microphone audio (media only)**

```
React SPA
    |
    | live microphone audio
    v
LiveKit
    |
    | live microphone audio
    v
React SPA
```

(Equivalent short form: `React SPA  ↔  live microphone audio  ↔  LiveKit`)

The diagram intentionally **does not** expand ICE/STUN/TURN, mesh topology, or media-server internals. LiveKit is one external managed box.

---

## Why managed LiveKit (external system)

| Point | Explanation |
|-------|-------------|
| **Not an IU mandate** | IU Task 2 requires SPA, backend, DB, tests, Docker/Compose, docs. LiveKit is a **project-specific** choice. |
| **Minimize WebRTC complexity** | Avoid hand-built signaling and TURN/STUN design; managed LiveKit + a short-lived signed token is enough for the demo. |
| **Compose stays simple** | Exactly three app services: frontend, backend, database. **No** LiveKit container in this repo. |
| **Privacy for MVP** | App does not record, store, or transcribe spoken audio. |

---

## Container responsibilities (as built)

| Container / system | Technology | Responsibility |
|--------------------|------------|----------------|
| Frontend | React, Vite, livekit-client | Four screens; temporary session; poll game state; connect LiveKit; local mute |
| Backend | Express, `pg`, livekit-server-sdk | Validate input; matchmaking; phases; scores/flags/results; issue LiveKit tokens for ACTIVE participants only |
| Database | PostgreSQL | Players, queue, questions, matches, rounds (completion flags + scores — no media) |
| **LiveKit (external)** | Managed Cloud | Real-time microphone audio between the two match participants |

---

## Docker Compose topology

Three services only:

| Service | Host ports |
|---------|------------|
| `frontend` | 5173 |
| `backend` | 3001 (`LIVEKIT_*` env from root `.env`) |
| `database` | 5432 |

Startup: `docker compose up --build`

---

## Matchmaking calculation

Each player selects **exactly 3** interests from 32.

```
sharedInterestCount = | interests(A) ∩ interests(B) |   ∈ {0, 1, 2, 3}
similarity = sharedInterestCount / 3
```

Priority: 3 → 2 → 1 shared; **0 = never matched**. Tie-break: earliest `joined_at`.

---

## Match state machine (as built)

### Match status

`ACTIVE` | `ENDED`

### Phases while ACTIVE

```
P1_ANSWER
    | Player 1 speaks → answer-complete
    v
P2_SCORE_P1
    | Player 2 scores 1–10
    v
P2_ANSWER
    | Player 2 speaks → answer-complete
    v
P1_SCORE_P2
    | Player 1 scores 1–10
    v
REVIEW
    | each ACCEPT or FLAG own received score
    |
    +-- player1_flag_count >= 3 OR player2_flag_count >= 3
        (counts are independent; immediately on one player's third FLAG)
        → ENDED / THREE_FLAGS
    |
    +-- both reviewed, question = 10 → ENDED / COMPLETED
    |
    +-- both reviewed, else → next question, P1_ANSWER
```

LiveKit room stays connected for the whole `ACTIVE` match (not recreated per question).  
On Result / unmount: client disconnects; backend refuses new tokens when status is not `ACTIVE`.

Implementation: `completeAnswer`, `submitScore`, `submitReview`, `advanceMatch`, `calculateResult`, `issueMatchAudioToken`.

### Roles

- Player already in queue → **Player 1**  
- Joining player → **Player 2**  

---

## Architectural decisions

| ID | Decision |
|----|----------|
| ADR-001 | **Live spoken interaction via managed LiveKit** (project-specific; not IU-mandated raw WebRTC) |
| ADR-002 | Short polling for **game state**; LiveKit for **media only** |
| ADR-003 | Backend authoritative for matchmaking, phases, scores, flags, results |
| ADR-004 | Temporary session headers (`X-Player-Id` / `X-Session-Token`), not account login |
| ADR-005 | Direct SQL via `pg`, no ORM |
| ADR-006 | No recording / storage / transcription of spoken audio in the application |

V1 “audio out of scope” is archived under `docs/archive/` and branch `safety/text-answer-mvp`.
