import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSession,
  clearSession,
  hasSession,
  getPlayerId,
  getSessionToken,
  getApiBaseUrl,
} from '../src/api/api.js';

describe('sessionStorage helpers (item 76)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('saveSession stores playerId and sessionToken', () => {
    saveSession('pid-1', 'tok-1');
    expect(getPlayerId()).toBe('pid-1');
    expect(getSessionToken()).toBe('tok-1');
    expect(hasSession()).toBe(true);
  });

  it('clearSession removes playerId and sessionToken', () => {
    saveSession('pid-1', 'tok-1');
    clearSession();
    expect(getPlayerId()).toBeNull();
    expect(getSessionToken()).toBeNull();
    expect(hasSession()).toBe(false);
  });

  it('hasSession is false when only one value is set', () => {
    sessionStorage.setItem('playerId', 'only');
    expect(hasSession()).toBe(false);
  });
});

describe('API helper (item 75)', () => {
  it('exposes API base URL', () => {
    expect(getApiBaseUrl()).toMatch(/^http/);
  });
});
