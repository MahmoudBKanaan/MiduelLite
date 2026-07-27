/**
 * Manual backend verification (spoken-answer model):
 * create A/B → pool → shared match → one full question (answer-complete, no text)
 * → advance to Q2
 */
import 'dotenv/config';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { query } from '../src/db.js';

const app = createApp();

function hdr(player) {
  return {
    'X-Player-Id': player.playerId,
    'X-Session-Token': player.sessionToken,
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log('DATABASE_URL =', process.env.DATABASE_URL);

  // Wait for DB + seed
  for (let i = 0; i < 30; i++) {
    try {
      const c = await query('SELECT COUNT(*)::int AS n FROM questions');
      if (c.rows[0].n >= 1000) {
        console.log('Questions seeded:', c.rows[0].n);
        break;
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
    if (i === 29) throw new Error('Database/seed not ready');
  }

  const aRes = await request(app).post('/api/players').send({
    displayName: 'PlayerA',
    avatarId: 1,
    interestIds: [1, 4, 8],
  });
  assert(aRes.status === 201, `create A failed: ${aRes.status} ${JSON.stringify(aRes.body)}`);
  const playerA = aRes.body;
  console.log('1. Created Player A', playerA.playerId);

  const bRes = await request(app).post('/api/players').send({
    displayName: 'PlayerB',
    avatarId: 2,
    interestIds: [1, 4, 10],
  });
  assert(bRes.status === 201, `create B failed: ${JSON.stringify(bRes.body)}`);
  const playerB = bRes.body;
  console.log('2. Created Player B', playerB.playerId);

  const joinA = await request(app).post('/api/pool/join').set(hdr(playerA));
  assert(joinA.status === 200, `join A failed: ${JSON.stringify(joinA.body)}`);
  assert(joinA.body.status === 'WAITING', `A expected WAITING got ${joinA.body.status}`);
  console.log('3. Player A joined pool → WAITING');

  const joinB = await request(app).post('/api/pool/join').set(hdr(playerB));
  assert(joinB.status === 200, `join B failed: ${JSON.stringify(joinB.body)}`);
  assert(joinB.body.status === 'MATCHED', `B expected MATCHED got ${joinB.body.status}`);
  const matchId = joinB.body.matchId;
  assert(matchId, 'missing matchId');
  console.log('4. Shared matchId', matchId);

  const statusA = await request(app).get('/api/pool/status').set(hdr(playerA));
  assert(statusA.body.matchId === matchId, 'Player A did not see same matchId');
  console.log('5. Both see same matchId');

  const stateA = await request(app).get(`/api/matches/${matchId}`).set(hdr(playerA));
  const stateB = await request(app).get(`/api/matches/${matchId}`).set(hdr(playerB));
  assert(stateA.status === 200, `get match A failed: ${JSON.stringify(stateA.body)}`);
  assert(stateA.body.role === 'PLAYER_1', `A should be PLAYER_1, got ${stateA.body.role}`);
  assert(stateB.body.role === 'PLAYER_2', `B should be PLAYER_2, got ${stateB.body.role}`);
  assert(stateA.body.phase === 'P1_ANSWER', `expected P1_ANSWER got ${stateA.body.phase}`);
  assert(stateA.body.currentQuestion === 1, 'expected question 1');
  assert(stateA.body.questionText, 'missing question text');
  assert(stateA.body.questionText === stateB.body.questionText, 'questions differ');
  console.log('6. Current question:', stateA.body.questionText.slice(0, 60) + '...');

  const ans1 = await request(app)
    .post(`/api/matches/${matchId}/answer-complete`)
    .set(hdr(playerA))
    .send({});
  assert(ans1.status === 200, `P1 answer-complete failed: ${JSON.stringify(ans1.body)}`);
  assert(ans1.body.phase === 'P2_SCORE_P1', `after P1 answer-complete expected P2_SCORE_P1 got ${ans1.body.phase}`);
  assert(ans1.body.player1AnswerCompleted === true, 'P1 answer completed flag');
  console.log('7. P1 spoken answer-complete →', ans1.body.phase);

  const sc2 = await request(app)
    .post(`/api/matches/${matchId}/score`)
    .set(hdr(playerB))
    .send({ score: 8 });
  assert(sc2.status === 200, `P2 score failed: ${JSON.stringify(sc2.body)}`);
  assert(sc2.body.phase === 'P2_ANSWER', `after P2 score expected P2_ANSWER got ${sc2.body.phase}`);
  console.log('8. P2 scored →', sc2.body.phase);

  const ans2 = await request(app)
    .post(`/api/matches/${matchId}/answer-complete`)
    .set(hdr(playerB))
    .send({});
  assert(ans2.status === 200, `P2 answer-complete failed: ${JSON.stringify(ans2.body)}`);
  assert(ans2.body.phase === 'P1_SCORE_P2', `after P2 answer-complete expected P1_SCORE_P2 got ${ans2.body.phase}`);
  assert(ans2.body.player2AnswerCompleted === true, 'P2 answer completed flag');
  console.log('9. P2 spoken answer-complete →', ans2.body.phase);

  const sc1 = await request(app)
    .post(`/api/matches/${matchId}/score`)
    .set(hdr(playerA))
    .send({ score: 7 });
  assert(sc1.status === 200, `P1 score failed: ${JSON.stringify(sc1.body)}`);
  assert(sc1.body.phase === 'REVIEW', `after P1 score expected REVIEW got ${sc1.body.phase}`);
  console.log('10. P1 scored →', sc1.body.phase);

  const revA = await request(app)
    .post(`/api/matches/${matchId}/review`)
    .set(hdr(playerA))
    .send({ flag: false });
  assert(revA.status === 200, `P1 review failed: ${JSON.stringify(revA.body)}`);
  assert(revA.body.phase === 'REVIEW', 'still REVIEW until both review');
  console.log('11. P1 accepted score');

  const revB = await request(app)
    .post(`/api/matches/${matchId}/review`)
    .set(hdr(playerB))
    .send({ flag: false });
  assert(revB.status === 200, `P2 review failed: ${JSON.stringify(revB.body)}`);
  assert(revB.body.status === 'ACTIVE', `expected ACTIVE got ${revB.body.status}`);
  assert(revB.body.phase === 'P1_ANSWER', `expected P1_ANSWER got ${revB.body.phase}`);
  assert(revB.body.currentQuestion === 2, `expected question 2 got ${revB.body.currentQuestion}`);
  assert(revB.body.questionText, 'missing Q2 text');
  console.log('12. Both reviewed → advanced to question', revB.body.currentQuestion, 'phase', revB.body.phase);

  console.log('\nVERIFY BASIC SEQUENCE: PASSED');
  process.exit(0);
}

main().catch((e) => {
  console.error('\nVERIFY BASIC SEQUENCE: FAILED');
  console.error(e);
  process.exit(1);
});
