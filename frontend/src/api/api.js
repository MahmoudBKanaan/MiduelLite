const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function sessionHeaders() {
  const playerId = sessionStorage.getItem('playerId');
  const sessionToken = sessionStorage.getItem('sessionToken');
  const headers = { 'Content-Type': 'application/json' };
  if (playerId && sessionToken) {
    headers['X-Player-Id'] = playerId;
    headers['X-Session-Token'] = sessionToken;
  }
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...sessionHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getConfig() {
  return request('/api/config');
}

export function createPlayer(body) {
  return request('/api/players', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function joinPool() {
  return request('/api/pool/join', { method: 'POST', body: '{}' });
}

export function poolStatus() {
  return request('/api/pool/status');
}

export function leavePool() {
  return request('/api/pool/leave', { method: 'POST', body: '{}' });
}

export function getMatch(matchId) {
  return request(`/api/matches/${matchId}`);
}

export function submitAnswer(matchId, answer) {
  return request(`/api/matches/${matchId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  });
}

export function submitScore(matchId, score) {
  return request(`/api/matches/${matchId}/score`, {
    method: 'POST',
    body: JSON.stringify({ score }),
  });
}

export function submitReview(matchId, flag) {
  return request(`/api/matches/${matchId}/review`, {
    method: 'POST',
    body: JSON.stringify({ flag }),
  });
}

export function getResult(matchId) {
  return request(`/api/matches/${matchId}/result`);
}

export function saveSession(playerId, sessionToken) {
  sessionStorage.setItem('playerId', playerId);
  sessionStorage.setItem('sessionToken', sessionToken);
}

export function clearSession() {
  sessionStorage.removeItem('playerId');
  sessionStorage.removeItem('sessionToken');
  sessionStorage.removeItem('displayName');
  sessionStorage.removeItem('avatarId');
  sessionStorage.removeItem('interestIds');
}

export function hasSession() {
  return Boolean(
    sessionStorage.getItem('playerId') && sessionStorage.getItem('sessionToken')
  );
}
