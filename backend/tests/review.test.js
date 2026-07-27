import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import {
  parseReviewAction,
  resolveAfterBothReviews,
} from '../src/services/matchService.js';
import { resetMatchmakingState } from './helpers.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

describe('parseReviewAction (item 58)', () => {
  it('ACCEPT via flag:false or action', () => {
    expect(parseReviewAction({ flag: false })).toEqual({
      ok: true,
      flag: false,
    });
    expect(parseReviewAction({ action: 'ACCEPT' }).flag).toBe(false);
  });

  it('FLAG via flag:true or action', () => {
    expect(parseReviewAction({ flag: true })).toEqual({ ok: true, flag: true });
    expect(parseReviewAction({ action: 'FLAG' }).flag).toBe(true);
  });

  it('rejects invalid body', () => {
    expect(parseReviewAction({}).ok).toBe(false);
    expect(parseReviewAction(null).ok).toBe(false);
  });
});

describe('resolveAfterBothReviews (item 61)', () => {
  it('ends with THREE_FLAGS when flag_count >= 3', () => {
    expect(resolveAfterBothReviews(3, 2)).toEqual({ type: 'THREE_FLAGS' });
    expect(resolveAfterBothReviews(4, 10)).toEqual({ type: 'THREE_FLAGS' });
  });

  it('ends with COMPLETED on question 10 when flags < 3', () => {
    expect(resolveAfterBothReviews(1, 10)).toEqual({ type: 'COMPLETED' });
  });

  it('advances to next question otherwise', () => {
    expect(resolveAfterBothReviews(0, 1)).toEqual({
      type: 'NEXT',
      nextQuestion: 2,
    });
    expect(resolveAfterBothReviews(2, 9)).toEqual({
      type: 'NEXT',
      nextQuestion: 10,
    });
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
    displayName: 'RevP1',
    avatarId: 1,
    interestIds: [10, 11, 12],
  });
  const b = await createPlayer({
    displayName: 'RevP2',
    avatarId: 2,
    interestIds: [10, 11, 13],
  });
  await request(app).post('/api/pool/join').set(hdr(a));
  const m = await request(app).post('/api/pool/join').set(hdr(b));
  return { a, b, matchId: m.body.matchId };
}

/** Play through to REVIEW phase for current question. */
async function reachReview(a, b, matchId) {
  await request(app)
    .post(`/api/matches/${matchId}/answer`)
    .set(hdr(a))
    .send({ answer: 'P1 answer text' });
  await request(app)
    .post(`/api/matches/${matchId}/score`)
    .set(hdr(b))
    .send({ score: 7 });
  await request(app)
    .post(`/api/matches/${matchId}/answer`)
    .set(hdr(b))
    .send({ answer: 'P2 answer text' });
  const scored = await request(app)
    .post(`/api/matches/${matchId}/score`)
    .set(hdr(a))
    .send({ score: 6 });
  expect(scored.body.phase).toBe('REVIEW');
  return scored.body;
}

describe.skipIf(!hasDb)('review API (items 53–61)', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('items 53–55: score/answer transitions reach REVIEW', async () => {
    const { a, b, matchId } = await startMatch();
    await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({ answer: 'A1' });
    let s = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 8 });
    expect(s.body.phase).toBe('P2_ANSWER'); // 53
    s = await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(b))
      .send({ answer: 'A2' });
    expect(s.body.phase).toBe('P1_SCORE_P2'); // 54
    s = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(a))
      .send({ score: 9 });
    expect(s.body.phase).toBe('REVIEW'); // 55
  });

  it('ACCEPT both advances to next question P1_ANSWER', async () => {
    const { a, b, matchId } = await startMatch();
    await reachReview(a, b, matchId);
    await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: false });
    const done = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(b))
      .send({ action: 'ACCEPT' });
    expect(done.body.status).toBe('ACTIVE');
    expect(done.body.phase).toBe('P1_ANSWER');
    expect(done.body.currentQuestion).toBe(2);
    expect(done.body.flagCount).toBe(0);
  });

  it('FLAG increments flag_count; reviews are immutable', async () => {
    const { a, b, matchId } = await startMatch();
    await reachReview(a, b, matchId);
    const flagged = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: true });
    expect(flagged.body.flagCount).toBe(1);
    expect(flagged.body.ownReviewDone).toBe(true);

    const again = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: false });
    expect(again.status).toBe(409);

    await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(b))
      .send({ flag: false });
  });

  it('third flag ends match with THREE_FLAGS', async () => {
    const { a, b, matchId } = await startMatch();

    async function roundBothFlag() {
      const st = await request(app)
        .get(`/api/matches/${matchId}`)
        .set(hdr(a));
      if (st.body.status === 'ENDED') return st.body;
      await reachReview(a, b, matchId);
      await request(app)
        .post(`/api/matches/${matchId}/review`)
        .set(hdr(a))
        .send({ flag: true });
      const last = await request(app)
        .post(`/api/matches/${matchId}/review`)
        .set(hdr(b))
        .send({ flag: true });
      return last.body;
    }

    // Round 1: +2 flags
    let body = await roundBothFlag();
    expect(body.flagCount).toBeGreaterThanOrEqual(2);
    // Round 2: +2 more → ends at >= 3 after second flag of this round
    body = await roundBothFlag();
    expect(body.status).toBe('ENDED');
    expect(body.endReason).toBe('THREE_FLAGS');
  });
});
