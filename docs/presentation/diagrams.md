# Presentation diagrams (C4, ER, state)

Export from HTML in this folder (`c4.html`, `er.html`, `state.html`) → PNGs in `docs/screenshots/`.

**Student work:** diagrams for this project (own work). Keep simple — no WebRTC infrastructure mesh.

---

## C4 Container architecture (with LiveKit)

```
User (browser + mic)
  │ HTTP
  v
React SPA  ──────── live microphone audio ────► LiveKit (external Cloud)
  │ REST/JSON                                 ▲
  │ audio-token request                         │
  v                                             │ signed JWT token
Express ───────────────────────────────────────┘
  │ SQL
  v
PostgreSQL
```

Compose services only: frontend · backend · database.

---

## ER (spoken turns — no LiveKit tables)

```
match_rounds:
  player1_answer_completed BOOLEAN
  player2_answer_completed BOOLEAN
  (+ scores / flags / reviews)

REMOVED: player1_answer TEXT, player2_answer TEXT
```

LiveKit is **not** in the ER diagram (audio not persisted).

---

## Match state wording (spoken)

```
P1 SPEAKS
  → ANSWER COMPLETE
  → P2 SCORES
  → P2 SPEAKS
  → ANSWER COMPLETE
  → P1 SCORES
  → REVIEW
```
