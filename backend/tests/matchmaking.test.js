import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import {
  calculateInterestOverlap,
  selectBestCandidate,
} from '../src/services/matchmakingService.js';
import { resetMatchmakingState } from './helpers.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

describe('calculateInterestOverlap (item 37)', () => {
  it('returns 3 for identical interests', () => {
    expect(calculateInterestOverlap([1, 4, 8], [1, 4, 8])).toBe(3);
  });

  it('returns 2 for two shared interests', () => {
    expect(calculateInterestOverlap([1, 4, 8], [1, 4, 10])).toBe(2);
  });

  it('returns 1 for one shared interest', () => {
    expect(calculateInterestOverlap([1, 4, 8], [1, 2, 3])).toBe(1);
  });

  it('returns 0 when no interests are shared', () => {
    expect(calculateInterestOverlap([1, 4, 8], [2, 3, 5])).toBe(0);
  });
});

describe('selectBestCandidate matchmaking rules (items 38–39)', () => {
  const t0 = '2026-01-01T10:00:00.000Z';
  const t1 = '2026-01-01T10:01:00.000Z';
  const t2 = '2026-01-01T10:02:00.000Z';

  it('prefers 3 shared over 2 and 1', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'one', joined_at: t0, interests: [1, 10, 11] },
      { player_id: 'two', joined_at: t1, interests: [1, 2, 20] },
      { player_id: 'three', joined_at: t2, interests: [1, 2, 3] },
    ]);
    expect(best.player_id).toBe('three');
    expect(best.overlap).toBe(3);
  });

  it('prefers 2 shared when no 3-overlap candidate exists', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'one', joined_at: t0, interests: [1, 10, 11] },
      { player_id: 'two', joined_at: t1, interests: [1, 2, 20] },
    ]);
    expect(best.player_id).toBe('two');
    expect(best.overlap).toBe(2);
  });

  it('accepts 1 shared when no better candidate exists', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'one', joined_at: t0, interests: [1, 10, 11] },
    ]);
    expect(best.player_id).toBe('one');
    expect(best.overlap).toBe(1);
  });

  it('returns null for zero shared interests (no match)', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'zero', joined_at: t0, interests: [4, 5, 6] },
    ]);
    expect(best).toBeNull();
  });

  it('for equal compatibility, selects earliest joined_at', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'later', joined_at: t2, interests: [1, 2, 9] },
      { player_id: 'earlier', joined_at: t0, interests: [1, 2, 8] },
      { player_id: 'middle', joined_at: t1, interests: [1, 2, 7] },
    ]);
    expect(best.player_id).toBe('earlier');
    expect(best.overlap).toBe(2);
  });
});

async function createPlayer(body) {
  return request(app).post('/api/players').send(body);
}

function session(res) {
  return {
    'X-Player-Id': res.body.playerId,
    'X-Session-Token': res.body.sessionToken,
  };
}

describe.skipIf(!hasDb)('pool API (items 40–44)', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('POST /api/pool/join places player in WAITING when alone', async () => {
    const p = await createPlayer({
      displayName: 'Solo',
      avatarId: 1,
      interestIds: [30, 31, 32],
    });
    const join = await request(app)
      .post('/api/pool/join')
      .set(session(p));
    expect(join.status).toBe(200);
    expect(join.body.status).toBe('WAITING');

    const status = await request(app)
      .get('/api/pool/status')
      .set(session(p));
    expect(status.body.status).toBe('WAITING');
  });

  it('POST /api/pool/leave removes player from queue', async () => {
    const p = await createPlayer({
      displayName: 'Leaver',
      avatarId: 2,
      interestIds: [28, 29, 30],
    });
    await request(app).post('/api/pool/join').set(session(p));
    const left = await request(app).post('/api/pool/leave').set(session(p));
    expect(left.body.status).toBe('LEFT');
    const status = await request(app).get('/api/pool/status').set(session(p));
    expect(status.body.status).toBe('IDLE');
  });

  it('matches two compatible players; waiting becomes P1, joiner P2', async () => {
    const a = await createPlayer({
      displayName: 'Waiter',
      avatarId: 3,
      interestIds: [1, 2, 3],
    });
    const b = await createPlayer({
      displayName: 'Joiner',
      avatarId: 4,
      interestIds: [1, 2, 4],
    });

    const j1 = await request(app).post('/api/pool/join').set(session(a));
    expect(j1.body.status).toBe('WAITING');

    const j2 = await request(app).post('/api/pool/join').set(session(b));
    expect(j2.body.status).toBe('MATCHED');
    expect(j2.body.matchId).toBeTruthy();

    const state = await request(app)
      .get(`/api/matches/${j2.body.matchId}`)
      .set(session(b));
    expect(state.body.player1.id).toBe(a.body.playerId);
    expect(state.body.player2.id).toBe(b.body.playerId);
    expect(state.body.phase).toBe('P1_ANSWER');
    expect(state.body.status).toBe('ACTIVE');
    expect(state.body.currentQuestion).toBe(1);
  });

  it('does not match zero-overlap players', async () => {
    const a = await createPlayer({
      displayName: 'A0',
      avatarId: 5,
      interestIds: [1, 2, 3],
    });
    const b = await createPlayer({
      displayName: 'B0',
      avatarId: 6,
      interestIds: [4, 5, 6],
    });
    const j1 = await request(app).post('/api/pool/join').set(session(a));
    const j2 = await request(app).post('/api/pool/join').set(session(b));
    expect(j1.body.status).toBe('WAITING');
    expect(j2.body.status).toBe('WAITING');
  });
});
