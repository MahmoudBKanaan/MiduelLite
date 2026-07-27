import { clearSession, hasSession } from './api/api.js';

/**
 * Protected pages: Pool, Match, Result.
 * If playerId/sessionToken are missing after refresh → Welcome.
 * @param {import('react-router-dom').NavigateFunction} navigate
 * @returns {boolean} true if session is present
 */
export function requireSessionOrRedirect(navigate) {
  if (!hasSession()) {
    clearSession();
    navigate('/');
    return false;
  }
  return true;
}

/**
 * On 401 invalid session from API, drop local identity and go to Welcome.
 */
export function handleAuthFailure(err, navigate) {
  if (err && err.status === 401) {
    clearSession();
    navigate('/');
    return true;
  }
  return false;
}
