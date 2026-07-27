import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import 'dotenv/config';
import { createApp } from '../src/app.js';
import { validatePlayerInput } from '../src/services/playerValidation.js';
import { resetMatchmakingState } from './helpers.js';

const app = createApp();
const hasDb = Boolean(process.env.DATABASE_URL);

describe('validatePlayerInput (item 34)', () => {
  it('accepts a valid profile and trims display name', () => {
    const result = validatePlayerInput({
      displayName: '  Neo  ',
      avatarId: 4,
      interestIds: [1, 4, 8],
    });
    expect(result.ok).toBe(true);
    expect(result.displayName).toBe('Neo');
    expect(result.avatarId).toBe(4);
    expect(result.interestIds).toEqual([1, 4, 8]);
  });

  it('rejects missing display name', () => {
    expect(validatePlayerInput({ avatarId: 1, interestIds: [1, 2, 3] }).ok).toBe(
      false
    );
  });

  it('rejects display name shorter than 2 after trim', () => {
    expect(
      validatePlayerInput({
        displayName: ' A ',
        avatarId: 1,
        interestIds: [1, 2, 3],
      }).ok
    ).toBe(false);
  });

  it('rejects display name longer than 20', () => {
    expect(
      validatePlayerInput({
        displayName: 'A'.repeat(21),
        avatarId: 1,
        interestIds: [1, 2, 3],
      }).ok
    ).toBe(false);
  });

  it('rejects avatar outside 1–12', () => {
    expect(
      validatePlayerInput({
        displayName: 'Neo',
        avatarId: 99,
        interestIds: [1, 2, 3],
      }).ok
    ).toBe(false);
  });

  it('rejects fewer or more than three interests', () => {
    expect(
      validatePlayerInput({
        displayName: 'Neo',
        avatarId: 1,
        interestIds: [1, 2],
      }).ok
    ).toBe(false);
    expect(
      validatePlayerInput({
        displayName: 'Neo',
        avatarId: 1,
        interestIds: [1, 2, 3, 4],
      }).ok
    ).toBe(false);
  });

  it('rejects interest IDs outside 1–32', () => {
    expect(
      validatePlayerInput({
        displayName: 'Neo',
        avatarId: 1,
        interestIds: [1, 2, 99],
      }).ok
    ).toBe(false);
  });

  it('rejects duplicate interests', () => {
    expect(
      validatePlayerInput({
        displayName: 'Neo',
        avatarId: 1,
        interestIds: [1, 1, 2],
      }).ok
    ).toBe(false);
  });
});

describe.skipIf(!hasDb)('POST /api/players (items 33, 35, 36)', () => {
  it('creates player and returns playerId + sessionToken UUIDs', async () => {
    const res = await request(app).post('/api/players').send({
      displayName: 'Neo',
      avatarId: 4,
      interestIds: [1, 4, 8],
    });
    expect(res.status).toBe(201);
    expect(res.body.playerId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(res.body.sessionToken).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('rejects invalid profile with 400', async () => {
    const res = await request(app).post('/api/players').send({
      displayName: 'X',
      avatarId: 99,
      interestIds: [1],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe.skipIf(!hasDb)('requireSession (items 31–32)', () => {
  beforeEach(async () => {
    await resetMatchmakingState();
  });

  it('rejects pool join without session headers', async () => {
    const res = await request(app).post('/api/pool/join');
    expect(res.status).toBe(401);
  });

  it('rejects wrong session token', async () => {
    const created = await request(app).post('/api/players').send({
      displayName: 'TokenTest',
      avatarId: 2,
      interestIds: [5, 6, 7],
    });
    const res = await request(app)
      .post('/api/pool/join')
      .set('X-Player-Id', created.body.playerId)
      .set('X-Session-Token', '00000000-0000-4000-8000-000000000000');
    expect(res.status).toBe(401);
  });
});
