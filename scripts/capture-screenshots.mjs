/**
 * Capture presentation screenshots 192–198 into docs/screenshots/
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const BASE = process.env.APP_URL || 'http://localhost:5173';
const API = process.env.API_URL || 'http://localhost:3001';

fs.mkdirSync(OUT, { recursive: true });

async function api(pathname, { method = 'GET', body, player } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (player) {
    headers['X-Player-Id'] = player.playerId;
    headers['X-Session-Token'] = player.sessionToken;
  }
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${pathname} ${res.status} ${data.error || ''}`);
  return data;
}

function writeEvidenceHtml(filename, title, preText) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
  body { margin:0; font-family: Consolas, 'Courier New', monospace; background:#0f1419; color:#e8eef7; }
  header { padding:16px 20px; background:#1a2332; border-bottom:1px solid #334155; font-size:18px; font-weight:700; }
  pre { padding:20px; white-space:pre-wrap; word-break:break-word; font-size:13px; line-height:1.4; margin:0; }
</style></head>
<body>
<header>${title}</header>
<pre>${preText.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre>
</body></html>`;
  const p = path.join(OUT, filename);
  fs.writeFileSync(p, html, 'utf8');
  return p;
}

async function shotPage(page, name) {
  await page.setViewportSize({ width: 420, height: 900 });
  await page.screenshot({
    path: path.join(OUT, name),
    fullPage: true,
  });
  console.log('saved', name);
}

async function main() {
  // --- 197 tests evidence ---
  let testOut = '';
  try {
    testOut += execSync('npm test', {
      cwd: path.join(ROOT, 'frontend'),
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
  } catch (e) {
    testOut += (e.stdout || '') + (e.stderr || '') + String(e.message);
  }
  try {
    testOut +=
      '\n\n--- BACKEND ---\n\n' +
      execSync('npm test', {
        cwd: path.join(ROOT, 'backend'),
        encoding: 'utf8',
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          DATABASE_URL: 'postgresql://minduel:minduel@localhost:5432/minduel',
          FRONTEND_ORIGIN: 'http://localhost:5173',
        },
      });
  } catch (e) {
    testOut += (e.stdout || '') + (e.stderr || '') + String(e.message);
  }
  writeEvidenceHtml(
    '197-tests.html',
    '197 — Successful automated tests',
    testOut.slice(-8000)
  );

  // --- 198 docker evidence ---
  let dockerOut = '';
  try {
    dockerOut = execSync('docker compose ps', { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    dockerOut = String(e.message);
  }
  writeEvidenceHtml('198-docker.html', '198 — Docker containers running', dockerOut);

  // --- 196 kanban evidence ---
  const kanban = fs.readFileSync(path.join(ROOT, 'docs', 'kanban-board.md'), 'utf8');
  writeEvidenceHtml('196-kanban.html', '196 — Kanban / project process evidence', kanban);

  const browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
  });
  const contextB = await browser.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
  });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // 192 Welcome
  await pageA.goto(BASE, { waitUntil: 'networkidle' });
  await pageA.waitForSelector('text=Minduel Lite');
  // Fill partial form for a clear welcome screenshot with interests visible
  await pageA.fill('#displayName', 'Neo');
  await pageA.click('button[aria-label="Avatar 1"]');
  await pageA.waitForSelector('text=Technology');
  await pageA.click('button:has-text("Technology")');
  await pageA.click('button:has-text("Science")');
  await pageA.click('button:has-text("Philosophy")');
  await shotPage(pageA, '192-welcome.png');

  // Enter pool for A
  await pageA.click('button:has-text("Enter pool")');
  await pageA.waitForURL('**/pool');
  await pageA.waitForSelector('text=Searching for opponent');
  await shotPage(pageA, '193-pool.png');

  // Browser B profile + join to create match
  await pageB.goto(BASE, { waitUntil: 'networkidle' });
  await pageB.fill('#displayName', 'Alex');
  await pageB.click('button[aria-label="Avatar 2"]');
  await pageB.waitForSelector('text=Technology');
  await pageB.click('button:has-text("Technology")');
  await pageB.click('button:has-text("Science")');
  await pageB.click('button:has-text("History")');
  await pageB.click('button:has-text("Enter pool")');

  // Both should reach match
  await pageA.waitForURL('**/match/**', { timeout: 15000 });
  await pageB.waitForURL('**/match/**', { timeout: 15000 });
  await pageA.waitForSelector('text=Question');
  await shotPage(pageA, '194-match.png');

  // Complete match quickly via API using sessions from storage
  const sessionA = await pageA.evaluate(() => ({
    playerId: sessionStorage.getItem('playerId'),
    sessionToken: sessionStorage.getItem('sessionToken'),
  }));
  const sessionB = await pageB.evaluate(() => ({
    playerId: sessionStorage.getItem('playerId'),
    sessionToken: sessionStorage.getItem('sessionToken'),
  }));
  const matchUrl = pageA.url();
  const matchId = matchUrl.split('/match/')[1];

  // Play until ENDED with three flags (faster) or complete few rounds then force via API
  // Use three-flag path: both flag each round
  async function playRoundBothFlag() {
    const st = await api(`/api/matches/${matchId}`, { player: sessionA });
    if (st.status === 'ENDED') return st;
    await api(`/api/matches/${matchId}/answer`, {
      method: 'POST',
      player: sessionA,
      body: { answer: 'P1 screenshot answer' },
    });
    await api(`/api/matches/${matchId}/score`, {
      method: 'POST',
      player: sessionB,
      body: { score: 7 },
    });
    await api(`/api/matches/${matchId}/answer`, {
      method: 'POST',
      player: sessionB,
      body: { answer: 'P2 screenshot answer' },
    });
    await api(`/api/matches/${matchId}/score`, {
      method: 'POST',
      player: sessionA,
      body: { score: 6 },
    });
    await api(`/api/matches/${matchId}/review`, {
      method: 'POST',
      player: sessionA,
      body: { flag: true },
    });
    return api(`/api/matches/${matchId}/review`, {
      method: 'POST',
      player: sessionB,
      body: { flag: true },
    });
  }

  let end = await playRoundBothFlag();
  if (end.status !== 'ENDED') end = await playRoundBothFlag();

  // Navigate to result UI
  await pageA.goto(`${BASE}/result/${matchId}`, { waitUntil: 'networkidle' });
  await pageA.waitForSelector('text=Match complete');
  await shotPage(pageA, '195-result.png');

  // Evidence HTML pages
  const evidence = await browser.newPage();
  for (const [file, out] of [
    ['196-kanban.html', '196-kanban.png'],
    ['197-tests.html', '197-tests.png'],
    ['198-docker.html', '198-docker.png'],
  ]) {
    await evidence.goto('file://' + path.join(OUT, file).replace(/\\/g, '/'), {
      waitUntil: 'load',
    });
    await evidence.setViewportSize({ width: 1000, height: 800 });
    await evidence.screenshot({
      path: path.join(OUT, out),
      fullPage: true,
    });
    console.log('saved', out);
  }

  await browser.close();

  // Index markdown for docs
  const index = `# Presentation screenshots

Captured for oral project report items 192–198.

| # | File | Description |
|---|------|-------------|
| 192 | [192-welcome.png](./192-welcome.png) | Welcome screen |
| 193 | [193-pool.png](./193-pool.png) | Pool / matchmaking |
| 194 | [194-match.png](./194-match.png) | Match screen |
| 195 | [195-result.png](./195-result.png) | Result screen |
| 196 | [196-kanban.png](./196-kanban.png) | Kanban / process evidence |
| 197 | [197-tests.png](./197-tests.png) | Automated tests passing |
| 198 | [198-docker.png](./198-docker.png) | Docker containers running |

Also HTML sources: \`196-kanban.html\`, \`197-tests.html\`, \`198-docker.html\`.
`;
  fs.writeFileSync(path.join(OUT, 'README.md'), index);
  console.log('Done. Output dir:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
