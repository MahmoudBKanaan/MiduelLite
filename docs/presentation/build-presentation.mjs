/**
 * IU Oral Project Report — Minduel Lite
 * ~15 slides for ~15 minutes
 */
import pptxgen from 'pptxgenjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const SHOTS = path.join(ROOT, 'docs', 'screenshots');

const BG = '0B1220';
const CARD = '1A2332';
const ACCENT = '4F8CFF';
const TEXT = 'E8EEF7';
const MUTED = '9AABBF';
const GREEN = '3ECF8E';
const LINE = '334155';

const GH = 'https://github.com/MahmoudBKanaan/MiduelLite';

function footer(slide, n, total = 17) {
  slide.addText('Minduel Lite  ·  DLBSEPPSD01_E  ·  Oral Project Report', {
    x: 0.5, y: 5.25, w: 7.5, h: 0.25,
    fontSize: 10, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  slide.addText(`${n} / ${total}`, {
    x: 8.5, y: 5.25, w: 1, h: 0.25,
    fontSize: 10, fontFace: 'Calibri', color: MUTED, align: 'right', margin: 0,
  });
}

function titleBar(slide, title) {
  slide.addText(title, {
    x: 0.5, y: 0.28, w: 9, h: 0.5,
    fontSize: 26, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.78, w: 1.2, h: 0.06,
    fill: { color: ACCENT }, line: { color: ACCENT },
  });
}

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Minduel Lite Project';
pres.title = 'Minduel Lite — IU Oral Project Report';
pres.subject = 'DLBSEPPSD01_E Software Development Task 2';

// ========== 1 Title ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  s.addText('MINDUEL LITE', {
    x: 0.5, y: 1.5, w: 9, h: 0.7,
    fontSize: 40, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0,
  });
  s.addText('An Interest-Based Two-Player Intellectual Competition\nWeb Application', {
    x: 0.5, y: 2.25, w: 9, h: 0.7,
    fontSize: 18, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  s.addText('IU International University  ·  DLBSEPPSD01_E — Software Development\nTask 2: Development of a Web Application  ·  Oral Project Report', {
    x: 0.5, y: 3.2, w: 9, h: 0.6,
    fontSize: 14, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'GitHub: ', options: { color: MUTED } },
    { text: GH, options: { color: ACCENT, hyperlink: { url: GH } } },
  ], {
    x: 0.5, y: 4.2, w: 9, h: 0.35,
    fontSize: 14, fontFace: 'Calibri', margin: 0,
  });
  s.addText('Student name / matriculation number', {
    x: 0.5, y: 4.7, w: 9, h: 0.3,
    fontSize: 12, fontFace: 'Calibri', italic: true, color: LINE, margin: 0,
  });
}

// ========== 2 Outline ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Outline');
  const items = [
    'Problem, objective, users, scope',
    'Process, wireframes, architecture, database',
    'Matchmaking, state machine, implementation',
    'Testing, Docker, operational result',
    'Evaluation, reflection, conclusion',
  ];
  s.addText(
    items.map((t, i) => ({
      text: t,
      options: { bullet: { type: 'number' }, breakLine: i < items.length - 1 },
    })),
    {
      x: 0.7, y: 1.2, w: 8.5, h: 3.5,
      fontSize: 18, fontFace: 'Calibri', color: TEXT, paraSpaceAfter: 12,
    }
  );
  footer(s, 2);
}

// ========== 3 Problem + objective ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Problem and project objective');
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.15, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.1, line: { color: LINE },
  });
  s.addText('Problem', {
    x: 0.7, y: 1.3, w: 4, h: 0.35, fontSize: 16, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('Users want short intellectual interaction without registration, profiles, friends lists or complex multiplayer platforms. Existing systems add friction before any play can start.', {
    x: 0.7, y: 1.75, w: 4, h: 2.5, fontSize: 14, color: TEXT, margin: 0, valign: 'top',
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 1.15, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.1, line: { color: LINE },
  });
  s.addText('Objective', {
    x: 5.3, y: 1.3, w: 4, h: 0.35, fontSize: 16, bold: true, color: GREEN, margin: 0,
  });
  s.addText('Build the smallest practical full-stack SPA that demonstrates frontend, backend, PostgreSQL, two-user interaction, tests, Docker Compose, and documentation for IU Task 2 — not a production social platform.', {
    x: 5.3, y: 1.75, w: 4, h: 2.5, fontSize: 14, color: TEXT, margin: 0, valign: 'top',
  });
  footer(s, 3);
}

// ========== 4 Users + benefit ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Target user and benefit');
  s.addText('Target user', {
    x: 0.5, y: 1.1, w: 9, h: 0.35, fontSize: 16, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('Someone who wants a brief anonymous intellectual duel with another available person — no permanent identity or personal data.', {
    x: 0.5, y: 1.5, w: 9, h: 0.6, fontSize: 15, color: TEXT, margin: 0,
  });
  s.addText('User benefit — immediate participation without:', {
    x: 0.5, y: 2.3, w: 9, h: 0.35, fontSize: 16, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'Email / password registration', options: { bullet: true, breakLine: true } },
    { text: 'Permanent account or profile pages', options: { bullet: true, breakLine: true } },
    { text: 'Friends, rankings, or complex settings', options: { bullet: true, breakLine: true } },
    { text: 'Only needs: temporary name, avatar, three interests', options: { bullet: true } },
  ], {
    x: 0.7, y: 2.75, w: 8.5, h: 2, fontSize: 15, color: TEXT, paraSpaceAfter: 6,
  });
  footer(s, 4);
}

// ========== 5 MVP scope ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'MVP requirements and scope');
  s.addTable([
    [
      { text: 'In scope', options: { bold: true, color: 'FFFFFF', fill: { color: '1E3A5F' } } },
      { text: 'Out of scope', options: { bold: true, color: 'FFFFFF', fill: { color: '4A2020' } } },
    ],
    [
      '4 screens: Welcome, Pool, Match, Result',
      'Accounts, OAuth, JWT login',
    ],
    [
      'React SPA + Express + PostgreSQL',
      'WebSockets, WebRTC / audio',
    ],
    [
      'Interest matchmaking 3→2→1',
      'Chat, rankings, history UI',
    ],
    [
      '10-question peer scoring + flags',
      'Cloud deploy, microservices',
    ],
    [
      'Docker Compose, tests, docs',
      'AI scoring, admin CMS',
    ],
  ], {
    x: 0.5, y: 1.15, w: 9, h: 3.6,
    colW: [4.5, 4.5],
    border: { pt: 0.5, color: LINE },
    fontFace: 'Calibri',
    fontSize: 13,
    color: TEXT,
    fill: { color: CARD },
    valign: 'middle',
  });
  footer(s, 5);
}

// ========== 6 Process ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Development process');
  s.addText('Iterative-Incremental Development managed with Kanban', {
    x: 0.5, y: 1.1, w: 9, h: 0.4, fontSize: 16, bold: true, color: GREEN, margin: 0,
  });
  s.addText([
    { text: 'Solo project — no team Scrum ceremonies', options: { bullet: true, breakLine: true } },
    { text: 'Fixed small MVP defined by a knowledge base', options: { bullet: true, breakLine: true } },
    { text: 'Short timeline — continuous flow of ready work', options: { bullet: true, breakLine: true } },
    { text: 'Minimal admin: BACKLOG → READY → IN PROGRESS → TEST → DONE', options: { bullet: true } },
  ], {
    x: 0.7, y: 1.65, w: 5.2, h: 2.8, fontSize: 14, color: TEXT, paraSpaceAfter: 8,
  });
  try {
    s.addImage({
      path: path.join(SHOTS, '196-kanban.png'),
      x: 6.1, y: 1.2, w: 3.4, h: 3.4,
      sizing: { type: 'contain', w: 3.4, h: 3.4 },
    });
  } catch { /* optional */ }
  footer(s, 6);
}

// ========== 7 Wireframes ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Wireframes and user journey');
  const shots = [
    ['192-welcome.png', 'Welcome'],
    ['193-pool.png', 'Pool'],
    ['194-match.png', 'Match'],
    ['195-result.png', 'Result'],
  ];
  shots.forEach(([file, label], i) => {
    const x = 0.4 + i * 2.4;
    try {
      s.addImage({
        path: path.join(SHOTS, file),
        x, y: 1.1, w: 2.2, h: 3.5,
        sizing: { type: 'contain', w: 2.2, h: 3.5 },
      });
    } catch { /* */ }
    s.addText(label, {
      x, y: 4.7, w: 2.2, h: 0.3,
      fontSize: 12, color: MUTED, align: 'center', margin: 0,
    });
  });
  footer(s, 7);
}

// ========== 8 Architecture ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Software architecture (C4 container)');
  try {
    s.addImage({
      path: path.join(SHOTS, '199-c4.png'),
      x: 1.5, y: 1.0, w: 7, h: 3.9,
      sizing: { type: 'contain', w: 7, h: 3.9 },
    });
  } catch {
    s.addText('User → React SPA → Express API → PostgreSQL', {
      x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 18, color: TEXT, align: 'center',
    });
  }
  footer(s, 8);
}

// ========== 9 Database ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Database / data model');
  try {
    s.addImage({
      path: path.join(SHOTS, '200-er.png'),
      x: 0.8, y: 1.0, w: 8.4, h: 3.9,
      sizing: { type: 'contain', w: 8.4, h: 3.9 },
    });
  } catch {
    s.addText('players · queue_entries · questions · matches · match_rounds', {
      x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 16, color: TEXT, align: 'center',
    });
  }
  footer(s, 9);
}

// ========== 10 Matchmaking ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Matchmaking algorithm');
  s.addText('similarity = sharedInterestCount / 3', {
    x: 0.5, y: 1.15, w: 9, h: 0.45,
    fontSize: 22, fontFace: 'Consolas', bold: true, color: GREEN, margin: 0,
  });
  s.addTable([
    [
      { text: 'Shared', options: { bold: true, fill: { color: '1E3A5F' }, color: 'FFFFFF' } },
      { text: 'Similarity', options: { bold: true, fill: { color: '1E3A5F' }, color: 'FFFFFF' } },
      { text: 'Rule', options: { bold: true, fill: { color: '1E3A5F' }, color: 'FFFFFF' } },
    ],
    ['3', '1.00', 'Highest priority'],
    ['2', '0.67', 'Next'],
    ['1', '0.33', 'Lowest eligible'],
    ['0', '0.00', 'Never matched'],
  ], {
    x: 0.5, y: 1.8, w: 5.5, h: 2.6,
    colW: [1.3, 1.5, 2.7],
    border: { pt: 0.5, color: LINE },
    fontFace: 'Calibri', fontSize: 14, color: TEXT,
    fill: { color: CARD }, valign: 'middle',
  });
  s.addText([
    { text: 'Waiting player → Player 1', options: { bullet: true, breakLine: true } },
    { text: 'Joiner → Player 2', options: { bullet: true, breakLine: true } },
    { text: 'Tie-break: earliest joined_at', options: { bullet: true, breakLine: true } },
    { text: 'No ML / embeddings', options: { bullet: true } },
  ], {
    x: 6.3, y: 1.9, w: 3.2, h: 2.5, fontSize: 14, color: TEXT, paraSpaceAfter: 8,
  });
  footer(s, 10);
}

// ========== 11 State machine + code ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Match state machine & implementation');
  try {
    s.addImage({
      path: path.join(SHOTS, '201-state.png'),
      x: 0.3, y: 1.0, w: 5.2, h: 3.8,
      sizing: { type: 'contain', w: 5.2, h: 3.8 },
    });
  } catch { /* */ }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.6, y: 1.15, w: 3.9, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Code focus (excerpt)', {
    x: 5.8, y: 1.3, w: 3.5, h: 0.3, fontSize: 13, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('resolveAfterBothReviews()\n\nif flags ≥ 3 → THREE_FLAGS\nif question = 10 → COMPLETED\nelse → next Q, P1_ANSWER\n\nBackend is authoritative;\nfrontend only displays phase.', {
    x: 5.8, y: 1.7, w: 3.5, h: 2.7,
    fontSize: 13, fontFace: 'Consolas', color: TEXT, margin: 0, valign: 'top',
  });
  footer(s, 11);
}

// ========== 12 Testing + Docker ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Testing and Docker');
  try {
    s.addImage({
      path: path.join(SHOTS, '197-tests.png'),
      x: 0.3, y: 1.05, w: 4.7, h: 3.7,
      sizing: { type: 'contain', w: 4.7, h: 3.7 },
    });
  } catch { /* */ }
  try {
    s.addImage({
      path: path.join(SHOTS, '198-docker.png'),
      x: 5.2, y: 1.05, w: 4.5, h: 2.4,
      sizing: { type: 'contain', w: 4.5, h: 2.4 },
    });
  } catch { /* */ }
  s.addText('docker compose up --build\nFrontend :5173 · Backend :3001 · Postgres', {
    x: 5.2, y: 3.6, w: 4.5, h: 0.9,
    fontSize: 13, fontFace: 'Consolas', color: MUTED, margin: 0,
  });
  footer(s, 12);
}

// ========== 13 Demo / results ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Operational result');
  s.addText([
    { text: 'Two browsers (normal + Incognito) on localhost:5173', options: { bullet: true, breakLine: true } },
    { text: 'Compatible profiles match; same matchId and question', options: { bullet: true, breakLine: true } },
    { text: 'Full phase flow verified (answer → score → review)', options: { bullet: true, breakLine: true } },
    { text: 'Q10 → COMPLETED result; 3 flags → THREE_FLAGS', options: { bullet: true, breakLine: true } },
    { text: 'Flagged scores excluded from averages', options: { bullet: true, breakLine: true } },
    { text: 'Clean start: schema + 1000 questions, no manual DB setup', options: { bullet: true } },
  ], {
    x: 0.7, y: 1.2, w: 8.5, h: 3.5, fontSize: 15, color: TEXT, paraSpaceAfter: 8,
  });
  footer(s, 13);
}

// ========== 14 Goal + limitations ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Goal achievement and limitations');
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.15, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.1, line: { color: GREEN },
  });
  s.addText('Goal achieved', {
    x: 0.7, y: 1.3, w: 4, h: 0.35, fontSize: 16, bold: true, color: GREEN, margin: 0,
  });
  s.addText('Operational SPA + API + DB; two-user duel; tests pass; Docker Compose works; documentation and GitHub ready for Task 2.', {
    x: 0.7, y: 1.8, w: 4, h: 2.5, fontSize: 14, color: TEXT, margin: 0, valign: 'top',
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 1.15, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.1, line: { color: LINE },
  });
  s.addText('Intentional limits', {
    x: 5.3, y: 1.3, w: 4, h: 0.35, fontSize: 16, bold: true, color: MUTED, margin: 0,
  });
  s.addText('No accounts · polling not WS · no disconnect recovery · subjective scores · no moderation/history/audio · local Docker only · no production scale.', {
    x: 5.3, y: 1.8, w: 4, h: 2.5, fontSize: 14, color: TEXT, margin: 0, valign: 'top',
  });
  footer(s, 14);
}

// ========== 15 Reflection ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Reflection and future improvements');
  s.addText('Lessons learned', {
    x: 0.5, y: 1.1, w: 4.5, h: 0.35, fontSize: 16, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'Fixed MVP scope reduced delivery risk', options: { bullet: true, breakLine: true } },
    { text: 'Backend-authoritative state kept multiplayer consistent', options: { bullet: true, breakLine: true } },
    { text: 'Polling sufficient for academic two-player demo', options: { bullet: true, breakLine: true } },
    { text: 'Simple SQL model covered turn-based play', options: { bullet: true } },
  ], {
    x: 0.5, y: 1.55, w: 4.5, h: 2.8, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
  });
  s.addText('Possible future (not built)', {
    x: 5.3, y: 1.1, w: 4.2, h: 0.35, fontSize: 16, bold: true, color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'Accounts / persistent profiles', options: { bullet: true, breakLine: true } },
    { text: 'WebSockets or WebRTC audio', options: { bullet: true, breakLine: true } },
    { text: 'Moderation, history, rankings', options: { bullet: true, breakLine: true } },
    { text: 'Cloud deployment & stronger security', options: { bullet: true } },
  ], {
    x: 5.3, y: 1.55, w: 4.2, h: 2.8, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
  });
  footer(s, 15);
}

// ========== 16 Conclusion ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Conclusion');
  s.addText('Minduel Lite delivers a complete academic full-stack demonstration:', {
    x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 16, color: TEXT, margin: 0,
  });
  s.addText([
    { text: 'Anonymous two-player interest-based competition', options: { bullet: true, breakLine: true } },
    { text: 'React SPA + Express + PostgreSQL + Docker Compose', options: { bullet: true, breakLine: true } },
    { text: 'Tested core rules, documented process, published on GitHub', options: { bullet: true, breakLine: true } },
    { text: 'Scope discipline enabled reliable delivery for IU Task 2', options: { bullet: true } },
  ], {
    x: 0.7, y: 1.9, w: 8.5, h: 2.2, fontSize: 16, color: TEXT, paraSpaceAfter: 10,
  });
  s.addText(GH, {
    x: 0.5, y: 4.4, w: 9, h: 0.35,
    fontSize: 14, color: ACCENT, margin: 0, hyperlink: { url: GH },
  });
  footer(s, 16);
}

// ========== 17 List of figures + bibliography ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'List of figures & bibliography');
  s.addText('Figures (own work unless noted)', {
    x: 0.5, y: 1.1, w: 9, h: 0.3, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'Fig. Screenshots: Welcome, Pool, Match, Result (app UI)', options: { bullet: true, breakLine: true } },
    { text: 'Fig. C4 container diagram; ER diagram; match state diagram', options: { bullet: true, breakLine: true } },
    { text: 'Fig. Kanban board, test run, Docker compose status', options: { bullet: true } },
  ], {
    x: 0.5, y: 1.45, w: 9, h: 1.3, fontSize: 13, color: TEXT, paraSpaceAfter: 4,
  });
  s.addText('Bibliography / sources', {
    x: 0.5, y: 2.9, w: 9, h: 0.3, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'IU International University. (n.d.). Task for course DLBSEPPSD01_E — Software Development. Examination Office.', options: { bullet: true, breakLine: true } },
    { text: 'IU International University. (n.d.). Guidelines for the creation of an oral project report.', options: { bullet: true, breakLine: true } },
    { text: 'React, Express, PostgreSQL, Docker documentation (vendor docs, as used).', options: { bullet: true, breakLine: true } },
    { text: 'Project repository: ' + GH, options: { bullet: true } },
  ], {
    x: 0.5, y: 3.25, w: 9, h: 1.7, fontSize: 12, color: TEXT, paraSpaceAfter: 4,
  });
  footer(s, 17);
}

const out = path.join(ROOT, 'docs', 'presentation', 'MinduelLite-Oral-Project-Report.pptx');
await pres.writeFile({ fileName: out });
console.log('Wrote', out);
