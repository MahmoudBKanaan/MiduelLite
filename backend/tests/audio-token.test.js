import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import { resetMatchmakingState } from './helpers.js';
import { query } from '../src/db.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

const LIVEKIT_URL = 'wss://example.livekit.cloud';
const LIVEKIT_API_KEY = 'testkey_audio_token';
const LIVEKIT_API_SECRET = 'testsecret_audio_token_must_never_leak';

async function createPlayer(body) {
  return request(app).post('/api/players').send(body);
}

function hdr(res) {
  return {
    'X-Player-Id': res.body.playerId,
    'X-Session-Token': res.body.sessionToken,
  };
}

async function startMatch() {
  const a = await createPlayer({
    displayName: 'AudioP1',
    avatarId: 1,
    interestIds: [1, 2, 3],
  });
  const b = await createPlayer({
    displayName: 'AudioP2',
    avatarId: 2,
    interestIds: [1, 2, 4],
  });
  await request(app).post('/api/pool/join').set(hdr(a));
  const m = await request(app).post('/api/pool/join').set(hdr(b));
  return { a, b, matchId: m.body.matchId };
}

function enableLiveKitEnv() {
  process.env.LIVEKIT_URL = LIVEKIT_URL;
  process.env.LIVEKIT_API_KEY = LIVEKIT_API_KEY;
  process.env.LIVEKIT_API_SECRET = LIVEKIT_API_SECRET;
}

function assertNoSecretsLeaked(resBody) {
  const raw = JSON.stringify(resBody);
  expect(raw).not.toContain(LIVEKIT_API_SECRET);
  expect(raw).not.toContain(LIVEKIT_API_KEY);
  expect(resBody).not.toHaveProperty('LIVEKIT_API_SECRET');
  expect(resBody).not.toHaveProperty('LIVEKIT_API_KEY');
  expect(resBody).not.toHaveProperty('apiKey');
  expect(resBody).not.toHaveProperty('apiSecret');
  expect(resBody).not.toHaveProperty('secret');
}

describe.skipIf(!hasDb)('POST /api/matches/:matchId/audio-token', () => {
  const prev = {
    url: process.env.LIVEKIT_URL,
    key: process.env.LIVEKIT_API_KEY,
    secret: process.env.LIVEKIT_API_SECRET,
  };

  beforeEach(async () => {
    await resetMatchmakingState();
  });

  afterEach(() => {
    if (prev.url === undefined) delete process.env.LIVEKIT_URL;
    else process.env.LIVEKIT_URL = prev.url;
    if (prev.key === undefined) delete process.env.LIVEKIT_API_KEY;
    else process.env.LIVEKIT_API_KEY = prev.key;
    if (prev.secret === undefined) delete process.env.LIVEKIT_API_SECRET;
    else process.env.LIVEKIT_API_SECRET = prev.secret;
  });

  it('requires temporary session', async () => {
    const { matchId } = await startMatch();
    const res = await request(app).post(`/api/matches/${matchId}/audio-token`);
    expect(res.status).toBe(401);
  });

  it('valid ACTIVE match participant can request an audio token', async () => {
    enableLiveKitEnv();
    const { a, b, matchId } = await startMatch();

    const resA = await request(app)
      .post(`/api/matches/${matchId}/audio-token`)
      .set(hdr(a));
    expect(resA.status).toBe(200);
    expect(resA.body.token).toBeTruthy();
    expect(typeof resA.body.token).toBe('string');
    expect(resA.body.serverUrl).toBe(LIVEKIT_URL);

    const resB = await request(app)
      .post(`/api/matches/${matchId}/audio-token`)
      .set(hdr(b));
    expect(resB.status).toBe(200);
    expect(resB.body.token).toBeTruthy();
    expect(resB.body.serverUrl).toBe(LIVEKIT_URL);
  });

  it('player outside the match cannot request its audio token', async () => {
    enableLiveKitEnv();
    const { matchId } = await startMatch();
    const outsider = await createPlayer({
      displayName: 'Outsider',
      avatarId: 3,
      interestIds: [5, 6, 7],
    });

    const res = await request(app)
      .post(`/api/matches/${matchId}/audio-token`)
      .set(hdr(outsider));
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/not a participant|participant/i);
    assertNoSecretsLeaked(res.body);
  });

  it('ended match does not issue an active-match audio token', async () => {
    enableLiveKitEnv();
    const { a, matchId } = await startMatch();

    await query(
      `UPDATE matches
       SET status = 'ENDED', end_reason = 'COMPLETED', ended_at = NOW()
       WHERE id = $1`,
      [matchId]
    );

    const res = await request(app)
      .post(`/api/matches/${matchId}/audio-token`)
      .set(hdr(a));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/not active/i);
    expect(res.body).not.toHaveProperty('token');
    expect(res.body).not.toHaveProperty('serverUrl');
    assertNoSecretsLeaked(res.body);
  });

  it('returns token and serverUrl only — never LiveKit secret or API key', async () => {
    enableLiveKitEnv();
    const { a, matchId } = await startMatch();

    const res = await request(app)
      .post(`/api/matches/${matchId}/audio-token`)
      .set(hdr(a));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      token: expect.any(String),
      serverUrl: LIVEKIT_URL,
    });
    expect(Object.keys(res.body).sort()).toEqual(['serverUrl', 'token']);
    expect(res.body.token.length).toBeGreaterThan(20);
    assertNoSecretsLeaked(res.body);
  });

  it('returns readable 503 when LiveKit env is missing (no secrets/stack)', async () => {
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;

    const { a, matchId } = await startMatch();
    const res = await request(app)
      .post(`/api/matches/${matchId}/audio-token`)
      .set(hdr(a));

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/LiveKit audio is not configured/i);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|at Module/i);
    expect(res.body).not.toHaveProperty('token');
    assertNoSecretsLeaked(res.body);
  });
});
