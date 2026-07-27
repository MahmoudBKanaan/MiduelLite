-- =============================================================================
-- Minduel Lite — database/schema.sql
-- MVP tables: players, queue_entries, questions, matches, match_rounds
-- Constraints limited to what the Knowledge Base requires for the MVP.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- players — temporary anonymous sessions
-- Fields: id, session_token, display_name, avatar_id, interests, created_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token   UUID NOT NULL,
  display_name    VARCHAR(20) NOT NULL,
  avatar_id       SMALLINT NOT NULL,
  interests       SMALLINT[] NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT players_avatar_id_range
    CHECK (avatar_id BETWEEN 1 AND 12),
  CONSTRAINT players_interests_exactly_three
    CHECK (array_length(interests, 1) = 3),
  CONSTRAINT players_interests_unique
    CHECK (
      interests[1] IS DISTINCT FROM interests[2]
      AND interests[1] IS DISTINCT FROM interests[3]
      AND interests[2] IS DISTINCT FROM interests[3]
    ),
  CONSTRAINT players_interest_ids_range
    CHECK (
      interests[1] BETWEEN 1 AND 32
      AND interests[2] BETWEEN 1 AND 32
      AND interests[3] BETWEEN 1 AND 32
    )
);

-- -----------------------------------------------------------------------------
-- queue_entries — players waiting for matchmaking
-- Fields: player_id, joined_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_entries (
  player_id  UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- questions — predefined question bank (100 competitions × 10 questions)
-- Fields: competition_id, question_number, question_text
-- Primary key: (competition_id, question_number)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  competition_id   SMALLINT NOT NULL,
  question_number  SMALLINT NOT NULL,
  question_text    TEXT NOT NULL,
  PRIMARY KEY (competition_id, question_number),
  CONSTRAINT questions_competition_id_range
    CHECK (competition_id BETWEEN 1 AND 100),
  CONSTRAINT questions_question_number_range
    CHECK (question_number BETWEEN 1 AND 10)
);

-- -----------------------------------------------------------------------------
-- matches — current and completed match state
-- Fields: id, player1_id, player2_id, competition_id, current_question,
--         phase, status, flag_count, end_reason, created_at, ended_at
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS matches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id         UUID NOT NULL REFERENCES players(id),
  player2_id         UUID NOT NULL REFERENCES players(id),
  competition_id     SMALLINT NOT NULL,
  current_question   SMALLINT NOT NULL DEFAULT 1,
  phase              VARCHAR(20) NOT NULL,
  status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  flag_count         SMALLINT NOT NULL DEFAULT 0,
  end_reason         VARCHAR(20),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at           TIMESTAMPTZ,
  CONSTRAINT matches_players_distinct
    CHECK (player1_id <> player2_id),
  CONSTRAINT matches_competition_id_range
    CHECK (competition_id BETWEEN 1 AND 100),
  CONSTRAINT matches_current_question_range
    CHECK (current_question BETWEEN 1 AND 10),
  CONSTRAINT matches_phase_values
    CHECK (phase IN (
      'P1_ANSWER',
      'P2_SCORE_P1',
      'P2_ANSWER',
      'P1_SCORE_P2',
      'REVIEW'
    )),
  CONSTRAINT matches_status_values
    CHECK (status IN ('ACTIVE', 'ENDED')),
  CONSTRAINT matches_end_reason_values
    CHECK (
      end_reason IS NULL
      OR end_reason IN ('COMPLETED', 'THREE_FLAGS')
    ),
  CONSTRAINT matches_flag_count_non_negative
    CHECK (flag_count >= 0)
);

-- -----------------------------------------------------------------------------
-- match_rounds — one row per played question in a match
-- Primary key: (match_id, question_number)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_rounds (
  match_id                UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  question_number         SMALLINT NOT NULL,
  player1_answer          TEXT,
  player1_score           SMALLINT,
  player1_score_flagged   BOOLEAN NOT NULL DEFAULT FALSE,
  player1_reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  player2_answer          TEXT,
  player2_score           SMALLINT,
  player2_score_flagged   BOOLEAN NOT NULL DEFAULT FALSE,
  player2_reviewed        BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (match_id, question_number),
  CONSTRAINT match_rounds_question_number_range
    CHECK (question_number BETWEEN 1 AND 10),
  CONSTRAINT match_rounds_player1_score_range
    CHECK (player1_score IS NULL OR player1_score BETWEEN 1 AND 10),
  CONSTRAINT match_rounds_player2_score_range
    CHECK (player2_score IS NULL OR player2_score BETWEEN 1 AND 10)
);

-- Helpful indexes for matchmaking and match lookup (not new tables)
CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_queue_joined ON queue_entries(joined_at);
