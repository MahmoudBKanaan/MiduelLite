# Implementation notes (as built)

Documents items **173–178** for the oral project report.  
Only reflects behaviour actually implemented and exercised during development.

---

## 173. Matchmaking calculation

Each player selects exactly **three** interest IDs from the fixed catalog of **32**.

```
sharedInterestCount = number of identical interest IDs
                    ∈ { 0, 1, 2, 3 }

similarity = sharedInterestCount / 3
```

| sharedInterestCount | similarity | Eligible? | Priority |
|---------------------|------------|-----------|----------|
| 3 | 1.00 | yes | highest |
| 2 | 0.67 | yes | medium |
| 1 | 0.33 | yes | lowest |
| 0 | 0.00 | **no** | never matched |

**Algorithm (as coded):**

1. Load waiting players from `queue_entries` (excluding self).  
2. Compute `calculateInterestOverlap(current, candidate)`.  
3. Discard overlap 0.  
4. Sort remaining by overlap **descending**, then `joined_at` **ascending**.  
5. Best candidate becomes **Player 1** (was waiting); joiner becomes **Player 2**.  
6. Create match with random `competition_id` 1–100, phase `P1_ANSWER`.  
7. Remove both from the queue.  

No ML, embeddings, or vector database.

**Code:** `backend/src/services/matchmakingService.js`

---

## 174. Match state machine

### Status

- `ACTIVE` — gameplay in progress  
- `ENDED` — finished (`COMPLETED` or `THREE_FLAGS`)

### Phase flow (each question)

```
P1_ANSWER
    → (P1 answer-complete / spoken) →
P2_SCORE_P1
    → (P2 score 1–10) →
P2_ANSWER
    → (P2 answer-complete / spoken) →
P1_SCORE_P2
    → (P1 score 1–10) →
REVIEW
    → (each player ACCEPT or FLAG own received score)
```

### After both reviews (`advanceMatch`)

```
if player1_flag_count >= 3 or player2_flag_count >= 3:
    status = ENDED, end_reason = THREE_FLAGS

The counts are independent: for example, Player 1 = 2 and Player 2 = 2 remains active.
else if current_question >= 10:
    status = ENDED, end_reason = COMPLETED
else:
    current_question += 1
    phase = P1_ANSWER
    insert new match_rounds row
```

Frontend only **displays** server phase/role; it does not advance the machine itself.

**Code:** `backend/src/services/matchService.js`  
Also diagrammed in `docs/architecture.md`.

---

## 175. Minimum security approach

Demonstration-appropriate controls only (see `docs/security.md`):

| Control | Implementation |
|---------|----------------|
| Parameterized SQL | All queries use `$1…$n` via `pg` |
| Server-side validation | Name, avatar, interests, answer-complete, score, phase, ownership, LiveKit token |
| Temporary session | `X-Player-Id` + `X-Session-Token` (not JWT login) |
| Helmet | Default security headers |
| CORS | Restricted to `FRONTEND_ORIGIN` |
| Body limit | `express.json({ limit: '10kb' })` |
| Secrets | `DATABASE_URL` / Postgres vars from environment; `.env` gitignored |
| Errors | JSON `{ error }` only; no stack traces to clients |

**Not implemented:** OAuth, password accounts, rate-limit platforms, CAPTCHA, WAF, secret rotation, pen-test tooling.

---

## 176. Testing approach

| Layer | Tools | What is covered |
|-------|--------|-----------------|
| Backend unit | Vitest | Overlap, selection, averages, winner, phase decisions, validation |
| Backend API | Vitest + Supertest + Postgres | Players, pool, full phase flow, flags, results, security headers |
| Frontend | Vitest + React Testing Library | Welcome/Pool/Match/Result, session helpers |
| Acceptance scripts | Node `fetch` against running Compose stack | Dual session, Q10 completion, three-flag path |

**Not used:** Cypress/Playwright browser E2E, load tests, chaos tests.

**How to run:** see root `README.md` (requires Docker Postgres for full backend integration suite).

---

## 177. Known limitations

As delivered, the system deliberately has:

1. **No permanent accounts**  
2. **No production authentication** (temporary session headers only)  
3. **Polling for game state** (LiveKit for media only, not turn logic)  
4. **No advanced disconnect recovery**  
5. **Subjective peer scoring** (no objective answer key)  
6. **No voice moderation**  
7. **No match history UI**  
8. **Dependence on managed LiveKit + internet for audio** (project-specific; not IU-mandated)  
9. **No audio recording / storage / transcription**  
10. **No cloud deployment of the app stack** / no production multi-region media design  

These match KB V2.0 scope and are acceptable for the university MVP goal.

---

## 178. Lessons learned (from this implementation)

Only claims that reflect work actually done on this project:

1. **Fixed MVP scope reduced delivery risk.** Managed LiveKit kept spoken audio feasible without building raw WebRTC infrastructure or bloating Compose.

2. **Backend-authoritative state simplified multiplayer consistency.** With both browsers polling the same match row, turn order stayed consistent without client-side game logic.

3. **Short polling was enough for a two-player academic demo.** One-second polls kept implementation and debugging simple; production efficiency was irrelevant.

4. **Simple relational modeling covered turn-based play.** Five tables and direct SQL were sufficient; an ORM would have added ceremony without clear benefit at this size.

5. **Interest overlap as count/3 is explainable and testable.** Binary interest vectors needed no ML stack, yet still demonstrated non-trivial matching rules (3→2→1, zero rejected).

6. **Docker Compose improved reproducibility.** Schema + seed on volume init removed manual database setup for demos and CI-like local runs.

7. **Focused tests beat volume.** A few dozen tests on matchmaking, phases, flags, and result averages caught real isolation issues (parallel Vitest files sharing one database) more usefully than broad UI snapshots.

8. **Test isolation is part of multiplayer design.** Shared queue state between automated tests required explicit cleanup and sequential file runs—mirroring real concurrent users contending for the same pool.

---

## Quick links

| Topic | File |
|-------|------|
| C4 + state machine diagram | `docs/architecture.md` |
| ER model | `docs/er-diagram.md` |
| Wireframes | `docs/wireframes.md` |
| Security checklist | `docs/security.md` |
| Concept (as built) | `docs/concept.md` |
