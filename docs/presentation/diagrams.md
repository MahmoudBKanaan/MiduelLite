# Presentation diagrams (items 199–201)

Use these on slides as text diagrams or export from the HTML files in this folder  
(`c4.html`, `er.html`, `state.html`) — already rendered to PNG in `docs/screenshots/` when captured.

**Student work:** diagrams produced specifically for this project (own work).

---

## 199. C4 Container architecture

```
┌──────────────┐
│    User      │  Web browser (Chrome / Incognito)
└──────┬───────┘
       │ HTTP
       v
┌──────────────┐
│  React SPA   │  Vite · port 5173
│  Frontend    │  4 screens · sessionStorage · 1s polling
└──────┬───────┘
       │ REST/JSON
       │ X-Player-Id · X-Session-Token
       v
┌──────────────┐
│ Node/Express │  port 3001
│  Backend     │  matchmaking · match engine · validation
└──────┬───────┘
       │ Parameterized SQL
       v
┌──────────────┐
│ PostgreSQL   │  port 5432
│  Database    │  5 tables · 1000 questions
└──────────────┘
```

**Talking points:** single backend authority; no microservices; Docker Compose binds the three containers.

---

## 200. ER diagram

```
players 1 ──0..1  queue_entries
   │
   │ 1
   │         ┌── player1
   └──── matches ── player2
            │ 1
            │
            └──1..10── match_rounds

questions (competition_id, question_number)
     └── logical ref from matches.competition_id
         + match_rounds.question_number
```

**Tables:** `players`, `queue_entries`, `questions`, `matches`, `match_rounds`

**Score note:** `player1_score` = score given **to** P1 **by** P2.

---

## 201. User flow + match state

### User flow

```
Welcome  →  Pool  →  Match  →  Result
   │           │        │         │
   │           │        │         ├── Play again → Pool
   │           │        │         └── Reset/Exit → Welcome
   │           │        │
   │           │        └── poll 1s / phases
   │           └── join + poll until MATCHED
   └── POST /api/players
```

### Match state machine

```
P1_ANSWER → P2_SCORE_P1 → P2_ANSWER → P1_SCORE_P2 → REVIEW
                                                      │
                         ┌────────────────────────────┤
                         │                            │
                    flags ≥ 3                    question = 10
                         │                            │
                         v                            v
                   ENDED THREE_FLAGS            ENDED COMPLETED
                         │
                    else: next question → P1_ANSWER
```

### Matchmaking (one line for a slide)

```
similarity = sharedInterestCount / 3
Priority: 3 → 2 → 1 shared; 0 = no match
```
