# Development Process Model

## Selected process

**Iterative-Incremental Development managed with Kanban**

This process is used for the IU DLBSEPPSD01_E oral project report (Software Development) for **Minduel Lite**.

---

## What this means

### Iterative-Incremental Development

The product is built in **small increments**, each producing a usable slice of the system, rather than a single big-bang delivery.

| Phase (increment) | Outcome |
|-------------------|---------|
| Concept | Problem, users, requirements, wireframes, architecture |
| Foundation | Repository, React, Express, PostgreSQL, Docker, health check |
| Profile + matchmaking | Welcome, temporary session, pool, interest matching |
| Match | State machine, scores, flags, completion (originally text turns) |
| Result | Averages, winner, play again / reset |
| Hardening | Tests, documentation, clean Compose startup |
| **LIVE AUDIO** | LiveKit config, token API, MatchAudio, answer-complete, tests, manual mic check |
| Oral report | Screenshots, excerpts, presentation, critical evaluation |

Each increment is **planned → implemented → tested → reflected** before the next major slice grows the system.

### Increment: LIVE AUDIO (KB V2.0)

One clear follow-on increment after the text-answer freeze (`safety/text-answer-mvp`). Scope stays tight — **only**:

| Task | Outcome |
|------|---------|
| LiveKit configuration | Managed Cloud env: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (backend only) |
| Backend token endpoint | `POST /api/matches/:id/audio-token` with session + membership + ACTIVE checks |
| MatchAudio | One LiveKit room per match; CONNECTING / CONNECTED / FAILED; mute/retry |
| answer-complete refactor | Drop answer TEXT; `completeAnswer` + `player*_answer_completed` |
| Tests | Backend audio-token / answer-complete / third-flag; frontend MatchAudio (mocked LiveKit) |
| Manual audio verification | Chrome + Incognito, mic permission, speak both ways when credentials set |

No extra Scrum ceremonies, sprint boards, story points, or parallel process tools — same five Kanban columns only.

### Kanban (flow management)

Work is visualised on a board and pulled left-to-right. There are **no Scrum sprints, daily stand-ups, or story-point ceremonies**, because this is a **solo academic project** with a **fixed MVP**.

---

## Justification

| Reason | Explanation |
|--------|-------------|
| **Solo project** | One developer; team events (sprint planning, retrospectives as meetings) add little value. |
| **Small fixed MVP** | Scope is locked by the **current** Knowledge Base (**V2.0**, live-audio MVP). Kanban tracks flow without inventing new scope beyond that spec. |
| **Short development period** | Continuous pull of ready tasks fits a compressed university timeline better than multi-week sprints. |
| **Minimal administrative overhead** | Five columns and a practical task set; no heavy tool bureaucracy or hundreds of tickets. |

**Why not pure Scrum?** Scrum assumes a product owner, sprint cadence, and team ceremonies. For a single student and a closed MVP, that overhead does not improve delivery.

**Why not pure Waterfall?** Requirements and architecture are documented first (concept), but implementation proceeds in working increments with feedback from local runs and tests—closer to iterative-incremental practice.

---

## Kanban board columns

| Column | Meaning |
|--------|---------|
| **BACKLOG** | Known work not yet prioritised for immediate start |
| **READY** | Next work that can start without blockers |
| **IN PROGRESS** | Currently being implemented (keep WIP low: ideally 1–2 items) |
| **TEST** | Implementation done; automated/manual checks running |
| **DONE** | Accepted against knowledge base / acceptance criteria |

Board location: `docs/kanban-board.md`  
(Optional physical/digital mirror: GitHub Projects, Trello, or a paper board—same five columns.)

---

## Work-in-progress (WIP) guideline

- Prefer **one major feature** in **IN PROGRESS** at a time.  
- Move to **TEST** before starting the next major slice.  
- Do **not** add features outside Knowledge Base **V2.0** (`docs/MinduelLite-Knowledge-Base-KB.txt`).

---

## Definition of Done (practical)

An item may move to **DONE** when:

1. Behaviour matches the Knowledge Base for that slice  
2. Basic manual check or automated test covers the critical path  
3. No secrets or debug clutter left behind  
4. Related docs updated if the slice affects architecture/API  

---

## Process evidence for the oral report

Prepare/retain:

- This process document (selection + justification)  
- Snapshot of the Kanban board (screenshot of `docs/kanban-board.md` or tool board)  
- Increment list (phases above) as a simple progress narrative  

Suggested presentation wording:

> “Development followed an iterative-incremental model managed with Kanban. The MVP was fixed in a knowledge base; work flowed through Backlog → Ready → In Progress → Test → Done. This suited a solo project with a short timeline and minimal process overhead.”
