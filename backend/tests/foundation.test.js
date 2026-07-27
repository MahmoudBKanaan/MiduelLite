import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { INTERESTS, AVATAR_IDS } from '../src/config/interests.js';

const app = createApp();

describe('Backend foundation (items 23–30)', () => {
  it('GET /api/health returns { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/config returns 32 interests and avatar IDs 1–12', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.interests).toHaveLength(32);
    expect(res.body.avatarIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(INTERESTS).toHaveLength(32);
    expect(AVATAR_IDS).toEqual(res.body.avatarIds);
    expect(res.body.interests[0]).toMatchObject({ id: 1, name: 'Technology' });
    expect(res.body.interests[31]).toMatchObject({ id: 32, name: 'Future' });
  });

  it('unknown routes return JSON error without stack', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
    expect(res.body.stack).toBeUndefined();
  });
});
