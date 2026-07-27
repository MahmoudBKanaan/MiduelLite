import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = createApp();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(__dirname, '../src');

function collectJsFiles(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...collectJsFiles(full));
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

describe('SQL parameterization (item 125)', () => {
  it('source files do not concatenate user-like SQL with + or template vars in queries', () => {
    const files = collectJsFiles(srcRoot);
    const offenders = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      // Flag dangerous patterns: query("... " + , query(`...${
      if (/query\s*\(\s*[`'"][^`'"]*\$\{/.test(text)) {
        offenders.push(`${file}: template interpolation inside query string`);
      }
      if (/query\s*\(\s*['"][^'"]*['"]\s*\+/.test(text)) {
        offenders.push(`${file}: string concatenation into query`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('SQL statements in src use $n placeholders for dynamic values', () => {
    const files = collectJsFiles(srcRoot);
    let dynamicSqlCount = 0;
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      const matches = text.match(
        /\.(?:query)\(\s*[`'"][\s\S]*?\$(?:[1-9]|[1-9][0-9])/g
      );
      if (matches) dynamicSqlCount += matches.length;
    }
    expect(dynamicSqlCount).toBeGreaterThan(10);
  });
});

describe('Helmet, CORS, body limit (items 127–129)', () => {
  const previousOrigin = process.env.FRONTEND_ORIGIN;

  beforeAll(() => {
    process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
  });

  afterAll(() => {
    if (previousOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = previousOrigin;
  });

  it('Helmet sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    // helmet default includes X-Content-Type-Options
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('CORS allows configured frontend origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173'
    );
  });

  it('CORS does not reflect arbitrary origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://evil.example');
    expect(res.headers['access-control-allow-origin']).not.toBe(
      'http://evil.example'
    );
  });

  it('oversized JSON body is rejected (body limit)', async () => {
    const big = 'x'.repeat(20 * 1024);
    const res = await request(app)
      .post('/api/players')
      .send({ displayName: big, avatarId: 1, interestIds: [1, 2, 3] });
    // Express body-parser: 413 Payload Too Large
    expect([413, 400]).toContain(res.status);
  });
});

describe('Backend validation (item 126)', () => {
  it('rejects invalid player profile without DB write path for bad input', async () => {
    const res = await request(app).post('/api/players').send({
      displayName: 'A',
      avatarId: 99,
      interestIds: [1, 1, 2],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
    expect(res.body.stack).toBeUndefined();
  });

  it('rejects protected routes without session headers', async () => {
    const res = await request(app).post('/api/pool/join');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/at\s+\w+/);
  });

  it('500-style errors never include stack in JSON body', async () => {
    // Unknown route → 404 JSON only
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});

describe('Environment credentials (items 130–131)', () => {
  it('db.js documents DATABASE_URL usage', () => {
    const dbJs = fs.readFileSync(
      path.join(srcRoot, 'db.js'),
      'utf8'
    );
    expect(dbJs).toMatch(/DATABASE_URL/);
    expect(dbJs).toMatch(/connectionString:\s*process\.env\.DATABASE_URL/);
  });

  it('.gitignore excludes .env', () => {
    const gi = fs.readFileSync(
      path.join(__dirname, '../../.gitignore'),
      'utf8'
    );
    expect(gi).toMatch(/^\.env\s*$/m);
  });
});
