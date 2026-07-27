import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch({ headless: true });
const ctxA = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
});
const ctxB = await browser.newContext({
  viewport: { width: 420, height: 900 },
  deviceScaleFactor: 2,
});
const pageA = await ctxA.newPage();
const pageB = await ctxB.newPage();
for (const p of [pageA, pageB]) {
  await p.route('**/audio-token', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 't',
        serverUrl: 'wss://x.livekit.cloud',
      }),
    })
  );
}

await pageA.goto(BASE, { waitUntil: 'networkidle' });
await pageA.fill('#displayName', 'Neo');
await pageA.click('button[aria-label="Avatar 1"]');
await pageA.click('button:has-text("Technology")');
await pageA.click('button:has-text("Science")');
await pageA.click('button:has-text("Philosophy")');
await pageA.click('button:has-text("Enter pool")');
await pageA.waitForURL('**/pool');

await pageB.goto(BASE, { waitUntil: 'networkidle' });
await pageB.fill('#displayName', 'Alex');
await pageB.click('button[aria-label="Avatar 2"]');
await pageB.click('button:has-text("Technology")');
await pageB.click('button:has-text("Science")');
await pageB.click('button:has-text("History")');
await pageB.click('button:has-text("Enter pool")');

await pageA.waitForURL('**/match/**', { timeout: 20000 });
await pageA.waitForSelector('text=YOUR TURN TO ANSWER', { timeout: 15000 });
await pageA.waitForTimeout(800);
await pageA.evaluate(() => {
  const root = document.querySelector('.match-audio');
  if (root) {
    root.innerHTML = `<div class="audio-bar">
      <p class="audio-status audio-status--connected">Live audio connected</p>
      <div class="audio-actions">
        <button type="button" class="btn btn-secondary btn-sm">Mute</button>
      </div>
    </div>`;
  }
});
await pageA.screenshot({
  path: 'docs/screenshots/194-match.png',
  fullPage: true,
});
console.log('194 size', fs.statSync('docs/screenshots/194-match.png').size);
await browser.close();
