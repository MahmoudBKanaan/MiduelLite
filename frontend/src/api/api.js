/**
 * Small API helper:
 * - base URL
 * - JSON requests with session headers (playerId / sessionToken from sessionStorage)
 * - user-readable errors only (never stack traces)
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ---------------------------------------------------------------------------
// sessionStorage helpers — survive page refresh within the browser tab
// ---------------------------------------------------------------------------

export function getPlayerId() {
  return sessionStorage.getItem('playerId');
}

export function getSessionToken() {
  return sessionStorage.getItem('sessionToken');
}

/** Persist temporary session identity (survives refresh). */
export function saveSession(playerId, sessionToken) {
  sessionStorage.setItem('playerId', playerId);
  sessionStorage.setItem('sessionToken', sessionToken);
}

/** Clear temporary session identity. */
export function clearSession() {
  sessionStorage.removeItem('playerId');
  sessionStorage.removeItem('sessionToken');
  sessionStorage.removeItem('displayName');
  sessionStorage.removeItem('avatarId');
  sessionStorage.removeItem('interestIds');
}

/**
 * True when both playerId and sessionToken are present (valid enough for API headers).
 * Used by protected pages after refresh.
 */
export function hasSession() {
  const id = getPlayerId();
  const token = getSessionToken();
  return Boolean(id && token && id.length > 0 && token.length > 0);
}

// ---------------------------------------------------------------------------
// Safe user-facing errors (item 123–124)
// ---------------------------------------------------------------------------

/**
 * Convert any thrown value into one short user-readable message.
 * Never returns stack traces or raw objects.
 * @param {unknown} err
 * @param {string} [fallback]
 * @returns {string}
 */
export function formatUserError(err, fallback = 'Something went wrong. Please try again.') {
  if (err == null) return fallback;

  // Prefer our Error.message from request()
  let message = '';
  if (typeof err === 'string') {
    message = err;
  } else if (err instanceof Error) {
    message = err.message || '';
  } else if (typeof err === 'object' && typeof err.message === 'string') {
    message = err.message;
  }

  // Strip anything that looks like a stack / technical dump
  message = String(message)
    .split('\n')[0]
    .replace(/\s+at\s+\S+.*/g, '')
    .trim();

  // Reject oversized / stack-like payloads
  if (
    !message ||
    message.length > 200 ||
    /stack|exception|node_modules|file:\/\//i.test(message)
  ) {
    if (err && typeof err === 'object' && err.status === 401) {
      return 'Your session is invalid. Please create a new profile.';
    }
    if (err && typeof err === 'object' && err.status === 0) {
      return 'Network error — is the backend running?';
    }
    return fallback;
  }

  return message;
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function sessionHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const playerId = getPlayerId();
  const sessionToken = getSessionToken();
  // Reuse sessionStorage values after refresh for protected API calls
  if (playerId && sessionToken) {
    headers['X-Player-Id'] = playerId;
    headers['X-Session-Token'] = sessionToken;
  }
  return headers;
}

/**
 * JSON request to the backend.
 * Throws Error with .status and a short .message (never a stack for the UI).
 */
async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...sessionHeaders(),
        ...(options.headers || {}),
      },
    });
  } catch {
    const err = new Error('Network error — is the backend running?');
    err.status = 0;
    throw err;
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    // Backend uses { error: "Human-readable message" } — never expose stack
    const text =
      typeof data.error === 'string' && data.error.length > 0
        ? data.error
        : res.status === 401
          ? 'Your session is invalid. Please create a new profile.'
          : res.status === 403
            ? 'That action is not allowed right now.'
            : res.status === 404
              ? 'Not found.'
              : res.status === 409
                ? 'The match state has changed. Please wait a moment.'
                : 'Request failed. Please try again.';

    const err = new Error(text);
    err.status = res.status;
    throw err;
  }

  return data;
}

export function getApiBaseUrl() {
  return API_URL;
}

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

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

/**
 * Mark spoken answer complete (no body — LiveKit audio only).
 * Session headers X-Player-Id / X-Session-Token are attached by request().
 */
export function completeAnswer(matchId) {
  return request(`/api/matches/${matchId}/answer-complete`, {
    method: 'POST',
    body: '{}',
  });
}

/**
 * Request a LiveKit access token for the current match.
 * Session headers X-Player-Id / X-Session-Token are attached by request().
 * @returns {Promise<{ token: string, serverUrl: string }>}
 */
export function getAudioToken(matchId) {
  return request(`/api/matches/${matchId}/audio-token`, {
    method: 'POST',
    body: '{}',
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
