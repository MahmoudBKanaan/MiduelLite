-- Upgrade an existing V2.0 development database from one combined flag counter
-- to independent counters for Player 1 and Player 2.
--
-- Existing combined counts cannot be assigned safely to either player, so this
-- development-only migration resets both personal counts to zero.

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS player1_flag_count SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_flag_count SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_flag_count_non_negative,
  DROP COLUMN IF EXISTS flag_count;

ALTER TABLE matches
  DROP CONSTRAINT IF EXISTS matches_player1_flag_count_range,
  DROP CONSTRAINT IF EXISTS matches_player2_flag_count_range,
  ADD CONSTRAINT matches_player1_flag_count_range
    CHECK (player1_flag_count BETWEEN 0 AND 3),
  ADD CONSTRAINT matches_player2_flag_count_range
    CHECK (player2_flag_count BETWEEN 0 AND 3);
