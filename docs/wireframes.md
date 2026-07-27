# Wireframes — Minduel Lite (live-audio MVP)

Four screens only. Mobile-first layout; content width **max 480px**, centered on desktop.  
Matches the implemented React pages (Knowledge Base V2.0).

---

## Wireframe 1 — Welcome (`/`)

```
┌──────────────────────────────────────┐
│            Minduel Lite              │
│  Live-audio intellectual competition │
│                                      │
│  Display name                        │
│  ┌────────────────────────────────┐  │
│  │ 2–20 characters                │  │
│  └────────────────────────────────┘  │
│                                      │
│  Avatar (choose one of 12 images)    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 1  │ │ 2  │ │ 3  │ │ 4  │         │
│  └────┘ └────┘ └────┘ └────┘         │
│  … (12 total)                        │
│                                      │
│  Choose exactly 3 interests          │
│  [Technology] [AI] [Programming] …   │
│  Selected 3 / 3                      │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         ENTER POOL             │  │
│  └────────────────────────────────┘  │
│  disabled until name+avatar+3 ints   │
└──────────────────────────────────────┘
```

**Built behaviour:** `POST /api/players` → save `playerId`/`sessionToken` → navigate `/pool`.

---

## Wireframe 2 — Pool (`/pool`)

```
┌──────────────────────────────────────┐
│              [avatar]                │
│               Neo                    │
│           Technology                 │
│           Science                    │
│           Philosophy                 │
│                                      │
│            ( spinner )               │
│     Searching for opponent...        │
│                                      │
│  ┌────────────────────────────────┐  │
│  │           Cancel               │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Built behaviour:** `POST /api/pool/join`; poll `GET /api/pool/status` every 1s; on `MATCHED` → `/match/:id`; Cancel → `POST /api/pool/leave` → `/`.

---

## Wireframe 3 — Match (`/match/:matchId`)

Spoken answers only — **no answer textarea**.

```
┌──────────────────────────────────────┐
│ Player 1: Neo      Player 2: Alex    │
│   [av]               [av]            │
│                                      │
│ Question 4 / 10  Your strikes: 1 / 3 │
│                                      │
│  "Should technological progress      │
│   always be considered beneficial?"  │
│                                      │
│  ● Live audio connected    [Mute]    │
│                                      │
│  YOUR TURN TO ANSWER                 │
│  Speak your answer.                  │
│  ┌────────────────────────────────┐  │
│  │       ANSWER COMPLETE          │  │
│  └────────────────────────────────┘  │
│                                      │
│  (Other phases — examples)           │
│  Listener: "Player 1 is answering…"  │
│  Score: speaker finished answering;  │
│         score 1–10 → Submit score    │
│  Review: Accept score | Flag score   │
└──────────────────────────────────────┘
```

**Phases:** P1_ANSWER → P2_SCORE_P1 → P2_ANSWER → P1_SCORE_P2 → REVIEW  

**Built behaviour:**

- One LiveKit room for the match (`match-{matchId}`); not recreated per question  
- Poll `GET /api/matches/:id` ~1s  
- **Answer complete** → `POST .../answer-complete` (empty body; no spoken content uploaded)  
- On `ENDED` → `/result/:id` (audio component unmounts / disconnects)

---

## Wireframe 4 — Result (`/result/:matchId`)

```
┌──────────────────────────────────────┐
│          MATCH COMPLETE              │
│                                      │
│  ┌────────────────────────────────┐  │
│  │    Winner / Result             │  │
│  │           NEO                  │  │
│  └────────────────────────────────┘  │
│                                      │
│     Neo 7.8            Alex 6.9      │
│    [av]               [av]           │
│                                      │
│  Questions completed: 10 / 10        │
│  Neo score strikes: 1                │
│  Alex score strikes: 0               │
│  End reason: Completed               │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         PLAY AGAIN             │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │       RESET PROFILE            │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │            EXIT                │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Built behaviour:**  
- Play again → keep session → `/pool` (new match + new LiveKit room)  
- Reset / Exit → clear `sessionStorage` → `/`  

---

## User journey

```
Welcome → Pool → Match (live audio + spoken turns 1..10 or THREE_FLAGS) → Result
                 ↑_______________________________________________________|
                              Play again (new match / new room)
```
