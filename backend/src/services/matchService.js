import { query, getClient } from '../db.js';

/**
 * Load match and verify the requesting player is a participant.
 */
async function loadMatch(matchId) {
  const res = await query('SELECT * FROM matches WHERE id = $1', [matchId]);
  if (res.rowCount === 0) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

function roleOf(match, playerId) {
  if (match.player1_id === playerId) return 'PLAYER_1';
  if (match.player2_id === playerId) return 'PLAYER_2';
  return null;
}

/**
 * Build player-facing match state.
 */
export async function getMatchState(matchId, playerId) {
  const match = await loadMatch(matchId);
  const role = roleOf(match, playerId);
  if (!role) {
    const err = new Error('Not a participant in this match');
    err.status = 403;
    throw err;
  }

  const players = await query(
    `SELECT id, display_name, avatar_id, interests FROM players WHERE id = ANY($1::uuid[])`,
    [[match.player1_id, match.player2_id]]
  );
  const p1 = players.rows.find((p) => p.id === match.player1_id);
  const p2 = players.rows.find((p) => p.id === match.player2_id);

  let questionText = null;
  if (match.status === 'ACTIVE') {
    const q = await query(
      `SELECT question_text FROM questions
       WHERE competition_id = $1 AND question_number = $2`,
      [match.competition_id, match.current_question]
    );
    questionText = q.rows[0]?.question_text ?? null;
  }

  const roundRes = await query(
    `SELECT * FROM match_rounds WHERE match_id = $1 AND question_number = $2`,
    [matchId, match.current_question]
  );
  const round = roundRes.rows[0] || null;

  // Visibility rules: answers/scores only when appropriate for phase/role
  let visible = {
    player1Answer: null,
    player2Answer: null,
    player1Score: null,
    player2Score: null,
    player1Reviewed: null,
    player2Reviewed: null,
    ownReceivedScore: null,
    ownReviewDone: false,
  };

  if (round) {
    const phase = match.phase;
    if (
      phase === 'P2_SCORE_P1' ||
      phase === 'P2_ANSWER' ||
      phase === 'P1_SCORE_P2' ||
      phase === 'REVIEW' ||
      match.status === 'ENDED'
    ) {
      visible.player1Answer = round.player1_answer;
    }
    if (phase === 'P1_SCORE_P2' || phase === 'REVIEW' || match.status === 'ENDED') {
      visible.player2Answer = round.player2_answer;
    }
    if (phase === 'REVIEW' || match.status === 'ENDED') {
      visible.player1Score = round.player1_score;
      visible.player2Score = round.player2_score;
      visible.player1Reviewed = round.player1_reviewed;
      visible.player2Reviewed = round.player2_reviewed;
    }
    // Scorer always sees the answer they must score
    if (phase === 'P2_SCORE_P1') {
      visible.player1Answer = round.player1_answer;
    }
    if (phase === 'P1_SCORE_P2') {
      visible.player2Answer = round.player2_answer;
    }
    // Own received score during review
    if (phase === 'REVIEW') {
      if (role === 'PLAYER_1') {
        visible.ownReceivedScore = round.player1_score;
        visible.ownReviewDone = round.player1_reviewed;
      } else {
        visible.ownReceivedScore = round.player2_score;
        visible.ownReviewDone = round.player2_reviewed;
      }
    }
  }

  return {
    matchId: match.id,
    status: match.status,
    phase: match.phase,
    currentQuestion: match.current_question,
    questionText,
    flagCount: match.flag_count,
    endReason: match.end_reason,
    role,
    player1: {
      id: p1.id,
      displayName: p1.display_name,
      avatarId: p1.avatar_id,
    },
    player2: {
      id: p2.id,
      displayName: p2.display_name,
      avatarId: p2.avatar_id,
    },
    ...visible,
  };
}

/**
 * Submit an answer for the current player's turn.
 */
export async function submitAnswer(matchId, playerId, answer) {
  if (typeof answer !== 'string') {
    const err = new Error('Answer must be a string');
    err.status = 400;
    throw err;
  }
  const trimmed = answer.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    const err = new Error('Answer must be 1–500 characters');
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const mRes = await client.query(
      'SELECT * FROM matches WHERE id = $1 FOR UPDATE',
      [matchId]
    );
    if (mRes.rowCount === 0) {
      const err = new Error('Match not found');
      err.status = 404;
      throw err;
    }
    const match = mRes.rows[0];
    if (match.status !== 'ACTIVE') {
      const err = new Error('Match is not active');
      err.status = 409;
      throw err;
    }
    const role = roleOf(match, playerId);
    if (!role) {
      const err = new Error('Not a participant');
      err.status = 403;
      throw err;
    }

    if (match.phase === 'P1_ANSWER' && role === 'PLAYER_1') {
      const r = await client.query(
        `SELECT player1_answer FROM match_rounds
         WHERE match_id = $1 AND question_number = $2 FOR UPDATE`,
        [matchId, match.current_question]
      );
      if (r.rows[0]?.player1_answer) {
        const err = new Error('Answer already submitted');
        err.status = 409;
        throw err;
      }
      await client.query(
        `UPDATE match_rounds SET player1_answer = $1
         WHERE match_id = $2 AND question_number = $3`,
        [trimmed, matchId, match.current_question]
      );
      await client.query(
        `UPDATE matches SET phase = 'P2_SCORE_P1' WHERE id = $1`,
        [matchId]
      );
    } else if (match.phase === 'P2_ANSWER' && role === 'PLAYER_2') {
      const r = await client.query(
        `SELECT player2_answer FROM match_rounds
         WHERE match_id = $1 AND question_number = $2 FOR UPDATE`,
        [matchId, match.current_question]
      );
      if (r.rows[0]?.player2_answer) {
        const err = new Error('Answer already submitted');
        err.status = 409;
        throw err;
      }
      await client.query(
        `UPDATE match_rounds SET player2_answer = $1
         WHERE match_id = $2 AND question_number = $3`,
        [trimmed, matchId, match.current_question]
      );
      await client.query(
        `UPDATE matches SET phase = 'P1_SCORE_P2' WHERE id = $1`,
        [matchId]
      );
    } else {
      const err = new Error('Action not permitted in current phase');
      err.status = 403;
      throw err;
    }

    await client.query('COMMIT');
    return getMatchState(matchId, playerId);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Submit a peer score (1–10).
 */
export async function submitScore(matchId, playerId, score) {
  const n = Number(score);
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    const err = new Error('Score must be an integer from 1 to 10');
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const mRes = await client.query(
      'SELECT * FROM matches WHERE id = $1 FOR UPDATE',
      [matchId]
    );
    if (mRes.rowCount === 0) {
      const err = new Error('Match not found');
      err.status = 404;
      throw err;
    }
    const match = mRes.rows[0];
    if (match.status !== 'ACTIVE') {
      const err = new Error('Match is not active');
      err.status = 409;
      throw err;
    }
    const role = roleOf(match, playerId);
    if (!role) {
      const err = new Error('Not a participant');
      err.status = 403;
      throw err;
    }

    if (match.phase === 'P2_SCORE_P1' && role === 'PLAYER_2') {
      const r = await client.query(
        `SELECT player1_score FROM match_rounds
         WHERE match_id = $1 AND question_number = $2 FOR UPDATE`,
        [matchId, match.current_question]
      );
      if (r.rows[0]?.player1_score != null) {
        const err = new Error('Score already submitted');
        err.status = 409;
        throw err;
      }
      await client.query(
        `UPDATE match_rounds SET player1_score = $1
         WHERE match_id = $2 AND question_number = $3`,
        [n, matchId, match.current_question]
      );
      await client.query(
        `UPDATE matches SET phase = 'P2_ANSWER' WHERE id = $1`,
        [matchId]
      );
    } else if (match.phase === 'P1_SCORE_P2' && role === 'PLAYER_1') {
      const r = await client.query(
        `SELECT player2_score FROM match_rounds
         WHERE match_id = $1 AND question_number = $2 FOR UPDATE`,
        [matchId, match.current_question]
      );
      if (r.rows[0]?.player2_score != null) {
        const err = new Error('Score already submitted');
        err.status = 409;
        throw err;
      }
      await client.query(
        `UPDATE match_rounds SET player2_score = $1
         WHERE match_id = $2 AND question_number = $3`,
        [n, matchId, match.current_question]
      );
      await client.query(
        `UPDATE matches SET phase = 'REVIEW' WHERE id = $1`,
        [matchId]
      );
    } else {
      const err = new Error('Action not permitted in current phase');
      err.status = 403;
      throw err;
    }

    await client.query('COMMIT');
    return getMatchState(matchId, playerId);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Review received score: accept (flag=false) or flag (flag=true).
 * After both reviews, advance, complete, or three-flag terminate.
 */
export async function submitReview(matchId, playerId, flag) {
  if (typeof flag !== 'boolean') {
    const err = new Error('flag must be a boolean');
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const mRes = await client.query(
      'SELECT * FROM matches WHERE id = $1 FOR UPDATE',
      [matchId]
    );
    if (mRes.rowCount === 0) {
      const err = new Error('Match not found');
      err.status = 404;
      throw err;
    }
    const match = mRes.rows[0];
    if (match.status !== 'ACTIVE') {
      const err = new Error('Match is not active');
      err.status = 409;
      throw err;
    }
    if (match.phase !== 'REVIEW') {
      const err = new Error('Action not permitted in current phase');
      err.status = 403;
      throw err;
    }
    const role = roleOf(match, playerId);
    if (!role) {
      const err = new Error('Not a participant');
      err.status = 403;
      throw err;
    }

    const rRes = await client.query(
      `SELECT * FROM match_rounds
       WHERE match_id = $1 AND question_number = $2 FOR UPDATE`,
      [matchId, match.current_question]
    );
    const round = rRes.rows[0];

    if (role === 'PLAYER_1') {
      if (round.player1_reviewed) {
        const err = new Error('Review already submitted');
        err.status = 409;
        throw err;
      }
      await client.query(
        `UPDATE match_rounds
         SET player1_reviewed = TRUE, player1_score_flagged = $1
         WHERE match_id = $2 AND question_number = $3`,
        [flag, matchId, match.current_question]
      );
    } else {
      if (round.player2_reviewed) {
        const err = new Error('Review already submitted');
        err.status = 409;
        throw err;
      }
      await client.query(
        `UPDATE match_rounds
         SET player2_reviewed = TRUE, player2_score_flagged = $1
         WHERE match_id = $2 AND question_number = $3`,
        [flag, matchId, match.current_question]
      );
    }

    if (flag) {
      await client.query(
        `UPDATE matches SET flag_count = flag_count + 1 WHERE id = $1`,
        [matchId]
      );
    }

    const updated = await client.query(
      'SELECT * FROM matches WHERE id = $1',
      [matchId]
    );
    const m = updated.rows[0];
    const r2 = await client.query(
      `SELECT player1_reviewed, player2_reviewed FROM match_rounds
       WHERE match_id = $1 AND question_number = $2`,
      [matchId, match.current_question]
    );
    const both =
      r2.rows[0].player1_reviewed && r2.rows[0].player2_reviewed;

    if (both) {
      if (m.flag_count >= 3) {
        await client.query(
          `UPDATE matches
           SET status = 'ENDED', end_reason = 'THREE_FLAGS', ended_at = NOW()
           WHERE id = $1`,
          [matchId]
        );
      } else if (m.current_question >= 10) {
        await client.query(
          `UPDATE matches
           SET status = 'ENDED', end_reason = 'COMPLETED', ended_at = NOW()
           WHERE id = $1`,
          [matchId]
        );
      } else {
        const nextQ = m.current_question + 1;
        await client.query(
          `UPDATE matches
           SET current_question = $1, phase = 'P1_ANSWER'
           WHERE id = $2`,
          [nextQ, matchId]
        );
        await client.query(
          `INSERT INTO match_rounds (match_id, question_number) VALUES ($1, $2)`,
          [matchId, nextQ]
        );
      }
    }

    await client.query('COMMIT');
    return getMatchState(matchId, playerId);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Calculate final result excluding flagged scores.
 * Averages rounded to 1 decimal place.
 */
export async function calculateResult(matchId, playerId) {
  const match = await loadMatch(matchId);
  const role = roleOf(match, playerId);
  if (!role) {
    const err = new Error('Not a participant');
    err.status = 403;
    throw err;
  }
  if (match.status !== 'ENDED') {
    const err = new Error('Match is not finished');
    err.status = 409;
    throw err;
  }

  const players = await query(
    `SELECT id, display_name, avatar_id FROM players WHERE id = ANY($1::uuid[])`,
    [[match.player1_id, match.player2_id]]
  );
  const p1 = players.rows.find((p) => p.id === match.player1_id);
  const p2 = players.rows.find((p) => p.id === match.player2_id);

  const rounds = await query(
    `SELECT * FROM match_rounds WHERE match_id = $1 ORDER BY question_number`,
    [matchId]
  );

  const p1Scores = [];
  const p2Scores = [];
  for (const r of rounds.rows) {
    if (r.player1_score != null && !r.player1_score_flagged) {
      p1Scores.push(r.player1_score);
    }
    if (r.player2_score != null && !r.player2_score_flagged) {
      p2Scores.push(r.player2_score);
    }
  }

  const avg = (arr) => {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return Math.round((sum / arr.length) * 10) / 10;
  };

  const player1Final = avg(p1Scores);
  const player2Final = avg(p2Scores);
  let winner = 'DRAW';
  if (player1Final > player2Final) winner = 'PLAYER_1';
  else if (player2Final > player1Final) winner = 'PLAYER_2';

  return {
    matchId,
    player1: {
      displayName: p1.display_name,
      avatarId: p1.avatar_id,
      finalScore: player1Final,
    },
    player2: {
      displayName: p2.display_name,
      avatarId: p2.avatar_id,
      finalScore: player2Final,
    },
    winner,
    questionsCompleted: rounds.rowCount,
    flagCount: match.flag_count,
    endReason: match.end_reason,
  };
}
