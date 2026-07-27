/**
 * IU Oral Project Report — Minduel Lite
 * Focus: task definition, planning, process, architecture, result, testing, reflection.
 * Academic: list of figures, bibliography (APA-style), GitHub on title slide.
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
const TOTAL = 18;

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Minduel Lite Project';
pres.title = 'Minduel Lite — IU Oral Project Report';
pres.subject = 'DLBSEPPSD01_E Software Development Task 2';

function footer(slide, n) {
  slide.addText('Minduel Lite  ·  DLBSEPPSD01_E  ·  Oral Project Report', {
    x: 0.5, y: 5.28, w: 7.2, h: 0.22,
    fontSize: 9, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  slide.addText(`${n}/${TOTAL}`, {
    x: 8.6, y: 5.28, w: 0.9, h: 0.22,
    fontSize: 9, fontFace: 'Calibri', color: MUTED, align: 'right', margin: 0,
  });
}

function titleBar(slide, title) {
  slide.addText(title, {
    x: 0.5, y: 0.26, w: 9, h: 0.48,
    fontSize: 24, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.74, w: 1.1, h: 0.05,
    fill: { color: ACCENT }, line: { color: ACCENT },
  });
}

function figNote(slide, text, y = 4.95) {
  slide.addText(text, {
    x: 0.5, y, w: 9, h: 0.28,
    fontSize: 10, fontFace: 'Calibri', italic: true, color: MUTED, margin: 0,
  });
}

// ========== 1 Title + GitHub ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  s.addText('MINDUEL LITE', {
    x: 0.5, y: 1.15, w: 9, h: 0.65,
    fontSize: 38, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0,
  });
  s.addText('An Interest-Based Two-Player Intellectual Competition Web Application', {
    x: 0.5, y: 1.85, w: 9, h: 0.45,
    fontSize: 16, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'IU International University of Applied Sciences', options: { breakLine: true } },
    { text: 'Course: DLBSEPPSD01_E — Software Development', options: { breakLine: true } },
    { text: 'Examination: Oral Project Report · Task 2 — Development of a Web Application', options: { breakLine: true } },
  ], {
    x: 0.5, y: 2.5, w: 9, h: 0.95,
    fontSize: 14, fontFace: 'Calibri', color: MUTED, margin: 0,
  });

  // Prominent GitHub block (requirement 206)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 3.55, w: 9, h: 0.85,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: ACCENT, width: 1.5 },
  });
  s.addText('GitHub repository (title-slide link)', {
    x: 0.7, y: 3.65, w: 8.6, h: 0.28,
    fontSize: 12, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  s.addText(GH, {
    x: 0.7, y: 3.95, w: 8.6, h: 0.32,
    fontSize: 16, fontFace: 'Calibri', bold: true, color: ACCENT, margin: 0,
    hyperlink: { url: GH },
  });

  s.addText('Student name  ·  Matriculation number  ·  [replace before submission]', {
    x: 0.5, y: 4.65, w: 9, h: 0.3,
    fontSize: 12, fontFace: 'Calibri', italic: true, color: LINE, margin: 0,
  });
  footer(s, 1);
}

// ========== 2 Outline — process focus ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Outline — process over UI walkthrough');
  s.addText('Presentation focus (IU oral project report)', {
    x: 0.5, y: 1.05, w: 9, h: 0.3, fontSize: 14, bold: true, color: GREEN, margin: 0,
  });
  const items = [
    'Task definition — problem, objective, users, requirements',
    'Planning & process — Kanban, iterative-incremental model',
    'Architecture & data — C4 containers, ER model, matchmaking',
    'Implementation — state machine, core logic, security choices',
    'Software result — operational demo evidence (not a screen tour)',
    'Testing & Docker — automated tests, reproducible run',
    'Reflection — goal achievement, limits, lessons, outlook',
  ];
  s.addText(
    items.map((t, i) => ({
      text: t,
      options: { bullet: { type: 'number' }, breakLine: i < items.length - 1 },
    })),
    {
      x: 0.6, y: 1.45, w: 8.8, h: 3.4,
      fontSize: 15, fontFace: 'Calibri', color: TEXT, paraSpaceAfter: 8,
    }
  );
  footer(s, 2);
}

// ========== 3 Problem + objective ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '1. Task definition — problem & objective');
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.1, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Problem', {
    x: 0.7, y: 1.25, w: 4, h: 0.32, fontSize: 15, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('Short intellectual interaction is often blocked by registration, permanent profiles, and social features that are unnecessary for a brief two-player exchange.', {
    x: 0.7, y: 1.7, w: 4, h: 2.6, fontSize: 13, color: TEXT, margin: 0, valign: 'top',
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 1.1, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Objective (Task 2)', {
    x: 5.3, y: 1.25, w: 4, h: 0.32, fontSize: 15, bold: true, color: GREEN, margin: 0,
  });
  s.addText('Deliver a demonstrable full-stack SPA: React frontend, Node/Express backend, PostgreSQL, two-user interaction, automated tests, Docker Compose, and documentation — optimised for submission reliability, not commercial scale.', {
    x: 5.3, y: 1.7, w: 4, h: 2.6, fontSize: 13, color: TEXT, margin: 0, valign: 'top',
  });
  footer(s, 3);
}

// ========== 4 Users ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '1. Task definition — users & benefit');
  s.addText([
    { text: 'Primary user: ', options: { bold: true } },
    { text: 'person seeking a short, anonymous intellectual competition without permanent identity or PII.', options: { breakLine: true } },
  ], { x: 0.5, y: 1.15, w: 9, h: 0.7, fontSize: 15, color: TEXT, margin: 0 });
  s.addText('Derived requirements for the solution', {
    x: 0.5, y: 2.0, w: 9, h: 0.3, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'Zero signup friction → temporary session (playerId + sessionToken)', options: { bullet: true, breakLine: true } },
    { text: 'Meaningful pairing → interest overlap matchmaking (no ML stack)', options: { bullet: true, breakLine: true } },
    { text: 'Two-user interaction → turn-based peer-scored match state machine', options: { bullet: true, breakLine: true } },
    { text: 'Demonstrable full stack → SPA + API + DB + Docker Compose', options: { bullet: true } },
  ], {
    x: 0.6, y: 2.4, w: 8.8, h: 2.3, fontSize: 14, color: TEXT, paraSpaceAfter: 8,
  });
  footer(s, 4);
}

// ========== 5 Scope ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '1. Task definition — MVP scope');
  s.addText('Scope reduction is an engineering decision aligned with the knowledge base and IU Task 2.', {
    x: 0.5, y: 1.05, w: 9, h: 0.35, fontSize: 13, italic: true, color: MUTED, margin: 0,
  });
  s.addTable([
    [
      { text: 'In scope (built)', options: { bold: true, color: 'FFFFFF', fill: { color: '1E3A5F' } } },
      { text: 'Explicitly excluded', options: { bold: true, color: 'FFFFFF', fill: { color: '4A2020' } } },
    ],
    ['React SPA, Express API, PostgreSQL', 'Accounts / OAuth / JWT login'],
    ['4 routes; temporary sessions', 'WebSockets, WebRTC audio'],
    ['Matchmaking 3→2→1 interests', 'Chat, rankings, history UI'],
    ['Peer scoring, flags, results', 'Cloud / K8s / microservices'],
    ['Tests, Docker Compose, docs', 'AI scoring, admin CMS'],
  ], {
    x: 0.5, y: 1.5, w: 9, h: 3.2,
    colW: [4.5, 4.5],
    border: { pt: 0.5, color: LINE },
    fontFace: 'Calibri', fontSize: 12, color: TEXT,
    fill: { color: CARD }, valign: 'middle',
  });
  footer(s, 5);
}

// ========== 6 Process ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '2. Planning & process — Kanban');
  s.addText('Model: Iterative-Incremental Development managed with Kanban', {
    x: 0.5, y: 1.05, w: 9, h: 0.35, fontSize: 14, bold: true, color: GREEN, margin: 0,
  });
  s.addText([
    { text: 'Why not pure Scrum? Solo student, fixed MVP, short timeline — ceremonies add overhead without team coordination benefit.', options: { bullet: true, breakLine: true } },
    { text: 'Increments: concept → foundation → matchmaking → match engine → result → tests/docs → presentation.', options: { bullet: true, breakLine: true } },
    { text: 'Board columns: BACKLOG → READY → IN PROGRESS → TEST → DONE (evidence below).', options: { bullet: true } },
  ], {
    x: 0.5, y: 1.5, w: 5.3, h: 2.8, fontSize: 13, color: TEXT, paraSpaceAfter: 8,
  });
  try {
    s.addImage({
      path: path.join(SHOTS, '196-kanban.png'),
      x: 6.0, y: 1.15, w: 3.5, h: 3.5,
      sizing: { type: 'contain', w: 3.5, h: 3.5 },
    });
  } catch { /* */ }
  figNote(s, 'Figure 1. Kanban board snapshot (own project process evidence).');
  footer(s, 6);
}

// ========== 7 Journey (planning artefact, not UI tour) ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '2. Planning — user journey (not a UI tour)');
  s.addText('Four screens map the planned flow; the oral report emphasises process and architecture around this journey.', {
    x: 0.5, y: 1.0, w: 9, h: 0.4, fontSize: 13, italic: true, color: MUTED, margin: 0,
  });
  s.addText('Welcome → Pool → Match → Result  |  Play again → Pool  |  Reset → Welcome', {
    x: 0.5, y: 1.45, w: 9, h: 0.35, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
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
        x, y: 1.9, w: 2.2, h: 2.7,
        sizing: { type: 'contain', w: 2.2, h: 2.7 },
      });
    } catch { /* */ }
    s.addText(label, {
      x, y: 4.65, w: 2.2, h: 0.25,
      fontSize: 11, color: MUTED, align: 'center', margin: 0,
    });
  });
  figNote(s, 'Figures 2–5. Application screenshots of the planned four-screen journey (own software).');
  footer(s, 7);
}

// ========== 8 Architecture ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '3. Architecture — C4 containers');
  s.addText('Design decision: one SPA, one API, one database — simplest structure that meets Task 2.', {
    x: 0.5, y: 0.95, w: 9, h: 0.3, fontSize: 12, italic: true, color: MUTED, margin: 0,
  });
  try {
    s.addImage({
      path: path.join(SHOTS, '199-c4.png'),
      x: 1.3, y: 1.25, w: 7.4, h: 3.5,
      sizing: { type: 'contain', w: 7.4, h: 3.5 },
    });
  } catch {
    s.addText('User → React SPA → Express → PostgreSQL', {
      x: 0.5, y: 2.5, w: 9, h: 0.5, fontSize: 18, color: TEXT, align: 'center',
    });
  }
  figNote(s, 'Figure 6. C4 container diagram (own diagram). Backend is authoritative for game state.');
  footer(s, 8);
}

// ========== 9 Database ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '3. Architecture — data model');
  try {
    s.addImage({
      path: path.join(SHOTS, '200-er.png'),
      x: 0.6, y: 1.0, w: 8.8, h: 3.7,
      sizing: { type: 'contain', w: 8.8, h: 3.7 },
    });
  } catch { /* */ }
  figNote(s, 'Figure 7. ER diagram (own diagram). Five tables; 100×10 = 1,000 seeded questions.');
  footer(s, 9);
}

// ========== 10 Matchmaking ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '3. Architecture — matchmaking logic');
  s.addText('similarity = sharedInterestCount / 3', {
    x: 0.5, y: 1.1, w: 9, h: 0.4,
    fontSize: 20, fontFace: 'Consolas', bold: true, color: GREEN, margin: 0,
  });
  s.addTable([
    [
      { text: 'Shared', options: { bold: true, fill: { color: '1E3A5F' }, color: 'FFFFFF' } },
      { text: 'Similarity', options: { bold: true, fill: { color: '1E3A5F' }, color: 'FFFFFF' } },
      { text: 'Matchmaking', options: { bold: true, fill: { color: '1E3A5F' }, color: 'FFFFFF' } },
    ],
    ['3', '1.00', 'Highest priority'],
    ['2', '≈ 0.67', 'Next'],
    ['1', '≈ 0.33', 'Lowest eligible'],
    ['0', '0.00', 'Never matched'],
  ], {
    x: 0.5, y: 1.7, w: 5.4, h: 2.5,
    colW: [1.2, 1.5, 2.7],
    border: { pt: 0.5, color: LINE },
    fontFace: 'Calibri', fontSize: 13, color: TEXT,
    fill: { color: CARD }, valign: 'middle',
  });
  s.addText([
    { text: 'Implementation choice', options: { bold: true, breakLine: true } },
    { text: 'Set intersection only — no ML, no vector DB.', options: { breakLine: true } },
    { text: 'Waiting player = P1; joiner = P2.', options: { breakLine: true } },
    { text: 'Tie-break: earliest joined_at.', options: { breakLine: true } },
    { text: 'Excerpt: calculateInterestOverlap / selectBestCandidate', options: {} },
  ], {
    x: 6.2, y: 1.7, w: 3.3, h: 2.8, fontSize: 13, color: TEXT, margin: 0,
  });
  footer(s, 10);
}

// ========== 11 State machine ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '4. Implementation — state machine');
  try {
    s.addImage({
      path: path.join(SHOTS, '201-state.png'),
      x: 0.25, y: 1.0, w: 5.3, h: 3.7,
      sizing: { type: 'contain', w: 5.3, h: 3.7 },
    });
  } catch { /* */ }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.7, y: 1.15, w: 3.8, h: 3.4,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Backend authority', {
    x: 5.9, y: 1.3, w: 3.4, h: 0.3, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('Frontend polls phase; does not invent rules.\n\nresolveAfterBothReviews:\n• flags ≥ 3 → THREE_FLAGS\n• Q = 10 → COMPLETED\n• else next question\n\nadvanceMatch() applies the decision in SQL.', {
    x: 5.9, y: 1.7, w: 3.4, h: 2.6, fontSize: 12, fontFace: 'Calibri', color: TEXT, margin: 0,
  });
  figNote(s, 'Figure 8. User flow & match state (own diagram). Code: matchService.js.');
  footer(s, 11);
}

// ========== 12 Testing + Docker ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '5. Testing & reproducible run');
  s.addText('Automated tests cover core business rules; Docker Compose is the only required runtime path.', {
    x: 0.5, y: 0.95, w: 9, h: 0.3, fontSize: 12, italic: true, color: MUTED, margin: 0,
  });
  try {
    s.addImage({
      path: path.join(SHOTS, '197-tests.png'),
      x: 0.3, y: 1.3, w: 4.8, h: 3.3,
      sizing: { type: 'contain', w: 4.8, h: 3.3 },
    });
  } catch { /* */ }
  try {
    s.addImage({
      path: path.join(SHOTS, '198-docker.png'),
      x: 5.3, y: 1.3, w: 4.3, h: 2.2,
      sizing: { type: 'contain', w: 4.3, h: 2.2 },
    });
  } catch { /* */ }
  s.addText('Command: docker compose up --build\nNo manual DB setup (schema.sql + seed.sql).', {
    x: 5.3, y: 3.65, w: 4.3, h: 0.7, fontSize: 12, fontFace: 'Consolas', color: MUTED, margin: 0,
  });
  figNote(s, 'Figures 9–10. Test run output; Docker Compose services (own environment).');
  footer(s, 12);
}

// ========== 13 Operational result ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '5. Software result — what was demonstrated');
  s.addText('Evidence of an operational system (process outcome), not a feature-by-feature UI description:', {
    x: 0.5, y: 1.05, w: 9, h: 0.4, fontSize: 13, italic: true, color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'Two independent browser sessions share one backend and database', options: { bullet: true, breakLine: true } },
    { text: 'Interest matchmaking pairs compatible players into one matchId', options: { bullet: true, breakLine: true } },
    { text: 'Authoritative phases: answer → score → review; flags and Q10 termination', options: { bullet: true, breakLine: true } },
    { text: 'Results exclude flagged scores; play-again reuses temporary session', options: { bullet: true, breakLine: true } },
    { text: 'Clean volume init: five tables + 1,000 questions without manual SQL steps', options: { bullet: true, breakLine: true } },
    { text: 'Repository published with frontend, backend, DB, Docker, tests, docs', options: { bullet: true } },
  ], {
    x: 0.6, y: 1.55, w: 8.8, h: 3.2, fontSize: 14, color: TEXT, paraSpaceAfter: 7,
  });
  footer(s, 13);
}

// ========== 14 Goal + limits ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '6. Evaluation — goal & limitations');
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.1, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: GREEN },
  });
  s.addText('Goal achieved?', {
    x: 0.7, y: 1.25, w: 4, h: 0.32, fontSize: 15, bold: true, color: GREEN, margin: 0,
  });
  s.addText('Yes — for the defined academic objective: a reliable local full-stack demonstration of Task 2 requirements (SPA, backend, tests, Docker, documentation), not a commercial product.', {
    x: 0.7, y: 1.7, w: 4, h: 2.6, fontSize: 13, color: TEXT, margin: 0, valign: 'top',
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 1.1, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Known limitations (by design)', {
    x: 5.3, y: 1.25, w: 4, h: 0.32, fontSize: 15, bold: true, color: MUTED, margin: 0,
  });
  s.addText('No accounts · no production auth · polling not WebSockets · no disconnect recovery · subjective scoring · no moderation/history/audio · local Docker only · no production scale strategy.', {
    x: 5.3, y: 1.7, w: 4, h: 2.6, fontSize: 13, color: TEXT, margin: 0, valign: 'top',
  });
  footer(s, 14);
}

// ========== 15 Reflection ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '6. Reflection & future improvements');
  s.addText('Lessons from this implementation', {
    x: 0.5, y: 1.05, w: 4.5, h: 0.3, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'Explicit exclusions reduced delivery risk', options: { bullet: true, breakLine: true } },
    { text: 'Server-owned state simplified multiplayer consistency', options: { bullet: true, breakLine: true } },
    { text: 'Polling was adequate for a two-player demo', options: { bullet: true, breakLine: true } },
    { text: 'Focused tests beat high test volume', options: { bullet: true } },
  ], {
    x: 0.5, y: 1.45, w: 4.5, h: 2.8, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
  });
  s.addText('Discussed only (not implemented)', {
    x: 5.3, y: 1.05, w: 4.2, h: 0.3, fontSize: 14, bold: true, color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'Authenticated accounts & history', options: { bullet: true, breakLine: true } },
    { text: 'WebSockets / optional WebRTC audio', options: { bullet: true, breakLine: true } },
    { text: 'Moderation & rankings', options: { bullet: true, breakLine: true } },
    { text: 'Cloud deployment & stronger security ops', options: { bullet: true } },
  ], {
    x: 5.3, y: 1.45, w: 4.2, h: 2.8, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
  });
  footer(s, 15);
}

// ========== 16 Conclusion ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Conclusion');
  s.addText([
    { text: 'Task definition drove a deliberately small MVP', options: { bullet: true, breakLine: true } },
    { text: 'Kanban + iterative increments structured solo development', options: { bullet: true, breakLine: true } },
    { text: 'Architecture and state machine kept multiplayer consistent', options: { bullet: true, breakLine: true } },
    { text: 'Tests, Docker, and GitHub complete the Task 2 evidence chain', options: { bullet: true } },
  ], {
    x: 0.6, y: 1.3, w: 8.8, h: 2.4, fontSize: 16, color: TEXT, paraSpaceAfter: 10,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 3.9, w: 9, h: 0.85,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: ACCENT },
  });
  s.addText(GH, {
    x: 0.7, y: 4.15, w: 8.6, h: 0.4,
    fontSize: 15, bold: true, color: ACCENT, margin: 0, hyperlink: { url: GH },
  });
  footer(s, 16);
}

// ========== 17 List of figures ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'List of figures');
  s.addText('All figures below are the author’s own work produced for this project (UI screenshots, process evidence, and original diagrams). External materials are listed only in the bibliography.', {
    x: 0.5, y: 0.95, w: 9, h: 0.55, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'Figure 1. Kanban board snapshot (project process evidence).', options: { breakLine: true } },
    { text: 'Figures 2–5. Application screenshots: Welcome, Pool, Match, Result (own software).', options: { breakLine: true } },
    { text: 'Figure 6. C4 container architecture diagram (own diagram).', options: { breakLine: true } },
    { text: 'Figure 7. Entity-relationship diagram (own diagram).', options: { breakLine: true } },
    { text: 'Figure 8. User flow and match state machine (own diagram).', options: { breakLine: true } },
    { text: 'Figure 9. Automated test run output (own development environment).', options: { breakLine: true } },
    { text: 'Figure 10. Docker Compose services status (own development environment).', options: { breakLine: true } },
  ], {
    x: 0.5, y: 1.55, w: 9, h: 3.2, fontSize: 13, color: TEXT, paraSpaceAfter: 5,
  });
  footer(s, 17);
}

// ========== 18 Bibliography ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, 'Bibliography');
  s.addText('APA 7th-style references for external sources used in the project and presentation. Original project diagrams and screenshots are not external sources.', {
    x: 0.5, y: 0.95, w: 9, h: 0.45, fontSize: 11, italic: true, color: MUTED, margin: 0,
  });
  s.addText([
    {
      text: 'IU International University of Applied Sciences. (n.d.). Task for course DLBSEPPSD01_E – Software Development [Examination task]. Examination Office.',
      options: { breakLine: true },
    },
    {
      text: 'IU International University of Applied Sciences. (n.d.). Guidelines for the creation of an oral project report. Examination Office.',
      options: { breakLine: true },
    },
    {
      text: 'Meta Platforms. (n.d.). React documentation. https://react.dev/',
      options: { breakLine: true },
    },
    {
      text: 'OpenJS Foundation. (n.d.). Express — Node.js web application framework. https://expressjs.com/',
      options: { breakLine: true },
    },
    {
      text: 'PostgreSQL Global Development Group. (n.d.). PostgreSQL documentation. https://www.postgresql.org/docs/',
      options: { breakLine: true },
    },
    {
      text: 'Docker Inc. (n.d.). Docker Compose documentation. https://docs.docker.com/compose/',
      options: { breakLine: true },
    },
    {
      text: 'Kanaan, M. B. (2026). Minduel Lite [Computer software]. GitHub. ' + GH,
      options: {},
    },
  ], {
    x: 0.5, y: 1.45, w: 9, h: 3.5, fontSize: 11, color: TEXT, paraSpaceAfter: 6,
  });
  footer(s, 18);
}

const out = path.join(ROOT, 'docs', 'presentation', 'MinduelLite-Oral-Project-Report.pptx');
await pres.writeFile({ fileName: out });
console.log('Wrote', out);
