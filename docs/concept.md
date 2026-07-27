# Minduel Lite — Written Concept (as built — text-answer MVP)

> **Specification status**  
> This concept document describes the **completed text-answer** application that was frozen on branch `safety/text-answer-mvp` (tag `text-answer-mvp-complete`).  
> The **authoritative build specification is now Knowledge Base V2.0** (`docs/MinduelLite-Knowledge-Base-KB.txt`), which requires **LiveKit live audio** and supersedes V1.0 rules that treated audio as out of scope and answers as text.  
> Keep this file for oral-report history and comparison; do not treat text-only answers as the current product goal.

This document describes the **implemented text-answer** academic MVP.  
**Current rules:** `docs/MinduelLite-Knowledge-Base-KB.txt` (**V2.0**).  
**Archived V1.0:** `docs/archive/knowledge-base-v1.0-text-answers/`.

**Process:** Iterative-Incremental Development managed with Kanban  
(see `docs/process-model.md`, `docs/kanban-board.md`).

**Status (text MVP):** Operational full-stack application; local run via `docker compose up --build`.

---

## Project title

**Minduel Lite: An Interest-Based Two-Player Intellectual Competition Web Application**

Working name: **Minduel Lite**

---

## Problem statement

Online users may wish to take part in short intellectual interactions with another person without creating an account, maintaining a permanent profile, building social connections, or using a complicated platform.

Many multiplayer systems require registration, authentication, profile management, and rankings before participation. That overhead blocks immediate, lightweight interaction.

Minduel Lite provides a lightweight flow: temporary profile → three interests → matchmaking → ten peer-scored questions → result → play again or reset.

---

## Target user

A person who wants a short anonymous intellectual competition with another available participant, without permanent identity or PII.

The application only asks for:

- temporary display name (2–20 characters)  
- one of 12 predefined avatars  
- exactly three interests from a fixed list of 32  

---

## User benefit

Immediate participation without email, password, permanent account, friends, or complex settings.

---

## Project objective

Deliver a demonstrable full-stack SPA for IU **DLBSEPPSD01_E** Task 2, with React frontend, Node/Express backend, PostgreSQL, automated tests, Docker Compose, and documentation suitable for a ~15-minute oral project report.

---

## MVP scope (as implemented)

Four screens only:

| Screen | Route | Implementation |
|--------|-------|----------------|
| Welcome | `/` | Name, 12 local avatar images, 32 interests, `POST /api/players` |
| Pool | `/pool` | Join pool, 1s poll, cancel → leave |
| Match | `/match/:matchId` | Phase-driven UI, 1s poll, answer/score/review |
| Result | `/result/:matchId` | Scores, winner/draw, play again / reset / exit |

Stack:

| Part | Built with |
|------|------------|
| Frontend | React + Vite + React Router + plain CSS (`max-width: 480px`) |
| Backend | Express, `pg`, Helmet, CORS, JSON body limit 10kb |
| Database | PostgreSQL: 5 tables, 1,000 seeded questions |
| Runtime | Docker Compose: `frontend`, `backend`, `database` |
| Sync | REST/JSON + ~1 s polling (no WebSockets) |
| Identity | `playerId` + `sessionToken` in `sessionStorage`; headers on API calls |

---

## Functional requirements (implemented)

FR-001–FR-025 from the knowledge base are implemented, including:

- Temporary player creation with server-side validation  
- Matchmaking priority 3 → 2 → 1 shared interests; zero = no match  
- Waiting player = Player 1; joiner = Player 2  
- Random competition set (1–100), ten sequential questions  
- Phase machine: `P1_ANSWER` → `P2_SCORE_P1` → `P2_ANSWER` → `P1_SCORE_P2` → `REVIEW`  
- Flag received scores; three flags end match (`THREE_FLAGS`)  
- Q10 completion (`COMPLETED`); averages exclude flagged scores  
- Play again (same session → pool) / reset profile (clear session → Welcome)  

---

## Non-functional requirements (implemented)

- React SPA, Express backend, PostgreSQL  
- Docker Compose local run: `docker compose up --build`  
- Mobile-first UI (~480px content width)  
- Automated tests (backend Vitest/Supertest; frontend Vitest/RTL)  
- Parameterized SQL; backend validates gameplay  
- Two browser sessions on one machine for demo  

---

## Explicit exclusions (not built)

No accounts/login, chat, rankings, WebSockets, WebRTC/audio, cloud deploy, AI scoring, question admin UI, Redis, microservices, production abuse prevention, match history UI.

---

## Technology choices (as built)

| Choice | Reason |
|--------|--------|
| React + Vite | SPA + modern framework for IU Task 2 |
| Express + `pg` | Minimal REST API; SQL without ORM |
| PostgreSQL arrays for interests | Simple 3-interest profile |
| Short polling | Sufficient for two-player demo; simple to explain |
| Temporary session headers | Session ownership without account system |
| Docker Compose | Reproducible three-service local stack |

---

## Testing approach (as built)

| Suite | Tooling | Focus |
|-------|---------|--------|
| Backend | Vitest, Supertest | Player validation, matchmaking, phases, flags, results, security headers |
| Frontend | Vitest, React Testing Library | Welcome/Pool/Match/Result behaviour, session helpers |
| Manual / scripts | `backend/scripts/*.mjs` | Dual-session demo, Q10 completion, three-flag acceptance |

Approximately **90+** backend and **30+** frontend automated tests cover core paths. Load/E2E browser matrix tools were not used.

See also: `docs/implementation-notes.md` (testing, matchmaking, state machine, security, lessons).

---

## Known limitations (as built)

- No permanent accounts  
- No production authentication  
- Polling instead of WebSockets  
- No disconnect recovery  
- Subjective peer scoring  
- No moderation  
- No match history UI  
- No audio  
- No cloud deployment  
- No production scalability design  

These are intentional scope reductions, not accidental omissions.

---

## Related documentation

| Document | Content |
|----------|---------|
| `docs/architecture.md` | C4 container diagram + state machine |
| `docs/er-diagram.md` | ER model |
| `docs/wireframes.md` | Four wireframes |
| `docs/security.md` | Minimum security approach |
| `docs/implementation-notes.md` | Matchmaking formula, testing, lessons learned |
| `README.md` | How to run and test |
