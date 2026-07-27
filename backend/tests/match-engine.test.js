import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import {
  MATCH_PHASES,
  validateScoreValue,
} from '../src/services/matchService.js';
import { resetMatchmakingState } from './helpers.js';
import { query } from '../src/db.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

describe('match phases', () => {
  it('defines the exact phase sequence', () => {
    expect(MATCH_PHASES).toEqual([
      'P1_ANSWER',
      'P2_SCORE_P1',
      'P2_ANSWER',
      'P1_SCORE_P2',
      'REVIEW',
    ]);
  });
});

describe('validateScoreValue', () => {
  it('accepts integers 1–10', () => {
    expect(validateScoreValue(1).ok).toBe(true);
    expect(validateScoreValue(10).ok).toBe(true);
    expect(validateScoreValue(8).score).toBe(8);
  });

  it('rejects non-integers and out of range', () => {
    expect(validateScoreValue(0).ok).toBe(false);
    expect(validateScoreValue(11).ok).toBe(false);
    expect(validateScoreValue(3.5).ok).toBe(false);
    expect(validateScoreValue('x').ok).toBe(false);
  });
});

async function createPlayer(body) {
  return request(app).post('/api/players').send(body);
}

function hdr(res) {
  return {
    'X-Player-Id': res.body.playerId,
    'X-Session-Token': res.body.sessionToken,
  };
}

async function startMatch() {
  const a = await createPlayer({
    displayName: 'P1eng',
    avatarId: 1,
    interestIds: [1, 2, 3],
  });
  const b = await createPlayer({
    displayName: 'P2eng',
    avatarId: 2,
    interestIds: [1, 2, 4],
  });
  await request(app).post('/api/pool/join').set(hdr(a));
  const m = await request(app).post('/api/pool/join').set(hdr(b));
  return { a, b, matchId: m.body.matchId };
}

/** Reach P2_ANSWER: P1 complete → P2 score. */
async function reachP2Answer(a, b, matchId) {
  await request(app)
    .post(`/api/matches/${matchId}/answer-complete`)
    .set(hdr(a))
    .send({});
  await request(app)
    .post(`/api/matches/${matchId}/score`)
    .set(hdr(b))
    .send({ score: 8 });
}

/** Reach REVIEW for current question. */
async function reachReview(a, b, matchId) {
  await reachP2Answer(a, b, matchId);
  await request(app)
    .post(`/api/matches/${matchId}/answer-complete`)
    .set(hdr(b))
    .send({});
  await request(app)
    .post(`/api/matches/${matchId}/score`)
    .set(hdr(a))
    .send({ score: 7 });
}

describe.skipIf(!hasDb)('spoken answer-complete flow', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('GET match returns names, role, question, phase, flags, status (no answer text)', async () => {
    const { a, b, matchId } = await startMatch();
    const res = await request(app).get(`/api/matches/${matchId}`).set(hdr(a));
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('PLAYER_1');
    expect(res.body.player1.displayName).toBe('P1eng');
    expect(res.body.player2.displayName).toBe('P2eng');
    expect(res.body.phase).toBe('P1_ANSWER');
    expect(res.body.player1AnswerCompleted).toBe(false);
    expect(res.body.player2AnswerCompleted).toBe(false);
    expect(res.body).not.toHaveProperty('player1Answer');
    expect(res.body).not.toHaveProperty('player2Answer');

    const res2 = await request(app).get(`/api/matches/${matchId}`).set(hdr(b));
    expect(res2.body.role).toBe('PLAYER_2');
  });

  it('Player 1 can complete an answer during P1_ANSWER and transitions to P2_SCORE_P1', async () => {
    const { a, matchId } = await startMatch();
    const ok = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    expect(ok.status).toBe(200);
    expect(ok.body.phase).toBe('P2_SCORE_P1');
    expect(ok.body.player1AnswerCompleted).toBe(true);
  });

  it('Player 2 cannot complete Player 1 answer during P1_ANSWER', async () => {
    const { b, matchId } = await startMatch();
    const bad = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(b))
      .send({});
    expect(bad.status).toBe(403);
    expect(bad.body.error).toMatch(/not permitted|phase/i);
  });

  it('rejects duplicate answer completion', async () => {
    const { a, matchId } = await startMatch();
    const first = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    expect(first.status).toBe(200);
    expect(first.body.phase).toBe('P2_SCORE_P1');

    const twice = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    // Wrong phase after first complete (or 409 if still same phase somehow)
    expect([403, 409]).toContain(twice.status);
  });

  it('Player 2 can complete an answer during P2_ANSWER and transitions to P1_SCORE_P2', async () => {
    const { a, b, matchId } = await startMatch();
    await reachP2Answer(a, b, matchId);

    const pre = await request(app).get(`/api/matches/${matchId}`).set(hdr(b));
    expect(pre.body.phase).toBe('P2_ANSWER');

    const ok = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(b))
      .send({});
    expect(ok.status).toBe(200);
    expect(ok.body.phase).toBe('P1_SCORE_P2');
    expect(ok.body.player2AnswerCompleted).toBe(true);
  });

  it('Player 1 cannot complete during P2_ANSWER', async () => {
    const { a, b, matchId } = await startMatch();
    await reachP2Answer(a, b, matchId);

    const bad = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    expect(bad.status).toBe(403);
  });

  it('score outside 1–10 rejected; valid score advances to P2_ANSWER', async () => {
    const { a, b, matchId } = await startMatch();
    await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});

    const bad = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 11 });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 8 });
    expect(ok.status).toBe(200);
    expect(ok.body.phase).toBe('P2_ANSWER');
  });

  it('old POST /answer route is removed', async () => {
    const { a, matchId } = await startMatch();
    const res = await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({});
    expect(res.status).toBe(404);
  });
});

describe.skipIf(!hasDb)('per-player three-flag termination', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('mixed flags do not combine; one player must personally flag three scores', async () => {
    const { a, b, matchId } = await startMatch();

    // Round 1: both flag once. Total is two, but personal counts are only 1 each.
    await reachReview(a, b, matchId);
    await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: true });
    const afterTwo = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(b))
      .send({ flag: true });
    expect(afterTwo.body.player1FlagCount).toBe(1);
    expect(afterTwo.body.player2FlagCount).toBe(1);
    expect(afterTwo.body.status).toBe('ACTIVE');
    expect(afterTwo.body.currentQuestion).toBe(2);

    const db = await query(
      `SELECT player1_flag_count, player2_flag_count, status
       FROM matches WHERE id = $1`,
      [matchId]
    );
    expect(Number(db.rows[0].player1_flag_count)).toBe(1);
    expect(Number(db.rows[0].player2_flag_count)).toBe(1);

    // Round 2: P1 flags again and P2 accepts. P1 now has two; match remains active.
    await reachReview(a, b, matchId);
    await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: true });
    const afterP1Second = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(b))
      .send({ flag: false });
    expect(afterP1Second.body.player1FlagCount).toBe(2);
    expect(afterP1Second.body.player2FlagCount).toBe(1);
    expect(afterP1Second.body.status).toBe('ACTIVE');

    // Round 3: P1's third personal flag terminates immediately.
    await reachReview(a, b, matchId);
    const third = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: true });
    expect(third.status).toBe(200);
    expect(third.body.player1FlagCount).toBe(3);
    expect(third.body.player2FlagCount).toBe(1);
    expect(third.body.status).toBe('ENDED');
    expect(third.body.endReason).toBe('THREE_FLAGS');

    // Fourth flag cannot subsequently be created
    const fourth = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(b))
      .send({ flag: true });
    expect(fourth.status).toBe(409);
    expect(fourth.body.error).toMatch(/not active/i);

    // Also reject the first player retrying FLAG
    const fourthAgain = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: true });
    expect(fourthAgain.status).toBe(409);

    const dbEnd = await query(
      `SELECT player1_flag_count, player2_flag_count, status, end_reason
       FROM matches WHERE id = $1`,
      [matchId]
    );
    expect(Number(dbEnd.rows[0].player1_flag_count)).toBe(3);
    expect(Number(dbEnd.rows[0].player2_flag_count)).toBe(1);
    expect(dbEnd.rows[0].status).toBe('ENDED');
    expect(dbEnd.rows[0].end_reason).toBe('THREE_FLAGS');
  });
});
