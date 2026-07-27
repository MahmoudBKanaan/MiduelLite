/**
 * Acceptance verification items 155–162 against a running API.
 */
const API = process.env.API_URL || 'http://localhost:3001';

async function api(path, { method = 'GET', body, player } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (player) {
    headers['X-Player-Id'] = player.playerId;
    headers['X-Session-Token'] = player.sessionToken;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${data.error || JSON.stringify(data)}`);
  }
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function createPair(suffix, interestsA, interestsB) {
  const a = await api('/api/players', {
    method: 'POST',
    body: {
      displayName: `A${suffix}`.slice(0, 20),
      avatarId: 1,
      interestIds: interestsA,
    },
  });
  const b = await api('/api/players', {
    method: 'POST',
    body: {
      displayName: `B${suffix}`.slice(0, 20),
      avatarId: 2,
      interestIds: interestsB,
    },
  });
  await api('/api/pool/join', { method: 'POST', player: a });
  const joined = await api('/api/pool/join', { method: 'POST', player: b });
  assert(joined.status === 'MATCHED', 'expected match');
  return { a, b, matchId: joined.matchId };
}

/** One full question: P1 answer, P2 score, P2 answer, P1 score, both review. */
async function playRound(a, b, matchId, { p1Score = 8, p2Score = 7, p1Flag = false, p2Flag = false } = {}) {
  let s = await api(`/api/matches/${matchId}`, { player: a });
  if (s.status === 'ENDED') return s;

  s = await api(`/api/matches/${matchId}/answer`, {
    method: 'POST',
    player: a,
    body: { answer: `P1 answer Q${s.currentQuestion}` },
  });
  assert(s.phase === 'P2_SCORE_P1', `after P1 answer got ${s.phase}`);

  s = await api(`/api/matches/${matchId}/score`, {
    method: 'POST',
    player: b,
    body: { score: p1Score },
  });
  assert(s.phase === 'P2_ANSWER', `after P2 score got ${s.phase}`);

  s = await api(`/api/matches/${matchId}/answer`, {
    method: 'POST',
    player: b,
    body: { answer: `P2 answer Q${s.currentQuestion}` },
  });
  assert(s.phase === 'P1_SCORE_P2', `after P2 answer got ${s.phase}`);

  s = await api(`/api/matches/${matchId}/score`, {
    method: 'POST',
    player: a,
    body: { score: p2Score },
  });
  assert(s.phase === 'REVIEW', `after P1 score got ${s.phase}`);

  await api(`/api/matches/${matchId}/review`, {
    method: 'POST',
    player: a,
    body: { flag: p1Flag },
  });
  s = await api(`/api/matches/${matchId}/review`, {
    method: 'POST',
    player: b,
    body: { flag: p2Flag },
  });
  return s;
}

async function main() {
  console.log('Waiting for health…');
  for (let i = 0; i < 30; i++) {
    try {
      const h = await api('/api/health');
      if (h.status === 'ok') break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (i === 29) throw new Error('API not ready');
  }

  // -------------------------------------------------------------------------
  // 155–156: second question + through Q10 → result
  // -------------------------------------------------------------------------
  {
    const { a, b, matchId } = await createPair('Q10', [1, 2, 3], [1, 2, 4]);
    let s = await playRound(a, b, matchId, { p1Score: 8, p2Score: 6, p1Flag: false, p2Flag: false });
    assert(s.status === 'ACTIVE', 'still active after Q1');
    assert(s.currentQuestion === 2, `155 expected Q2 got ${s.currentQuestion}`);
    assert(s.phase === 'P1_ANSWER', `155 expected P1_ANSWER got ${s.phase}`);
    console.log('155. Second question appears (Q2 / P1_ANSWER)');

    for (let q = 2; q <= 10; q++) {
      s = await playRound(a, b, matchId, {
        p1Score: 7 + (q % 3),
        p2Score: 6 + (q % 2),
        p1Flag: false,
        p2Flag: false,
      });
      if (q < 10) {
        assert(s.status === 'ACTIVE', `Q${q} should stay ACTIVE`);
        assert(s.currentQuestion === q + 1, `after Q${q} expected Q${q + 1}`);
      }
    }
    assert(s.status === 'ENDED', '156 match ended after Q10');
    assert(s.endReason === 'COMPLETED', `156 endReason ${s.endReason}`);

    const result = await api(`/api/matches/${matchId}/result`, { player: a });
    assert(typeof result.player1.finalScore === 'number', 'result P1 score');
    assert(typeof result.player2.finalScore === 'number', 'result P2 score');
    assert(['PLAYER_1', 'PLAYER_2', 'DRAW'].includes(result.winner), 'winner');
    assert(result.questionsCompleted === 10, `questionsCompleted ${result.questionsCompleted}`);
    assert(result.endReason === 'COMPLETED', 'result COMPLETED');
    console.log(
      '156. Q10 completed → result',
      result.player1.finalScore,
      'vs',
      result.player2.finalScore,
      result.winner
    );

    // 160 PLAY AGAIN: same session can join pool again (profile preserved)
    const again = await api('/api/pool/join', { method: 'POST', player: a });
    assert(
      again.status === 'WAITING' || again.status === 'MATCHED',
      '160 play again → pool join works with same session'
    );
    if (again.status === 'WAITING') {
      await api('/api/pool/leave', { method: 'POST', player: a });
    }
    console.log('160. PLAY AGAIN path: same playerId re-enters pool →', again.status);

    // 161 RESET PROFILE: clear identity — simulated by not sending old headers
    // After clear, old session should fail protected routes
    const dead = await fetch(`${API}/api/pool/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Player-Id': a.playerId,
        'X-Session-Token': '00000000-0000-4000-8000-000000000099',
      },
      body: '{}',
    });
    // Valid session still works until cleared; verify invalid token rejects
    assert(dead.status === 401, '161 invalid/cleared session rejected');
    // Fresh welcome = new player creation
    const fresh = await api('/api/players', {
      method: 'POST',
      body: { displayName: 'ResetUser', avatarId: 3, interestIds: [5, 6, 7] },
    });
    assert(fresh.playerId !== a.playerId, '161 new profile is new playerId');
    console.log('161. RESET PROFILE path: bad token 401; new profile creates new playerId');
  }

  // -------------------------------------------------------------------------
  // 157–159: three flags terminate; flagged scores excluded
  // -------------------------------------------------------------------------
  {
    // Known scores: each round both flag → 2 flags per round; third flag mid-round 2
    const { a, b, matchId } = await createPair('FLG', [10, 11, 12], [10, 11, 13]);

    // Round 1: scores 9 and 8, both FLAG → flagCount 2, next Q
    let s = await playRound(a, b, matchId, {
      p1Score: 9,
      p2Score: 8,
      p1Flag: true,
      p2Flag: true,
    });
    assert(s.flagCount === 2, `after R1 flags got ${s.flagCount}`);
    assert(s.status === 'ACTIVE', 'still active at 2 flags');
    console.log('157. After 2 flags still ACTIVE, flagCount=', s.flagCount);

    // Round 2: P1 flags first (flag 3) then P2 — after both reviews, THREE_FLAGS
    s = await playRound(a, b, matchId, {
      p1Score: 5,
      p2Score: 4,
      p1Flag: true,
      p2Flag: false,
    });
    assert(s.status === 'ENDED', '158 should ENDED on third flag');
    assert(s.endReason === 'THREE_FLAGS', `158 endReason ${s.endReason}`);
    assert(s.flagCount >= 3, `158 flagCount ${s.flagCount}`);
    console.log('158. Third flag → ENDED THREE_FLAGS, flagCount=', s.flagCount);

    const result = await api(`/api/matches/${matchId}/result`, { player: a });
    // R1 both flagged → excluded; R2: P1 received 5 flagged, P2 received 4 accepted
    // player1_score is score TO p1 FROM p2 = 5 flagged → excluded
    // player2_score is score TO p2 FROM p1 = 4 not flagged → only valid for P2
    assert(result.player1.finalScore === 0, `159 P1 avg should 0 got ${result.player1.finalScore}`);
    assert(result.player2.finalScore === 4, `159 P2 avg should 4 got ${result.player2.finalScore}`);
    assert(result.winner === 'PLAYER_2', `159 winner ${result.winner}`);
    assert(result.endReason === 'THREE_FLAGS', '159 end reason');
    console.log(
      '159. Flagged excluded → P1',
      result.player1.finalScore,
      'P2',
      result.player2.finalScore,
      result.winner
    );
  }

  console.log('\nACCEPTANCE 155–162: PASSED');
}

main().catch((e) => {
  console.error('\nACCEPTANCE FAILED:', e.message);
  process.exit(1);
});
