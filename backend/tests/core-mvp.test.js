/**
 * Minimum backend automated suite (item 141) — maps 1:1 to required cases.
 * Integration cases need DATABASE_URL (Docker Postgres).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import {
  calculateInterestOverlap,
  selectBestCandidate,
} from '../src/services/matchmakingService.js';
import {
  computeFinalScores,
  resolveAfterBothReviews,
} from '../src/services/matchService.js';
import { resetMatchmakingState } from './helpers.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

async function createPlayer(body) {
  return request(app).post('/api/players').send(body);
}

function hdr(res) {
  return {
    'X-Player-Id': res.body.playerId,
    'X-Session-Token': res.body.sessionToken,
  };
}

async function startMatch(aInterests, bInterests) {
  const a = await createPlayer({
    displayName: 'CoreA',
    avatarId: 1,
    interestIds: aInterests,
  });
  const b = await createPlayer({
    displayName: 'CoreB',
    avatarId: 2,
    interestIds: bInterests,
  });
  await request(app).post('/api/pool/join').set(hdr(a));
  const m = await request(app).post('/api/pool/join').set(hdr(b));
  return { a, b, matchId: m.body.matchId, joinB: m.body };
}

describe('BT core — player creation', () => {
  it('valid player creation', async () => {
    if (!hasDb) {
      // still validate pure rules without DB
      const { validatePlayerInput } = await import(
        '../src/services/playerValidation.js'
      );
      const v = validatePlayerInput({
        displayName: 'Neo',
        avatarId: 4,
        interestIds: [1, 4, 8],
      });
      expect(v.ok).toBe(true);
      return;
    }
    const res = await createPlayer({
      displayName: 'Neo',
      avatarId: 4,
      interestIds: [1, 4, 8],
    });
    expect(res.status).toBe(201);
    expect(res.body.playerId).toBeTruthy();
    expect(res.body.sessionToken).toBeTruthy();
  });

  it('invalid profile rejection', async () => {
    const res = await request(app).post('/api/players').send({
      displayName: 'X',
      avatarId: 99,
      interestIds: [1],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe('BT core — matchmaking priority', () => {
  it('3-interest matching priority', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'c', joined_at: '2026-01-01T10:00:00Z', interests: [1, 10, 11] },
      { player_id: 'b', joined_at: '2026-01-01T10:01:00Z', interests: [1, 2, 20] },
      { player_id: 'a', joined_at: '2026-01-01T10:02:00Z', interests: [1, 2, 3] },
    ]);
    expect(best.player_id).toBe('a');
    expect(best.overlap).toBe(3);
  });

  it('fallback to 2 interests', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'one', joined_at: '2026-01-01T10:00:00Z', interests: [1, 10, 11] },
      { player_id: 'two', joined_at: '2026-01-01T10:01:00Z', interests: [1, 2, 20] },
    ]);
    expect(best.player_id).toBe('two');
    expect(best.overlap).toBe(2);
  });

  it('fallback to 1 interest', () => {
    const best = selectBestCandidate([1, 2, 3], [
      { player_id: 'one', joined_at: '2026-01-01T10:00:00Z', interests: [1, 10, 11] },
    ]);
    expect(best.player_id).toBe('one');
    expect(best.overlap).toBe(1);
  });

  it('no zero-interest match', () => {
    expect(calculateInterestOverlap([1, 2, 3], [4, 5, 6])).toBe(0);
    expect(
      selectBestCandidate([1, 2, 3], [
        { player_id: 'z', joined_at: '2026-01-01T10:00:00Z', interests: [4, 5, 6] },
      ])
    ).toBeNull();
  });
});

describe.skipIf(!hasDb)('BT core — matchmaking integration', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('API: matches on 2 shared interests when best available', async () => {
    const { joinB } = await startMatch([1, 2, 3], [1, 2, 9]);
    expect(joinB.status).toBe('MATCHED');
    expect(joinB.matchId).toBeTruthy();
  });

  it('API: matches on 1 shared interest when best available', async () => {
    const { joinB } = await startMatch([1, 2, 3], [1, 10, 11]);
    expect(joinB.status).toBe('MATCHED');
  });

  it('API: no match when zero shared interests', async () => {
    const a = await createPlayer({
      displayName: 'Z0A',
      avatarId: 1,
      interestIds: [1, 2, 3],
    });
    const b = await createPlayer({
      displayName: 'Z0B',
      avatarId: 2,
      interestIds: [4, 5, 6],
    });
    const j1 = await request(app).post('/api/pool/join').set(hdr(a));
    const j2 = await request(app).post('/api/pool/join').set(hdr(b));
    expect(j1.body.status).toBe('WAITING');
    expect(j2.body.status).toBe('WAITING');
  });
});

describe.skipIf(!hasDb)('BT core — match rules', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('wrong-player turn rejection', async () => {
    const { a, b, matchId } = await startMatch([7, 8, 9], [7, 8, 10]);
    const bad = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(b))
      .send({});
    expect(bad.status).toBe(403);
    const ok = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    expect(ok.status).toBe(200);
    expect(ok.body.phase).toBe('P2_SCORE_P1');
  });

  it('score range validation', async () => {
    const { a, b, matchId } = await startMatch([11, 12, 13], [11, 12, 14]);
    await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    const bad = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 0 });
    expect(bad.status).toBe(400);
    const bad2 = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 11 });
    expect(bad2.status).toBe(400);
  });

  it('valid phase progression', async () => {
    const { a, b, matchId } = await startMatch([15, 16, 17], [15, 16, 18]);
    let s = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    expect(s.body.phase).toBe('P2_SCORE_P1');
    s = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 8 });
    expect(s.body.phase).toBe('P2_ANSWER');
    s = await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(b))
      .send({});
    expect(s.body.phase).toBe('P1_SCORE_P2');
    s = await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(a))
      .send({ score: 7 });
    expect(s.body.phase).toBe('REVIEW');
  });

  it('flag count increment belongs only to the reviewing player', async () => {
    const { a, b, matchId } = await startMatch([20, 21, 22], [20, 21, 23]);
    await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(a))
      .send({});
    await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(b))
      .send({ score: 3 });
    await request(app)
      .post(`/api/matches/${matchId}/answer-complete`)
      .set(hdr(b))
      .send({});
    await request(app)
      .post(`/api/matches/${matchId}/score`)
      .set(hdr(a))
      .send({ score: 3 });
    const flagged = await request(app)
      .post(`/api/matches/${matchId}/review`)
      .set(hdr(a))
      .send({ flag: true });
    expect(flagged.body.player1FlagCount).toBe(1);
    expect(flagged.body.player2FlagCount).toBe(0);
  });

  it('third-flag termination', async () => {
    const { a, b, matchId } = await startMatch([24, 25, 26], [24, 25, 27]);

    async function roundP1Flag() {
      const st = await request(app).get(`/api/matches/${matchId}`).set(hdr(a));
      if (st.body.status === 'ENDED') return st.body;
      await request(app)
        .post(`/api/matches/${matchId}/answer-complete`)
        .set(hdr(a))
        .send({});
      await request(app)
        .post(`/api/matches/${matchId}/score`)
        .set(hdr(b))
        .send({ score: 2 });
      await request(app)
        .post(`/api/matches/${matchId}/answer-complete`)
        .set(hdr(b))
        .send({});
      await request(app)
        .post(`/api/matches/${matchId}/score`)
        .set(hdr(a))
        .send({ score: 2 });
      const first = await request(app)
        .post(`/api/matches/${matchId}/review`)
        .set(hdr(a))
        .send({ flag: true });
      if (first.body.status === 'ENDED') return first.body;
      return (
        await request(app)
          .post(`/api/matches/${matchId}/review`)
          .set(hdr(b))
          .send({ flag: false })
      ).body;
    }

    await roundP1Flag();
    await roundP1Flag();
    const end = await roundP1Flag(); // P1's third personal flag ends immediately
    expect(end.status).toBe('ENDED');
    expect(end.endReason).toBe('THREE_FLAGS');
  });
});

describe('BT core — results & termination rules', () => {
  it('question-10 termination', () => {
    expect(resolveAfterBothReviews(0, 0, 10)).toEqual({ type: 'COMPLETED' });
    expect(resolveAfterBothReviews(2, 2, 10)).toEqual({ type: 'COMPLETED' });
    // Either player's third personal flag wins over Q10.
    expect(resolveAfterBothReviews(3, 0, 10)).toEqual({ type: 'THREE_FLAGS' });
  });

  it('flagged-score exclusion', () => {
    const r = computeFinalScores([
      {
        player1_score: 10,
        player1_score_flagged: true,
        player2_score: 8,
        player2_score_flagged: false,
      },
      {
        player1_score: 6,
        player1_score_flagged: false,
        player2_score: 4,
        player2_score_flagged: true,
      },
    ]);
    // P1 only 6; P2 only 8
    expect(r.player1Final).toBe(6);
    expect(r.player2Final).toBe(8);
    expect(r.winner).toBe('PLAYER_2');
  });

  it('correct winner calculation', () => {
    const r = computeFinalScores([
      {
        player1_score: 8,
        player1_score_flagged: false,
        player2_score: 6,
        player2_score_flagged: false,
      },
      {
        player1_score: 7,
        player1_score_flagged: false,
        player2_score: 8,
        player2_score_flagged: false,
      },
      {
        player1_score: 9,
        player1_score_flagged: false,
        player2_score: 6,
        player2_score_flagged: false,
      },
      {
        player1_score: 8,
        player1_score_flagged: false,
        player2_score: 7,
        player2_score_flagged: false,
      },
      {
        player1_score: 7,
        player1_score_flagged: false,
        player2_score: 7,
        player2_score_flagged: false,
      },
    ]);
    expect(r.player1Final).toBe(7.8);
    expect(r.player2Final).toBe(6.8);
    expect(r.winner).toBe('PLAYER_1');
  });
});
