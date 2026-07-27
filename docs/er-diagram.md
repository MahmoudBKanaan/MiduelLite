# Entity-Relationship Diagram (live-audio MVP)

**Database:** PostgreSQL 16  
**Initialization:** `database/schema.sql` + `database/seed.sql` (Docker entrypoint on new volume)  
**Knowledge Base:** V2.0 — spoken answers; **no** answer TEXT columns

---

## ER diagram

```
+------------------+
|     players      |
+------------------+
| id            PK |  UUID
| session_token    |  UUID (temporary ownership)
| display_name     |  VARCHAR(20)
| avatar_id        |  1–12
| interests        |  SMALLINT[3]  (IDs 1–32, distinct)
| created_at       |
+--------+---------+
         |
         | 1
         | 0..1
         v
+------------------+
|  queue_entries   |
+------------------+
| player_id     PK |----> players.id
| joined_at        |  (tie-break: earliest first)
+------------------+

+------------------+          +------------------+
|     players      |          |     players      |
+--------+---------+          +--------+---------+
         | 1                            | 1
         | as player1                   | as player2
         v                              v
      +--------------------------------------+
      |               matches                |
      +--------------------------------------+
      | id                PK                 |
      | player1_id        FK                 |
      | player2_id        FK                 |
      | competition_id    1–100              |
      | current_question  1–10               |
      | phase             enum string        |
      | status            ACTIVE | ENDED     |
      | player1_flag_count                   |
      | player2_flag_count                   |
      | end_reason        COMPLETED|THREE_FLAGS|null
      | created_at, ended_at                 |
      +------------------+-------------------+
                         | 1
                         | 1..10
                         v
      +--------------------------------------+
      |            match_rounds              |
      +--------------------------------------+
      | match_id          PK,FK              |
      | question_number   PK  (1–10)         |
      | player1_answer_completed  BOOLEAN    |  NOT NULL DEFAULT FALSE
      | player1_score     1–10 or null       |
      | player1_score_flagged   BOOLEAN      |
      | player1_reviewed        BOOLEAN      |
      | player2_answer_completed  BOOLEAN    |  NOT NULL DEFAULT FALSE
      | player2_score     1–10 or null       |
      | player2_score_flagged   BOOLEAN      |
      | player2_reviewed        BOOLEAN      |
      +--------------------------------------+

Added for spoken turns (KB V2.0):
  player1_answer_completed BOOLEAN
  player2_answer_completed BOOLEAN

REMOVED (V1 text-answer model — not in schema):
  player1_answer TEXT
  player2_answer TEXT

NOT in this ER model (by design):
  LiveKit / rooms / tracks  — audio is NOT persisted; LiveKit is outside PostgreSQL
  audio URLs, recordings, transcripts, media metadata tables

+--------------------------------------+
|              questions               |
+--------------------------------------+
| competition_id   PK  (1–100)         |
| question_number  PK  (1–10)          |
| question_text                        |
+--------------------------------------+
        ^
        | logical reference only
        | matches.competition_id +
        | match_rounds.question_number
```

---

## Cardinalities

| Relationship | Cardinality |
|--------------|-------------|
| players → queue_entries | 1 : 0..1 |
| players → matches (as P1 or P2) | 1 : 0..* |
| matches → match_rounds | 1 : 1..10 |
| questions → match (logical) | many questions per competition set |

---

## Spoken answer vs database

| Concept | Persistence |
|---------|-------------|
| Spoken audio | LiveKit only — **not** in PostgreSQL |
| Turn finished | `player1_answer_completed` / `player2_answer_completed` |
| Peer score | `player1_score` / `player2_score` (1–10) |
| Flag / review | `*_score_flagged`, `*_reviewed` |

Score semantics:

- `player1_score` = score **given to Player 1 by Player 2**  
- `player2_score` = score **given to Player 2 by Player 1**  
- Flagged scores excluded from final averages (`calculateResult`)

---

## Seed data

- **100** competition IDs × **10** questions = **1,000** rows in `questions`  
- Static seed only; no question administration UI  
