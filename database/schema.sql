-- Minduel Lite database schema
-- Five tables: players, queue_entries, questions, matches, match_rounds

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token UUID NOT NULL,
  display_name VARCHAR(20) NOT NULL,
  avatar_id SMALLINT NOT NULL CHECK (avatar_id BETWEEN 1 AND 12),
  interests SMALLINT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT players_interests_len CHECK (array_length(interests, 1) = 3)
);

CREATE TABLE IF NOT EXISTS queue_entries (
  player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  competition_id SMALLINT NOT NULL CHECK (competition_id BETWEEN 1 AND 100),
  question_number SMALLINT NOT NULL CHECK (question_number BETWEEN 1 AND 10),
  question_text TEXT NOT NULL,
  PRIMARY KEY (competition_id, question_number)
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES players(id),
  player2_id UUID NOT NULL REFERENCES players(id),
  competition_id SMALLINT NOT NULL CHECK (competition_id BETWEEN 1 AND 100),
  current_question SMALLINT NOT NULL DEFAULT 1 CHECK (current_question BETWEEN 1 AND 10),
  phase VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  flag_count SMALLINT NOT NULL DEFAULT 0,
  end_reason VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT matches_phase_check CHECK (
    phase IN ('P1_ANSWER', 'P2_SCORE_P1', 'P2_ANSWER', 'P1_SCORE_P2', 'REVIEW')
  ),
  CONSTRAINT matches_status_check CHECK (status IN ('ACTIVE', 'ENDED')),
  CONSTRAINT matches_end_reason_check CHECK (
    end_reason IS NULL OR end_reason IN ('COMPLETED', 'THREE_FLAGS')
  )
);

CREATE TABLE IF NOT EXISTS match_rounds (
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  question_number SMALLINT NOT NULL CHECK (question_number BETWEEN 1 AND 10),
  player1_answer TEXT,
  player1_score SMALLINT CHECK (player1_score IS NULL OR player1_score BETWEEN 1 AND 10),
  player1_score_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  player1_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  player2_answer TEXT,
  player2_score SMALLINT CHECK (player2_score IS NULL OR player2_score BETWEEN 1 AND 10),
  player2_score_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  player2_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (match_id, question_number)
);

CREATE INDEX IF NOT EXISTS idx_matches_player1 ON matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_matches_player2 ON matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_queue_joined ON queue_entries(joined_at);
