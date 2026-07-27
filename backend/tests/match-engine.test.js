import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import {
  MATCH_PHASES,
  validateAnswerText,
  validateScoreValue,
} from '../src/services/matchService.js';
import { resetMatchmakingState } from './helpers.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

describe('match phases (item 47)', () => {
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

describe('validateAnswerText (item 49)', () => {
  it('accepts 1–500 character answers and trims', () => {
    expect(validateAnswerText('  hi  ').ok).toBe(true);
    expect(validateAnswerText('  hi  ').answer).toBe('hi');
    expect(validateAnswerText('a'.repeat(500)).ok).toBe(true);
  });

  it('rejects empty or too long answers', () => {
    expect(validateAnswerText('').ok).toBe(false);
    expect(validateAnswerText('   ').ok).toBe(false);
    expect(validateAnswerText('a'.repeat(501)).ok).toBe(false);
    expect(validateAnswerText(null).ok).toBe(false);
  });
});

describe('validateScoreValue (item 52)', () => {
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

describe.skipIf(!hasDb)('match answer/score flow (items 45–52)', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('GET match returns names, role, question, phase, flags, status', async () => {
    const { a, b, matchId } = await startMatch();
    const res = await request(app).get(`/api/matches/${matchId}`).set(hdr(a));
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('PLAYER_1');
    expect(res.body.player1.displayName).toBe('P1eng');
    expect(res.body.player2.displayName).toBe('P2eng');
    expect(res.body.player1.avatarId).toBe(1);
    expect(res.body.player2.avatarId).toBe(2);
    expect(res.body.currentQuestion).toBe(1);
    expect(res.body.questionText).toBeTruthy();
    expect(res.body.phase).toBe('P1_ANSWER');
    expect(res.body.flagCount).toBe(0);
    expect(res.body.status).toBe('ACTIVE');

    const res2 = await request(app).get(`/api/matches/${matchId}`).set(hdr(b));
    expect(res2.body.role).toBe('PLAYER_2');
  });

  it('wrong player cannot answer; P1 answer advances to P2_SCORE_P1', async () => {
    const { a, b, matchId } = await startMatch();
    const bad = await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(b))
      .send({ answer: 'Nope' });
    expect(bad.status).toBe(403);

    const ok = await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({ answer: 'Valid answer from P1' });
    expect(ok.status).toBe(200);
    expect(ok.body.phase).toBe('P2_SCORE_P1');
    expect(ok.body.player1Answer).toBe('Valid answer from P1');
  });

  it('score outside 1–10 rejected; valid score advances to P2_ANSWER', async () => {
    const { a, b, matchId } = await startMatch();
    await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({ answer: 'Answer' });

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

  it('rejects empty answer and double answer', async () => {
    const { a, matchId } = await startMatch();
    const empty = await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({ answer: '  ' });
    expect(empty.status).toBe(400);

    await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({ answer: 'Once' });
    const twice = await request(app)
      .post(`/api/matches/${matchId}/answer`)
      .set(hdr(a))
      .send({ answer: 'Twice' });
    expect(twice.status).toBe(403);
  });
});
