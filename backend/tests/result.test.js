import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import {
  averageScore,
  collectValidScores,
  determineWinner,
  computeFinalScores,
} from '../src/services/matchService.js';
import { resetMatchmakingState } from './helpers.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

describe('averageScore (items 65–66)', () => {
  it('rounds to one decimal place', () => {
    // 8+7+9+8+7 = 39 / 5 = 7.8
    expect(averageScore([8, 7, 9, 8, 7])).toBe(7.8);
    // 6+8+6+7+7 = 34 / 5 = 6.8
    expect(averageScore([6, 8, 6, 7, 7])).toBe(6.8);
  });

  it('returns 0 when no valid scores', () => {
    expect(averageScore([])).toBe(0);
    expect(averageScore(null)).toBe(0);
  });
});

describe('collectValidScores (items 63–64)', () => {
  it('excludes flagged scores', () => {
    const { player1Scores, player2Scores } = collectValidScores([
      {
        player1_score: 8,
        player1_score_flagged: false,
        player2_score: 3,
        player2_score_flagged: true,
      },
      {
        player1_score: 5,
        player1_score_flagged: true,
        player2_score: 9,
        player2_score_flagged: false,
      },
      {
        player1_score: 7,
        player1_score_flagged: false,
        player2_score: 6,
        player2_score_flagged: false,
      },
    ]);
    expect(player1Scores).toEqual([8, 7]);
    expect(player2Scores).toEqual([9, 6]);
  });
});

describe('determineWinner (item 67)', () => {
  it('PLAYER_1 wins when higher', () => {
    expect(determineWinner(7.8, 6.8)).toBe('PLAYER_1');
  });
  it('PLAYER_2 wins when higher', () => {
    expect(determineWinner(5, 9)).toBe('PLAYER_2');
  });
  it('DRAW when equal', () => {
    expect(determineWinner(7.5, 7.5)).toBe('DRAW');
    expect(determineWinner(0, 0)).toBe('DRAW');
  });
});

describe('computeFinalScores (items 62–67)', () => {
  it('matches KB example averages and winner', () => {
    const rounds = [
      { player1_score: 8, player1_score_flagged: false, player2_score: 6, player2_score_flagged: false },
      { player1_score: 7, player1_score_flagged: false, player2_score: 8, player2_score_flagged: false },
      { player1_score: 9, player1_score_flagged: false, player2_score: 6, player2_score_flagged: false },
      { player1_score: 8, player1_score_flagged: false, player2_score: 7, player2_score_flagged: false },
      { player1_score: 7, player1_score_flagged: false, player2_score: 7, player2_score_flagged: false },
    ];
    const r = computeFinalScores(rounds);
    expect(r.player1Final).toBe(7.8);
    expect(r.player2Final).toBe(6.8);
    expect(r.winner).toBe('PLAYER_1');
    expect(r.questionsCompleted).toBe(5);
  });

  it('all flagged → scores 0 and DRAW', () => {
    const r = computeFinalScores([
      {
        player1_score: 1,
        player1_score_flagged: true,
        player2_score: 10,
        player2_score_flagged: true,
      },
    ]);
    expect(r.player1Final).toBe(0);
    expect(r.player2Final).toBe(0);
    expect(r.winner).toBe('DRAW');
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

describe.skipIf(!hasDb)('GET /api/matches/:matchId/result (items 68–69)', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('returns result payload after THREE_FLAGS end', async () => {
    const a = await createPlayer({
      displayName: 'ResP1',
      avatarId: 3,
      interestIds: [20, 21, 22],
    });
    const b = await createPlayer({
      displayName: 'ResP2',
      avatarId: 4,
      interestIds: [20, 21, 23],
    });
    await request(app).post('/api/pool/join').set(hdr(a));
    const m = await request(app).post('/api/pool/join').set(hdr(b));
    const matchId = m.body.matchId;

    async function playP1Flag() {
      const st = await request(app).get(`/api/matches/${matchId}`).set(hdr(a));
      if (st.body.status === 'ENDED') return st.body;
      await request(app)
        .post(`/api/matches/${matchId}/answer-complete`)
        .set(hdr(a))
        .send({});
      await request(app)
        .post(`/api/matches/${matchId}/score`)
        .set(hdr(b))
        .send({ score: 4 });
      await request(app)
        .post(`/api/matches/${matchId}/answer-complete`)
        .set(hdr(b))
        .send({});
      await request(app)
        .post(`/api/matches/${matchId}/score`)
        .set(hdr(a))
        .send({ score: 5 });
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

    let body = await playP1Flag();
    body = await playP1Flag();
    body = await playP1Flag();
    expect(body.status).toBe('ENDED');

    const result = await request(app)
      .get(`/api/matches/${matchId}/result`)
      .set(hdr(a));
    expect(result.status).toBe(200);
    expect(result.body.player1.displayName).toBe('ResP1');
    expect(result.body.player1.avatarId).toBe(3);
    expect(result.body.player2.displayName).toBe('ResP2');
    expect(result.body.player2.avatarId).toBe(4);
    expect(typeof result.body.player1.finalScore).toBe('number');
    expect(typeof result.body.player2.finalScore).toBe('number');
    expect(['PLAYER_1', 'PLAYER_2', 'DRAW']).toContain(result.body.winner);
    expect(result.body.questionsCompleted).toBeGreaterThanOrEqual(1);
    expect(result.body.player1FlagCount).toBe(3);
    expect(result.body.player2FlagCount).toBe(0);
    expect(result.body.endReason).toBe('THREE_FLAGS');
  });
});
