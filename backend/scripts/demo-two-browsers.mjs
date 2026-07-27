/**
 * Simulates Browser A + Browser B demo flow against a running stack.
 * Items 149–154 (API-level dual session).
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
    throw new Error(`${method} ${path} → ${res.status} ${data.error || ''}`);
  }
  return data;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function waitForHealth() {
  for (let i = 0; i < 40; i++) {
    try {
      const h = await api('/api/health');
      if (h.status === 'ok') return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Backend health not ready');
}

async function main() {
  console.log('API', API);
  await waitForHealth();
  console.log('146–147. Stack ready (clean DB after compose down -v)');

  // Browser A profile (2 shared with B: Technology, Science)
  const playerA = await api('/api/players', {
    method: 'POST',
    body: {
      displayName: 'Neo',
      avatarId: 1,
      interestIds: [1, 4, 8], // Technology, Science, Philosophy
    },
  });
  console.log('149. Browser A profile created', playerA.playerId);

  // Browser B profile
  const playerB = await api('/api/players', {
    method: 'POST',
    body: {
      displayName: 'Alex',
      avatarId: 2,
      interestIds: [1, 4, 10], // Technology, Science, History — 2 shared
    },
  });
  console.log('149. Browser B profile created', playerB.playerId);

  const joinA = await api('/api/pool/join', { method: 'POST', player: playerA });
  console.log('150. Browser A pool →', joinA.status);
  assert(joinA.status === 'WAITING', 'A should wait first');

  const joinB = await api('/api/pool/join', { method: 'POST', player: playerB });
  console.log('150–151. Browser B pool →', joinB.status, joinB.matchId);
  assert(joinB.status === 'MATCHED', 'B should be matched');

  const statusA = await api('/api/pool/status', { player: playerA });
  assert(statusA.status === 'MATCHED', 'A should also be MATCHED');
  assert(statusA.matchId === joinB.matchId, 'Shared matchId');
  const matchId = joinB.matchId;
  console.log('152. Same matchId for both:', matchId);

  const stateA = await api(`/api/matches/${matchId}`, { player: playerA });
  const stateB = await api(`/api/matches/${matchId}`, { player: playerB });
  assert(stateA.role === 'PLAYER_1', 'A is Player 1 (waiting)');
  assert(stateB.role === 'PLAYER_2', 'B is Player 2 (joiner)');
  assert(stateA.questionText && stateA.questionText === stateB.questionText, 'Same question');
  assert(stateA.currentQuestion === 1, 'Q1');
  console.log('153. Same question:', stateA.questionText.slice(0, 70) + '...');

  // 154 full sequence
  let s = await api(`/api/matches/${matchId}/answer`, {
    method: 'POST',
    player: playerA,
    body: { answer: 'Demo P1: technology improves access to knowledge.' },
  });
  assert(s.phase === 'P2_SCORE_P1', `phase ${s.phase}`);
  console.log('154. P1 answered →', s.phase);

  s = await api(`/api/matches/${matchId}/score`, {
    method: 'POST',
    player: playerB,
    body: { score: 8 },
  });
  assert(s.phase === 'P2_ANSWER', `phase ${s.phase}`);
  console.log('154. P2 scored →', s.phase);

  s = await api(`/api/matches/${matchId}/answer`, {
    method: 'POST',
    player: playerB,
    body: { answer: 'Demo P2: progress needs ethical limits.' },
  });
  assert(s.phase === 'P1_SCORE_P2', `phase ${s.phase}`);
  console.log('154. P2 answered →', s.phase);

  s = await api(`/api/matches/${matchId}/score`, {
    method: 'POST',
    player: playerA,
    body: { score: 7 },
  });
  assert(s.phase === 'REVIEW', `phase ${s.phase}`);
  console.log('154. P1 scored →', s.phase);

  s = await api(`/api/matches/${matchId}/review`, {
    method: 'POST',
    player: playerA,
    body: { flag: false },
  });
  assert(s.phase === 'REVIEW', 'still REVIEW until both');
  s = await api(`/api/matches/${matchId}/review`, {
    method: 'POST',
    player: playerB,
    body: { flag: false },
  });
  assert(s.phase === 'P1_ANSWER', `after reviews ${s.phase}`);
  assert(s.currentQuestion === 2, `next Q ${s.currentQuestion}`);
  console.log('154. Both reviewed → Q', s.currentQuestion, s.phase);

  // Frontend reachability (item 148 readiness)
  const fe = await fetch('http://localhost:5173');
  assert(fe.ok, 'Frontend not reachable');
  console.log('148. Frontend http://localhost:5173 →', fe.status);

  console.log('\nDEMO TWO-BROWSER FLOW: PASSED (API dual-session)');
  console.log('Open Chrome + Incognito at http://localhost:5173 for live UI demo.');
}

main().catch((e) => {
  console.error('\nDEMO FAILED:', e.message);
  process.exit(1);
});
