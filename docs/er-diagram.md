# Entity-Relationship Diagram (final)

**Database:** PostgreSQL 16  
**Initialization:** `database/schema.sql` + `database/seed.sql` (Docker entrypoint on new volume)

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
      | flag_count                           |
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
      | player1_answer                       |
      | player1_score     1–10 or null       |
      | player1_score_flagged                |
      | player1_reviewed                     |
      | player2_answer                       |
      | player2_score     1–10 or null       |
      | player2_score_flagged                |
      | player2_reviewed                     |
      +--------------------------------------+

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

## Score semantics

- `player1_score` = score **given to Player 1 by Player 2**  
- `player2_score` = score **given to Player 2 by Player 1**  
- Flagged scores are excluded from final averages (`calculateResult`)

---

## Seed data

- **100** competition IDs × **10** questions = **1,000** rows in `questions`  
- Static seed only; no question administration UI  
