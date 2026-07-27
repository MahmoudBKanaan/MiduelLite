# Minduel Lite — Kanban Board

**Process:** Iterative-Incremental Development managed with Kanban  
**Columns:** BACKLOG → READY → IN PROGRESS → TEST → DONE  
**Rule:** Practical task granularity only (not one ticket per line of the master to-do).

Update this file as work moves. Optional: copy the same columns into Trello / GitHub Projects for a screenshot.

---

## BACKLOG

| ID | Task | Notes |
|----|------|-------|
| B-01 | Presentation screenshots (Welcome, Pool, Match, Result) | After UI stable |
| B-02 | Presentation code excerpts (6 recommended) | After core code frozen |
| B-03 | Oral presentation slides + PDF | ~15 minutes |
| B-04 | Critical evaluation & lessons learned write-up | For slides + concept |
| B-05 | Timed presentation rehearsal | Stay under 20 min cutoff |
| B-06 | GitHub repository publish + title-slide link | After clean tree |

---

## READY

| ID | Task | Notes |
|----|------|-------|
| R-01 | Tutor concept approval (IU requirement) | **Blocker for “implementation phase” narrative if not yet done** |
| R-02 | Clean Docker verification (`docker compose up --build`) | DB verified; full stack still to confirm |
| R-03 | Two-browser end-to-end smoke (match + result) | Chrome + Incognito |
| R-04 | Backend integration tests with live PostgreSQL | Run after item 70 script |
| R-05 | Commit remaining app/docs files & sync with GitHub | Many files still untracked vs `origin/main` |

---

## IN PROGRESS

| ID | Task | Notes |
|----|------|-------|
| — | *(none)* | Keep WIP low |

---

## TEST

| ID | Task | Notes |
|----|------|-------|
| — | *(none)* | |

---

## DONE

| ID | Task | Notes |
|----|------|-------|
| D-01 | Project root + documentation folder structure | `MinduelLite/` |
| D-02 | Knowledge Base saved under `docs/` as authoritative spec | `docs/MinduelLite-Knowledge-Base-KB.*` (**V2.0** current; V1.0 archived under `docs/archive/`) |
| D-03 | Written concept (`docs/concept.md`) | Title, problem, users, FR/NFR, exclusions, tech, tests, limits |
| D-04 | Four wireframes | `docs/wireframes.md` |
| D-05 | C4 container architecture | `docs/architecture.md` |
| D-06 | ER diagram (5 tables) | `docs/er-diagram.md` |
| D-07 | Process model documented (Kanban + justification) | `docs/process-model.md` |
| D-08 | Kanban board created with practical tasks | This file |
| D-09 | Tutor concept package prepared | `docs/tutor-concept-submission.md` |
| D-10 | Repository foundation (gitignore, env example, structure) | Root config files; git already on `main` → GitHub |
| D-10b | Confirm min structure + .gitignore + .env.example (items 10–13) | Verified against checklist |
| D-11 | Database schema + 1,000-question seed | `database/` |
| D-11b | schema.sql tables + MVP constraints (items 14–20) | players, queue, questions, matches, rounds |
| D-11c | seed.sql 100×10=1000 + verify (items 21–22) | `node database/verify-seed.mjs` PASSED |
| D-12 | Backend API (players, pool, match engine, results) | `backend/` |
| D-12a | Backend foundation items 23–30 | package.json, app/server/db, health, config |
| D-12b | Temporary session + POST /api/players (31–36) | session middleware, validation, UUIDs |
| D-12c | Matchmaking + pool API (items 37–44) | overlap, join/status/leave, P1/P2 roles |
| D-12d | Match GET/answer/score (items 45–52) | phases, validation, transitions |
| D-12e | Review/flag + end rules (items 53–61) | ACCEPT/FLAG, THREE_FLAGS, NEXT, COMPLETED |
| D-12f | Final scores + GET result (items 62–69) | non-flagged averages, winner, payload |
| D-12g | Manual backend sequence verify (items 70–71) | PASSED via verify-basic-sequence.mjs |
| D-13a | Frontend foundation (items 72–76) | Vite/React, routes, api.js, sessionStorage |
| D-13b | WelcomePage (items 77–85) | name, 12 avatars, 32 interests, POST players |
| D-13c | PoolPage (items 86–92) | join, poll 1s, match nav, cancel/leave |
| D-13d | MatchPage (items 93–106) | phase UI, poll, answer/score/review, result |
| D-13e | ResultPage (items 107–115) | scores, play again / reset / exit |
| D-13f | Global CSS mobile-first (items 116–120) | max-width 480px, contrast, selected states |
| D-13g | Session refresh + safe errors (items 121–124) | sessionStorage reuse, redirects, no stacks |
| D-14a | Security audit (items 125–132) | parameterized SQL, Helmet, CORS, env, no extras |
| D-14b | Docker Compose stack (items 133–140) | 3 services; compose up --build verified |
| D-14c | Automated tests (items 141–145) | BE 94 + FE 31 passed; core suite mapped |
| D-14d | Clean demo + two-session smoke (146–154) | compose down -v; dual API flow PASSED |
| D-14e | Acceptance Q10 + flags + replay (155–162) | all PASSED; no defects |
| D-15a | Code cleanup (items 163–166) | JSDoc core fns; remove dead code/dup file |
| D-15b | README complete (items 167–168) | full sections; compose-only start path |
| D-15c | Final docs 169–178 | concept, C4, ER, wireframes, notes, lessons |
| D-16a | Clean final verification (179–186) | down -v, compose up, 1000 Q, tests, smoke |
| D-16b | GitHub publish (187–191) | commit 897f0cd pushed to MiduelLite |
| D-13 | Frontend SPA (4 screens, polling, session) | `frontend/` |
| D-14 | Dockerfiles + Docker Compose | Compose stack defined |
| D-15 | Automated tests (frontend + backend unit) | Vitest suites |
| D-16 | README + docs index | `README.md`, `docs/README.md` |

---

## Practical task map (master to-do → board)

Master checklist phases are **grouped** into board cards (not hundreds of tickets):

| Board card | Covers master phases (approx.) |
|------------|--------------------------------|
| Concept & diagrams | Phase 1 (items 1–6) |
| Process & Kanban | Phase 1 (items 7–8) |
| Tutor submission package | Phase 1 (item 9) |
| Repo foundation | Phase 2 |
| Database | Phase 3 |
| Backend foundation + sessions | Phases 4–5 |
| Matchmaking | Phase 6 |
| Match engine | Phase 7 |
| Frontend screens | Frontend phases |
| Docker stack | Docker phases |
| Tests | Testing phases |
| README / final docs | Doc phases |
| E2E smoke + Compose verify | Acceptance / hardening |
| GitHub publish | Phase 25 |
| Presentation & evaluation | Phases 26–29 |

---

## How to use during the oral report

1. Show this board (or a tool screenshot with the same five columns).  
2. Point to **DONE** for concept → foundation → feature increments.  
3. Point to **READY/BACKLOG** for verification, GitHub, and presentation work.  
4. Emphasise **low WIP** and **scope locked by the Knowledge Base**.
