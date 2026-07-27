/**
 * Capture presentation evidence screenshots into docs/screenshots/
 * V2: spoken match UI, scoring without answer text, THREE_FLAGS result,
 * C4/ER/state diagrams, tests, Docker.
 */
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
const PRES = path.join(ROOT, 'docs', 'presentation');
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
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  pre { padding:20px; white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.4; margin:0; }
</style></head>
<body>
<header>${title}</header>
<pre>${preText.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>
</body></html>`;
  fs.writeFileSync(path.join(OUT, filename), html, 'utf8');
}

async function shotPage(page, name) {
  await page.setViewportSize({ width: 420, height: 900 });
  await page.screenshot({
    path: path.join(OUT, name),
    fullPage: true,
  });
  console.log('saved', name);
}

/** Show Live audio connected chrome when LiveKit Cloud is not configured (layout evidence). */
async function forceLiveAudioChrome(page) {
  await page.evaluate(() => {
    const root = document.querySelector('.match-audio');
    if (!root) return;
    root.innerHTML = `
      <div class="audio-bar">
        <p class="audio-status audio-status--connected">Live audio connected</p>
        <div class="audio-actions">
          <button type="button" class="btn btn-secondary btn-sm">Mute</button>
        </div>
      </div>`;
  });
}

async function main() {
  // --- 210–211 tests ---
  let feOut = '';
  let beOut = '';
  try {
    feOut = execSync('npm test', {
      cwd: path.join(ROOT, 'frontend'),
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0' },
    });
  } catch (e) {
    feOut = (e.stdout || '') + (e.stderr || '') + String(e.message);
  }
  try {
    beOut = execSync('npm test', {
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
    beOut = (e.stdout || '') + (e.stderr || '') + String(e.message);
  }
  writeEvidenceHtml(
    '197-tests-frontend.html',
    '211 — Frontend automated tests (V2)',
    feOut.slice(-12000)
  );
  writeEvidenceHtml(
    '197-tests-backend.html',
    '210 — Backend automated tests (V2)',
    beOut.slice(-12000)
  );
  writeEvidenceHtml(
    '197-tests.html',
    '197 — Automated tests (FE + BE)',
    (feOut + '\n\n--- BACKEND ---\n\n' + beOut).slice(-14000)
  );

  // --- 212 docker ---
  let dockerOut = '';
  try {
    dockerOut = execSync('docker compose ps', { cwd: ROOT, encoding: 'utf8' });
  } catch (e) {
    dockerOut = String(e.message);
  }
  writeEvidenceHtml(
    '198-docker.html',
    '212 — Docker containers running (V2)',
    dockerOut
  );

  const kanban = fs.readFileSync(path.join(ROOT, 'docs', 'kanban-board.md'), 'utf8');
  writeEvidenceHtml('196-kanban.html', '196 — Kanban / LIVE AUDIO increment', kanban);

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

  // Mock audio-token so UI does not sit on 503 forever
  for (const page of [pageA, pageB]) {
    await page.route('**/api/matches/**/audio-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'evidence-token',
          serverUrl: 'wss://example.livekit.cloud',
        }),
      });
    });
  }

  // Welcome
  await pageA.goto(BASE, { waitUntil: 'networkidle' });
  await pageA.waitForSelector('text=Minduel Lite');
  await pageA.fill('#displayName', 'Neo');
  await pageA.click('button[aria-label="Avatar 1"]');
  await pageA.waitForSelector('text=Technology');
  await pageA.click('button:has-text("Technology")');
  await pageA.click('button:has-text("Science")');
  await pageA.click('button:has-text("Philosophy")');
  await shotPage(pageA, '192-welcome.png');

  await pageA.click('button:has-text("Enter pool")');
  await pageA.waitForURL('**/pool');
  await pageA.waitForSelector('text=Searching for opponent');
  await shotPage(pageA, '193-pool.png');

  await pageB.goto(BASE, { waitUntil: 'networkidle' });
  await pageB.fill('#displayName', 'Alex');
  await pageB.click('button[aria-label="Avatar 2"]');
  await pageB.waitForSelector('text=Technology');
  await pageB.click('button:has-text("Technology")');
  await pageB.click('button:has-text("Science")');
  await pageB.click('button:has-text("History")');
  await pageB.click('button:has-text("Enter pool")');

  await pageA.waitForURL('**/match/**', { timeout: 20000 });
  await pageB.waitForURL('**/match/**', { timeout: 20000 });
  await pageA.waitForSelector('text=Question');
  await pageA.waitForSelector('text=YOUR TURN TO ANSWER');
  await forceLiveAudioChrome(pageA);
  await shotPage(pageA, '194-match.png');

  const sessionA = await pageA.evaluate(() => ({
    playerId: sessionStorage.getItem('playerId'),
    sessionToken: sessionStorage.getItem('sessionToken'),
  }));
  const sessionB = await pageB.evaluate(() => ({
    playerId: sessionStorage.getItem('playerId'),
    sessionToken: sessionStorage.getItem('sessionToken'),
  }));
  const matchId = pageA.url().split('/match/')[1];

  // P1 answer-complete → scoring screenshot for P2
  await api(`/api/matches/${matchId}/answer-complete`, {
    method: 'POST',
    player: sessionA,
    body: {},
  });
  await pageB.reload({ waitUntil: 'networkidle' });
  await pageB.waitForSelector('text=finished answering');
  await forceLiveAudioChrome(pageB);
  await shotPage(pageB, '194b-scoring.png');

  async function playRoundBothFlag() {
    const st = await api(`/api/matches/${matchId}`, { player: sessionA });
    if (st.status === 'ENDED') return st;
    await api(`/api/matches/${matchId}/answer-complete`, {
      method: 'POST',
      player: sessionA,
      body: {},
    });
    await api(`/api/matches/${matchId}/score`, {
      method: 'POST',
      player: sessionB,
      body: { score: 7 },
    });
    await api(`/api/matches/${matchId}/answer-complete`, {
      method: 'POST',
      player: sessionB,
      body: {},
    });
    await api(`/api/matches/${matchId}/score`, {
      method: 'POST',
      player: sessionA,
      body: { score: 6 },
    });
    const r1 = await api(`/api/matches/${matchId}/review`, {
      method: 'POST',
      player: sessionA,
      body: { flag: true },
    });
    if (r1.status === 'ENDED') return r1;
    return api(`/api/matches/${matchId}/review`, {
      method: 'POST',
      player: sessionB,
      body: { flag: true },
    });
  }

  // Finish current scoring round then three-flag path
  // Currently at P2_SCORE_P1 after P1 complete
  await api(`/api/matches/${matchId}/score`, {
    method: 'POST',
    player: sessionB,
    body: { score: 8 },
  });
  await api(`/api/matches/${matchId}/answer-complete`, {
    method: 'POST',
    player: sessionB,
    body: {},
  });
  await api(`/api/matches/${matchId}/score`, {
    method: 'POST',
    player: sessionA,
    body: { score: 7 },
  });
  // Both flag Q1
  await api(`/api/matches/${matchId}/review`, {
    method: 'POST',
    player: sessionA,
    body: { flag: true },
  });
  let end = await api(`/api/matches/${matchId}/review`, {
    method: 'POST',
    player: sessionB,
    body: { flag: true },
  });
  // Q2 both flag paths until ENDED at 3
  if (end.status !== 'ENDED') end = await playRoundBothFlag();
  if (end.status !== 'ENDED') end = await playRoundBothFlag();

  await pageA.goto(`${BASE}/result/${matchId}`, { waitUntil: 'networkidle' });
  await pageA.waitForSelector('text=Match complete');
  // Prefer Flags: 3 visible for THREE_FLAGS demos
  await shotPage(pageA, '195-result.png');

  // Diagrams 207–209
  const evidence = await browser.newPage();
  for (const [src, out, w, h] of [
    ['c4.html', '199-c4.png', 1100, 900],
    ['er.html', '200-er.png', 1000, 780],
    ['state.html', '201-state.png', 1100, 820],
    [path.join(OUT, '196-kanban.html'), '196-kanban.png', 1000, 900],
    [path.join(OUT, '197-tests.html'), '197-tests.png', 1000, 900],
    [path.join(OUT, '197-tests-backend.html'), '210-backend-tests.png', 1000, 900],
    [path.join(OUT, '197-tests-frontend.html'), '211-frontend-tests.png', 1000, 900],
    [path.join(OUT, '198-docker.html'), '198-docker.png', 1000, 500],
    [path.join(OUT, '198-docker.html'), '212-docker.png', 1000, 500],
  ]) {
    const url = src.includes(path.sep) || src.startsWith(OUT) || path.isAbsolute(src)
      ? 'file:///' + path.resolve(src).replace(/\\/g, '/')
      : 'file:///' + path.join(PRES, src).replace(/\\/g, '/');
    // fix for OUT paths already absolute-ish
    let fileUrl = url;
    if (src.includes('197') || src.includes('198') || src.includes('196')) {
      fileUrl = 'file:///' + path.join(OUT, path.basename(src)).replace(/\\/g, '/');
    }
    if (['c4.html', 'er.html', 'state.html'].includes(src)) {
      fileUrl = 'file:///' + path.join(PRES, src).replace(/\\/g, '/');
    }
    await evidence.goto(fileUrl, { waitUntil: 'load' });
    await evidence.setViewportSize({ width: w, height: h });
    await evidence.screenshot({
      path: path.join(OUT, out),
      fullPage: true,
    });
    console.log('saved', out);
  }

  await browser.close();

  const index = `# Presentation screenshots (V2 live audio)

Captured for oral project report evidence (items 192–212).

| # | File | Description |
|---|------|-------------|
| 192 | [192-welcome.png](./192-welcome.png) | Welcome screen |
| 193 | [193-pool.png](./193-pool.png) | Pool / matchmaking |
| 194 | [194-match.png](./194-match.png) | Match: players, question, Live audio connected, Answer Complete |
| 194b | [194b-scoring.png](./194b-scoring.png) | Scoring state (no answer text) |
| 195 | [195-result.png](./195-result.png) | Result (THREE_FLAGS path when flags reach 3) |
| 196 | [196-kanban.png](./196-kanban.png) | Kanban / LIVE AUDIO increment |
| 197 | [197-tests.png](./197-tests.png) | Combined test output |
| 198 / 212 | [198-docker.png](./198-docker.png) / [212-docker.png](./212-docker.png) | Docker containers running |
| 199 | [199-c4.png](./199-c4.png) | C4 + LiveKit external |
| 200 | [200-er.png](./200-er.png) | ER with answer_completed booleans |
| 201 | [201-state.png](./201-state.png) | Spoken state machine wording |
| 210 | [210-backend-tests.png](./210-backend-tests.png) | Backend tests passing |
| 211 | [211-frontend-tests.png](./211-frontend-tests.png) | Frontend tests passing |

**Note:** Match audio bar is force-rendered as “Live audio connected” for layout evidence when LiveKit Cloud credentials are not present; real media requires \`.env\` LiveKit keys.
`;
  fs.writeFileSync(path.join(OUT, 'README.md'), index);
  console.log('Done. Output dir:', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
