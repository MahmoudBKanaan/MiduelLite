import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import { query } from '../src/db.js';
import { calculateInterestOverlap } from '../src/services/matchmakingService.js';
import { resetMatchmakingState } from './helpers.js';

const hasDb = Boolean(process.env.DATABASE_URL);
const app = createApp();

async function createPlayer(body) {
  const res = await request(app).post('/api/players').send(body);
  return res;
}

describe('API health and config', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/config returns interests and avatars', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.interests).toHaveLength(32);
    expect(res.body.avatarIds).toHaveLength(12);
  });
});

describe.skipIf(!hasDb)('Player and matchmaking (DB)', () => {
  beforeAll(async () => {
    const count = await query('SELECT COUNT(*)::int AS c FROM questions');
    expect(count.rows[0].c).toBeGreaterThanOrEqual(1000);
  });

  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('BT-01 valid temporary player can be created', async () => {
    const res = await createPlayer({
      displayName: 'Neo',
      avatarId: 4,
      interestIds: [1, 4, 8],
    });
    expect(res.status).toBe(201);
    expect(res.body.playerId).toBeTruthy();
    expect(res.body.sessionToken).toBeTruthy();
  });

  it('BT-02 player creation rejects invalid profile', async () => {
    const res = await createPlayer({
      displayName: 'X',
      avatarId: 99,
      interestIds: [1],
    });
    expect(res.status).toBe(400);
  });

  it('BT-03 matchmaking prefers three shared interests', async () => {
    // A and C must share 0 interests so both stay WAITING until B joins.
    // B overlaps 3 with A and 1 with C → must pick A.
    const a = await createPlayer({
      displayName: 'A3',
      avatarId: 1,
      interestIds: [1, 2, 3],
    });
    const b = await createPlayer({
      displayName: 'B3',
      avatarId: 2,
      interestIds: [1, 2, 3],
    });
    const c = await createPlayer({
      displayName: 'C1',
      avatarId: 3,
      interestIds: [10, 11, 12],
    });

    const jA = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken);
    expect(jA.body.status).toBe('WAITING');

    const jC = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', c.body.playerId)
      .set('X-Session-Token', c.body.sessionToken);
    expect(jC.body.status).toBe('WAITING');

    const match = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);

    expect(match.body.status).toBe('MATCHED');
    const state = await request(app)
      .get(`/api/matches/${match.body.matchId}`)
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);
    const ids = [state.body.player1.id, state.body.player2.id];
    expect(ids).toContain(a.body.playerId);
    expect(ids).toContain(b.body.playerId);
    expect(ids).not.toContain(c.body.playerId);
  });

  it('BT-06 players with zero shared interests are not matched', async () => {
    const a = await createPlayer({
      displayName: 'ZeroA',
      avatarId: 1,
      interestIds: [1, 2, 3],
    });
    const b = await createPlayer({
      displayName: 'ZeroB',
      avatarId: 2,
      interestIds: [4, 5, 6],
    });
    const j1 = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken);
    expect(j1.body.status).toBe('WAITING');
    const j2 = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);
    expect(j2.body.status).toBe('WAITING');
    expect(calculateInterestOverlap([1, 2, 3], [4, 5, 6])).toBe(0);
  });

  it('BT-07 wrong player cannot complete answer', async () => {
    const a = await createPlayer({
      displayName: 'P1',
      avatarId: 1,
      interestIds: [7, 8, 9],
    });
    const b = await createPlayer({
      displayName: 'P2',
      avatarId: 2,
      interestIds: [7, 8, 10],
    });
    await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken);
    const m = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);
    const matchId = m.body.matchId;
    // b is player 2, phase is P1_ANSWER
    const bad = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken)
      .send({});
    expect(bad.status).toBe(403);
  });

  it('BT-08 score outside 1–10 is rejected', async () => {
    const a = await createPlayer({
      displayName: 'SA',
      avatarId: 1,
      interestIds: [11, 12, 13],
    });
    const b = await createPlayer({
      displayName: 'SB',
      avatarId: 2,
      interestIds: [11, 12, 14],
    });
    await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken);
    const m = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);
    const matchId = m.body.matchId;
    await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken)
      .send({});
    const bad = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken)
      .send({ score: 11 });
    expect(bad.status).toBe(400);
  });

  it('BT-09 valid score advances match phase', async () => {
    const a = await createPlayer({
      displayName: 'VA',
      avatarId: 1,
      interestIds: [15, 16, 17],
    });
    const b = await createPlayer({
      displayName: 'VB',
      avatarId: 2,
      interestIds: [15, 16, 18],
    });
    await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken);
    const m = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);
    const matchId = m.body.matchId;
    await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken)
      .send({});
    const scored = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken)
      .send({ score: 8 });
    expect(scored.status).toBe(200);
    expect(scored.body.phase).toBe('P2_ANSWER');
  });

  it('BT-10/11 flagging and third flag ends match', async () => {
    const a = await createPlayer({
      displayName: 'FA',
      avatarId: 1,
      interestIds: [20, 21, 22],
    });
    const b = await createPlayer({
      displayName: 'FB',
      avatarId: 2,
      interestIds: [20, 21, 23],
    });
    await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', a.body.playerId)
      .set('X-Session-Token', a.body.sessionToken);
    const m = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', b.body.playerId)
      .set('X-Session-Token', b.body.sessionToken);
    const matchId = m.body.matchId;

    async function playRoundP1Flag() {
      const st = await request(app)
        .get(`/api/matches/${matchId}`)
        .set('X-Player-Id', a.body.playerId)
        .set('X-Session-Token', a.body.sessionToken);
      if (st.body.status === 'ENDED') return st.body;
      await request(app)
        .post(`/api/matches/${matchId}/answer-complete`)
        .set('X-Player-Id', a.body.playerId)
        .set('X-Session-Token', a.body.sessionToken)
        .send({});
      await request(app)
        .post(`/api/matches/${matchId}/score`)
        .set('X-Player-Id', b.body.playerId)
        .set('X-Session-Token', b.body.sessionToken)
        .send({ score: 3 });
      await request(app)
        .post(`/api/matches/${matchId}/answer-complete`)
        .set('X-Player-Id', b.body.playerId)
        .set('X-Session-Token', b.body.sessionToken)
        .send({});
      await request(app)
        .post(`/api/matches/${matchId}/score`)
        .set('X-Player-Id', a.body.playerId)
        .set('X-Session-Token', a.body.sessionToken)
        .send({ score: 3 });
      const first = await request(app)
        .post(`/api/matches/${matchId}/review`)
        .set('X-Player-Id', a.body.playerId)
        .set('X-Session-Token', a.body.sessionToken)
        .send({ flag: true });
      if (first.body.status === 'ENDED') return first.body;
      const last = await request(app)
        .post(`/api/matches/${matchId}/review`)
        .set('X-Player-Id', b.body.playerId)
        .set('X-Session-Token', b.body.sessionToken)
        .send({ flag: false });
      return last.body;
    }

    let body = await playRoundP1Flag();
    expect(body.player1FlagCount).toBe(1);
    expect(body.player2FlagCount).toBe(0);
    body = await playRoundP1Flag();
    expect(body.status).toBe('ACTIVE');
    body = await playRoundP1Flag(); // P1's third flag ends immediately
    expect(body.status).toBe('ENDED');
    expect(body.endReason).toBe('THREE_FLAGS');
  });
});
