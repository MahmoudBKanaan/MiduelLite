import { query, getClient } from '../db.js';

/**
 * Authoritative turn order for each question.
 * P1_ANSWER → P2_SCORE_P1 → P2_ANSWER → P1_SCORE_P2 → REVIEW
 */
export const MATCH_PHASES = [
  'P1_ANSWER',
  'P2_SCORE_P1',
  'P2_ANSWER',
  'P1_SCORE_P2',
  'REVIEW',
];

/**
 * Validate answer text: length 1–500 after trim.
 * @returns {{ ok: true, answer: string } | { ok: false, error: string }}
 */
export function validateAnswerText(answer) {
  if (typeof answer !== 'string') {
    return { ok: false, error: 'Answer must be a string' };
  }
  const trimmed = answer.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    return { ok: false, error: 'Answer must be 1–500 characters' };
  }
  return { ok: true, answer: trimmed };
}

/**
 * Validate peer score: integer 1–10.
 * @returns {{ ok: true, score: number } | { ok: false, error: string }}
 */
export function validateScoreValue(score) {
  const n = Number(score);
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    return { ok: false, error: 'Score must be an integer from 1 to 10' };
  }
  return { ok: true, score: n };
}

async function loadMatch(matchId) {
  const res = await query('SELECT * FROM matches WHERE id = $1', [matchId]);
  if (res.rowCount === 0) {
    const err = new Error('Match not found');
    err.status = 404;
    throw err;
  }
  return res.rows[0];
}

export function roleOf(match, playerId) {
  const id = String(playerId);
  if (String(match.player1_id) === id) return 'PLAYER_1';
  if (String(match.player2_id) === id) return 'PLAYER_2';
  return null;
}

/**
 * GET match state for the current player (items 45–46).
 * Includes names, avatars, role, question, phase, relevant answers/scores, flags, status.
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
  const p1 = players.rows.find((p) => String(p.id) === String(match.player1_id));
  const p2 = players.rows.find((p) => String(p.id) === String(match.player2_id));

  // Current question text while match is active (and last question when ended)
  let questionText = null;
  const q = await query(
    `SELECT question_text FROM questions
     WHERE competition_id = $1 AND question_number = $2`,
    [match.competition_id, match.current_question]
  );
  questionText = q.rows[0]?.question_text ?? null;

  const roundRes = await query(
    `SELECT * FROM match_rounds WHERE match_id = $1 AND question_number = $2`,
    [matchId, match.current_question]
  );
  const round = roundRes.rows[0] || null;

  // Relevant answer / score visibility by phase
  const visible = {
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
    const ended = match.status === 'ENDED';

    // Player 1 may always see own answer after submit; opponent sees it from scoring onward
    if (
      role === 'PLAYER_1' ||
      phase === 'P2_SCORE_P1' ||
      phase === 'P2_ANSWER' ||
      phase === 'P1_SCORE_P2' ||
      phase === 'REVIEW' ||
      ended
    ) {
      visible.player1Answer = round.player1_answer;
    }

    // Player 2 answer visible to scorer / review / end; P2 sees own after submit
    if (
      role === 'PLAYER_2' ||
      phase === 'P1_SCORE_P2' ||
      phase === 'REVIEW' ||
      ended
    ) {
      visible.player2Answer = round.player2_answer;
    }

    if (phase === 'REVIEW' || ended) {
      visible.player1Score = round.player1_score;
      visible.player2Score = round.player2_score;
      visible.player1Reviewed = round.player1_reviewed;
      visible.player2Reviewed = round.player2_reviewed;
    }

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
 * POST answer — items 48–50.
 * P1_ANSWER (P1) → P2_SCORE_P1
 * P2_ANSWER (P2) → P1_SCORE_P2
 */
export async function submitAnswer(matchId, playerId, answer) {
  const validated = validateAnswerText(answer);
  if (!validated.ok) {
    const err = new Error(validated.error);
    err.status = 400;
    throw err;
  }
  const trimmed = validated.answer;

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
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

/**
 * POST score — items 51–52 (+ phase advance).
 * P2_SCORE_P1 (P2) → P2_ANSWER
 * P1_SCORE_P2 (P1) → REVIEW
 */
export async function submitScore(matchId, playerId, score) {
  const validated = validateScoreValue(score);
  if (!validated.ok) {
    const err = new Error(validated.error);
    err.status = 400;
    throw err;
  }
  const n = validated.score;

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
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Parse review action (item 58).
 * ACCEPT → flag=false; FLAG → flag=true.
 * Also accepts boolean body.flag as used by the API.
 *
 * @returns {{ ok: true, flag: boolean } | { ok: false, error: string }}
 */
export function parseReviewAction(body) {
  if (body == null || typeof body !== 'object') {
    return { ok: false, error: 'Review body is required' };
  }
  if (typeof body.flag === 'boolean') {
    return { ok: true, flag: body.flag };
  }
  if (typeof body.action === 'string') {
    const action = body.action.toUpperCase();
    if (action === 'ACCEPT') return { ok: true, flag: false };
    if (action === 'FLAG') return { ok: true, flag: true };
  }
  return {
    ok: false,
    error: 'Review must be ACCEPT (flag:false) or FLAG (flag:true)',
  };
}

/**
 * Pure decision for what happens after both players finish REVIEW.
 *
 * @param {number} flagCount - combined flagged scores so far
 * @param {number} currentQuestion - question number just completed (1–10)
 * @returns {{ type: 'THREE_FLAGS' } | { type: 'COMPLETED' } | { type: 'NEXT', nextQuestion: number }}
 */
export function resolveAfterBothReviews(flagCount, currentQuestion) {
  if (flagCount >= 3) {
    return { type: 'THREE_FLAGS' };
  }
  if (currentQuestion >= 10) {
    return { type: 'COMPLETED' };
  }
  return { type: 'NEXT', nextQuestion: currentQuestion + 1 };
}

/**
 * Apply post-REVIEW progression inside an open transaction:
 * end by THREE_FLAGS / COMPLETED, or advance to the next question (P1_ANSWER).
 *
 * @param {import('pg').PoolClient} client
 * @param {string} matchId
 * @param {number} flagCount
 * @param {number} currentQuestion
 */
export async function advanceMatch(client, matchId, flagCount, currentQuestion) {
  const decision = resolveAfterBothReviews(flagCount, currentQuestion);
  if (decision.type === 'THREE_FLAGS') {
    await client.query(
      `UPDATE matches
       SET status = 'ENDED', end_reason = 'THREE_FLAGS', ended_at = NOW()
       WHERE id = $1`,
      [matchId]
    );
    return decision;
  }
  if (decision.type === 'COMPLETED') {
    await client.query(
      `UPDATE matches
       SET status = 'ENDED', end_reason = 'COMPLETED', ended_at = NOW()
       WHERE id = $1`,
      [matchId]
    );
    return decision;
  }
  await client.query(
    `UPDATE matches
     SET current_question = $1, phase = 'P1_ANSWER'
     WHERE id = $2`,
    [decision.nextQuestion, matchId]
  );
  await client.query(
    `INSERT INTO match_rounds (match_id, question_number) VALUES ($1, $2)`,
    [matchId, decision.nextQuestion]
  );
  return decision;
}

/**
 * POST review — items 56–61.
 *
 * Each player reviews only their own received score.
 * Actions: ACCEPT (flag=false) or FLAG (flag=true).
 * FLAG marks the score flagged and increments match.flag_count.
 * Reviews are immutable once submitted.
 *
 * After both reviews:
 *   flag_count >= 3 → ENDED / THREE_FLAGS
 *   current_question = 10 → ENDED / COMPLETED
 *   else → next question, phase = P1_ANSWER
 *
 * Phase transitions already enforced by submitScore (items 53–55):
 *   P2_SCORE_P1 → P2_ANSWER → P1_SCORE_P2 → REVIEW
 */
export async function submitReview(matchId, playerId, flagOrBody) {
  // Accept boolean flag or full body { flag } / { action }
  let flag;
  if (typeof flagOrBody === 'boolean') {
    flag = flagOrBody;
  } else {
    const parsed = parseReviewAction(flagOrBody);
    if (!parsed.ok) {
      const err = new Error(parsed.error);
      err.status = 400;
      throw err;
    }
    flag = parsed.flag;
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
    if (!round) {
      const err = new Error('Round not found');
      err.status = 404;
      throw err;
    }

    // Each player reviews only their own received score (item 57)
    // Player 1 reviews player1_score (given by P2); Player 2 reviews player2_score (given by P1)
    if (role === 'PLAYER_1') {
      if (round.player1_reviewed) {
        // Immutable (item 60)
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

    // FLAG → mark flagged (above) and increment match.flag_count (item 59)
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
      await advanceMatch(client, matchId, m.flag_count, m.current_question);
    }

    await client.query('COMMIT');
    return getMatchState(matchId, playerId);
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Average of scores, rounded to one decimal place. Empty list → 0.
 * @param {number[]} scores
 * @returns {number}
 */
export function averageScore(scores) {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + Number(b), 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

/**
 * Collect non-flagged peer scores from match_rounds rows.
 * player1_score = score given TO player 1 BY player 2 (and vice versa).
 */
export function collectValidScores(rounds) {
  const player1Scores = [];
  const player2Scores = [];
  for (const r of rounds || []) {
    if (r.player1_score != null && r.player1_score_flagged !== true) {
      player1Scores.push(Number(r.player1_score));
    }
    if (r.player2_score != null && r.player2_score_flagged !== true) {
      player2Scores.push(Number(r.player2_score));
    }
  }
  return { player1Scores, player2Scores };
}

/**
 * @returns {'PLAYER_1'|'PLAYER_2'|'DRAW'}
 */
export function determineWinner(player1Final, player2Final) {
  if (player1Final > player2Final) return 'PLAYER_1';
  if (player2Final > player1Final) return 'PLAYER_2';
  return 'DRAW';
}

/**
 * Compute final averages, winner, and questions completed from round rows.
 */
export function computeFinalScores(rounds) {
  const { player1Scores, player2Scores } = collectValidScores(rounds);
  const player1Final = averageScore(player1Scores);
  const player2Final = averageScore(player2Scores);
  return {
    player1Final,
    player2Final,
    winner: determineWinner(player1Final, player2Final),
    questionsCompleted: (rounds || []).length,
  };
}

/**
 * Build the result payload for an ENDED match.
 * Averages only non-flagged scores; rounds to 1 decimal; winner or DRAW.
 *
 * @param {string} matchId
 * @param {string} playerId - requesting participant (session-validated)
 * @returns {Promise<object>} player names/avatars/scores, winner, flags, endReason
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
  const p1 = players.rows.find(
    (p) => String(p.id) === String(match.player1_id)
  );
  const p2 = players.rows.find(
    (p) => String(p.id) === String(match.player2_id)
  );

  const rounds = await query(
    `SELECT * FROM match_rounds WHERE match_id = $1 ORDER BY question_number`,
    [matchId]
  );

  const { player1Final, player2Final, winner, questionsCompleted } =
    computeFinalScores(rounds.rows);

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
    questionsCompleted,
    flagCount: match.flag_count,
    endReason: match.end_reason,
  };
}
