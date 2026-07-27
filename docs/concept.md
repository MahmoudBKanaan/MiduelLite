# Minduel Lite — Written Concept (live-audio MVP)

**Authoritative specification:** Knowledge Base **V2.0** — `docs/MinduelLite-Knowledge-Base-KB.txt`.  
**Process:** Iterative-Incremental Development managed with Kanban  
(see `docs/process-model.md`, `docs/kanban-board.md`).

**Status:** Full-stack SPA with spoken answers over **LiveKit**; local run via `docker compose up --build` plus LiveKit Cloud credentials.

Historical text-answer freeze: branch `safety/text-answer-mvp` / `docs/archive/knowledge-base-v1.0-text-answers/` (not current product rules).

---

## Project title

**Minduel Lite: An Interest-Based Two-Player Live-Audio Intellectual Competition Web Application**

Working name: **Minduel Lite**

---

## Problem statement

Online users may wish to take part in short intellectual interactions with another person without creating an account, maintaining a permanent profile, building social connections, or using a complicated platform.

Many multiplayer systems require registration, authentication, profile management, and rankings before participation. Text-only chat also removes natural spoken exchange.

Minduel Lite provides a lightweight flow: temporary profile → three interests → matchmaking → **one live audio room** → ten peer-scored spoken questions → result → play again or reset.

---

## Target user

A person who wants a short anonymous intellectual competition with another available participant, without permanent identity or PII.

The application only asks for:

- temporary display name (2–20 characters)  
- one of 12 predefined avatars  
- exactly three interests from a fixed list of 32  

Plus browser **microphone** permission for the match (demo on one machine with two sessions).

---

## User benefit

Immediate participation without email, password, permanent account, friends, or complex settings — with **spoken** intellectual exchange rather than typed essay fields.

---

## Project objective

Deliver a demonstrable full-stack SPA for IU **DLBSEPPSD01_E** Task 2, with React frontend, Node/Express backend, PostgreSQL, automated tests, Docker Compose, and documentation suitable for a ~15-minute oral project report.

**LiveKit is a project-specific requirement**, not an IU examination mandate. IU requires a modern SPA, backend, tests, Docker/Compose, and documentation; **managed LiveKit** was chosen by this project to provide browser-to-browser microphone audio while avoiding hand-built WebRTC (signaling, ICE, STUN/TURN, reconnection). That keeps development and explanation effort appropriate for a university MVP.

---

## Primary user journey (spoken / live audio)

```
Open app (Chrome + Incognito for two players)
        |
        v
Welcome — name, avatar, three interests
        |
        | POST /api/players → sessionStorage
        v
Pool — searching for compatible opponent
        |
        | interest matchmaking 3 → 2 → 1
        v
Match created (Player 1 = waiter, Player 2 = joiner)
        |
        | both request POST .../audio-token
        | connect LiveKit room match-{matchId}
        | enable microphones — "Live audio connected"
        v
Question 1..10 (same text for both; poll REST ~1s)
        |
        | P1 speaks → ANSWER COMPLETE (no text body)
        | P2 scores 1–10
        | P2 speaks → ANSWER COMPLETE
        | P1 scores 1–10
        | both ACCEPT or FLAG received score
        |   (either player's third personal flag ends the match immediately)
        | live audio room stays up across phases & questions
        v
Result — averages, winner/draw
        |
        +-- Play again → same session → Pool (new match, new LiveKit room)
        +-- Reset profile → clear session → Welcome
```

Spoken audio is **not recorded**, **not stored**, and **not transcribed**. Only completion flags, scores, and reviews are persisted.

---

## MVP scope (as built)

Four screens only:

| Screen | Route | Implementation |
|--------|-------|----------------|
| Welcome | `/` | Name, 12 avatars, 32 interests, `POST /api/players` |
| Pool | `/pool` | Join pool, 1s poll, cancel → leave |
| Match | `/match/:matchId` | Phase UI, 1s poll, **MatchAudio** (LiveKit), answer-complete / score / review |
| Result | `/result/:matchId` | Scores, winner/draw, play again / reset / exit |

Stack:

| Part | Built with |
|------|------------|
| Frontend | React + Vite + React Router + plain CSS + **livekit-client** |
| Backend | Express, `pg`, Helmet, CORS, **livekit-server-sdk** (token only) |
| Database | PostgreSQL: 5 tables, 1,000 seeded questions |
| Runtime | Docker Compose: `frontend`, `backend`, `database` (no LiveKit service) |
| Game sync | REST/JSON + ~1 s polling |
| Live audio | **Managed LiveKit Cloud** (external) |
| Identity | `playerId` + `sessionToken` in `sessionStorage` |

---

## Functional requirements (high level)

- Temporary player creation with server-side validation  
- Matchmaking priority 3 → 2 → 1 shared interests; zero = no match  
- One LiveKit room per match; backend issues restricted join tokens  
- Spoken turn → `POST .../answer-complete` (no answer text / audio upload)  
- Phase machine: `P1_ANSWER` → `P2_SCORE_P1` → `P2_ANSWER` → `P1_SCORE_P2` → `REVIEW`  
- Flag scores; three by the same player → `THREE_FLAGS` immediately; mixed player counts never combine  
- Q10 → `COMPLETED`; averages exclude flagged scores  
- Play again / reset profile  

---

## Explicit exclusions

No accounts/login, chat, rankings, raw self-hosted WebRTC stack, recording, transcription, cloud deploy of the app, AI scoring, question admin UI, Redis, microservices, production abuse prevention, match history UI.

---

## Technology choices

| Choice | Reason |
|--------|--------|
| React + Vite | SPA + modern framework for IU Task 2 |
| Express + `pg` | Minimal REST API; SQL without ORM |
| Short polling | Simple game-state sync for a two-player demo |
| **Managed LiveKit** | Project-specific; minimizes raw WebRTC complexity while keeping real two-user audio |
| Temporary session headers | Session ownership without accounts |
| Docker Compose (3 services) | Reproducible local app stack |

---

## Testing approach

| Suite | Focus |
|-------|--------|
| Backend Vitest/Supertest | Players, matchmaking, answer-complete, flags, results, audio-token security |
| Frontend Vitest/RTL | Screens + MatchAudio states (LiveKit mocked) |
| Manual dual browser | Chrome + Incognito, mic, spoken flow |

---

## Known limitations

- Temporary sessions only  
- Polling for game state (not WebSockets)  
- Subjective peer scoring  
- LiveKit Cloud + internet required for audio  
- No recording / storage / transcription of speech  
- No production-scale deploy or abuse prevention  

---

## Related documentation

| Document | Content |
|----------|---------|
| `docs/architecture.md` | C4 + LiveKit external system |
| `docs/er-diagram.md` | ER model (completion flags, no audio tables) |
| `docs/wireframes.md` | Four wireframes (spoken match UI) |
| `docs/security.md` | Minimum security approach |
| `README.md` | How to run, LiveKit env vars, privacy |
