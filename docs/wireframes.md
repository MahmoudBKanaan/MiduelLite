# Wireframes — Minduel Lite (final)

Four screens only. Mobile-first layout; content width **max 480px**, centered on desktop.  
Matches the implemented React pages.

---

## Wireframe 1 — Welcome (`/`)

```
┌──────────────────────────────────────┐
│            Minduel Lite              │
│  Anonymous intellectual competition  │
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
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 5  │ │ 6  │ │ 7  │ │ 8  │         │
│  └────┘ └────┘ └────┘ └────┘         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │ 9  │ │10  │ │11  │ │12  │         │
│  └────┘ └────┘ └────┘ └────┘         │
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

```
┌──────────────────────────────────────┐
│ Player 1: Neo      Player 2: Alex    │
│   [av]               [av]            │
│                                      │
│  Question 4 / 10      Flags: 1 / 3   │
│                                      │
│  "Should technological progress      │
│   always be considered beneficial?"  │
│                                      │
│  (UI depends on phase + role)        │
│                                      │
│  Example P2_SCORE_P1 for Player 2:   │
│  Player 1's answer:                  │
│  ┌────────────────────────────────┐  │
│  │ Progress improves access…      │  │
│  └────────────────────────────────┘  │
│  [1][2][3][4][5]                     │
│  [6][7][8][9][10]                    │
│  [        Submit score        ]      │
│                                      │
│  or waiting spinner / answer box /   │
│  Accept score | Flag score           │
└──────────────────────────────────────┘
```

**Phases:** P1_ANSWER → P2_SCORE_P1 → P2_ANSWER → P1_SCORE_P2 → REVIEW  
**Built behaviour:** poll match state every 1s; on `ENDED` → `/result/:id`.

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
│  Flags: 1                            │
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
- Play again → keep session → `/pool`  
- Reset / Exit → clear `sessionStorage` → `/`  

---

## User journey

```
Welcome → Pool → Match (questions 1..10 or early THREE_FLAGS) → Result
                 ↑______________________________________________|
                              Play again
```
