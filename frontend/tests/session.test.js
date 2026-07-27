import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSession,
  clearSession,
  hasSession,
  getPlayerId,
  getSessionToken,
  formatUserError,
} from '../src/api/api.js';
import {
  requireSessionOrRedirect,
  handleAuthFailure,
} from '../src/sessionGuard.js';

describe('session refresh reuse (item 121)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('hasSession is true after saveSession (survives in-tab refresh storage)', () => {
    saveSession('player-uuid', 'token-uuid');
    expect(hasSession()).toBe(true);
    expect(getPlayerId()).toBe('player-uuid');
    expect(getSessionToken()).toBe('token-uuid');
  });

  it('hasSession is false without both values', () => {
    expect(hasSession()).toBe(false);
    sessionStorage.setItem('playerId', 'only-id');
    expect(hasSession()).toBe(false);
  });
});

describe('protected page redirect (item 122)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('redirects to Welcome when no session', () => {
    const navigate = vi.fn();
    expect(requireSessionOrRedirect(navigate)).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('allows access when session exists', () => {
    saveSession('p', 't');
    const navigate = vi.fn();
    expect(requireSessionOrRedirect(navigate)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('user-readable errors without stacks (items 123–124)', () => {
  it('returns short message from Error', () => {
    expect(formatUserError(new Error('Display name is required'))).toBe(
      'Display name is required'
    );
  });

  it('never returns multi-line stack traces', () => {
    const stacked = new Error('Boom\n    at Object.<anonymous> (file.js:1:1)');
    const msg = formatUserError(stacked);
    expect(msg).not.toMatch(/at Object/);
    expect(msg).not.toMatch(/file\.js/);
    expect(msg.split('\n')).toHaveLength(1);
  });

  it('falls back for empty or technical dumps', () => {
    expect(formatUserError({})).toMatch(/try again/i);
    expect(
      formatUserError({ message: 'Error in node_modules/foo' })
    ).toMatch(/try again/i);
  });

  it('401 clears session and redirects', () => {
    saveSession('p', 't');
    const navigate = vi.fn();
    const err = new Error('Invalid session');
    err.status = 401;
    expect(handleAuthFailure(err, navigate)).toBe(true);
    expect(hasSession()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
