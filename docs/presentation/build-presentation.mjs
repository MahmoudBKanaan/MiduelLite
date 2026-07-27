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
/** Title-slide identity — edit if needed */
const STUDENT_NAME = 'Mahmoud B. Kanaan';
/** Set IU matriculation number before final submission if different */
const MATRICULATION = process.env.IU_MATRICULATION || 'Matriculation number: see IU myCampus';
const TOTAL = 18;

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Minduel Lite Project';
pres.title = 'Minduel Lite: Live-Audio Intellectual Competition — IU Oral Project Report';
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
    x: 0.5, y: 0.95, w: 9, h: 0.55,
    fontSize: 36, fontFace: 'Calibri', bold: true, color: TEXT, margin: 0,
  });
  s.addText('An Interest-Based Two-Player Live-Audio Intellectual Competition Web Application', {
    x: 0.5, y: 1.55, w: 9, h: 0.65,
    fontSize: 15, fontFace: 'Calibri', color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'IU International University of Applied Sciences', options: { breakLine: true } },
    { text: 'Course: DLBSEPPSD01_E — Software Development', options: { breakLine: true } },
    { text: 'Examination: Oral Project Report · Task 2 — Development of a Web Application', options: { breakLine: true } },
  ], {
    x: 0.5, y: 2.3, w: 9, h: 0.9,
    fontSize: 13, fontFace: 'Calibri', color: MUTED, margin: 0,
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

  s.addText(`${STUDENT_NAME}  ·  ${MATRICULATION}`, {
    x: 0.5, y: 4.65, w: 9, h: 0.3,
    fontSize: 13, fontFace: 'Calibri', color: MUTED, margin: 0,
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
  s.addText('Short intellectual interaction is often blocked by registration, permanent profiles, and heavy multiplayer platforms. Text-only flows also remove natural spoken exchange for a brief two-player duel.', {
    x: 0.7, y: 1.7, w: 4, h: 2.6, fontSize: 13, color: TEXT, margin: 0, valign: 'top',
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 1.1, w: 4.4, h: 3.5,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Objective (Task 2 + project)', {
    x: 5.3, y: 1.25, w: 4, h: 0.32, fontSize: 15, bold: true, color: GREEN, margin: 0,
  });
  s.addText('Deliver a demonstrable full-stack SPA for IU Task 2 (React, Express, PostgreSQL, tests, Docker Compose, docs) with two-user interaction. Live spoken answers via managed LiveKit are part of this project’s defined solution — not a separate IU examination mandate for audio/WebRTC.', {
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
    { text: 'Spoken two-user interaction → LiveKit room + turn-based peer scoring', options: { bullet: true, breakLine: true } },
    { text: 'Demonstrable full stack → SPA + API + DB + Docker Compose (+ LiveKit Cloud for audio)', options: { bullet: true } },
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
    ['Live spoken answers (managed LiveKit)', 'Self-hosted WebRTC / TURN stack'],
    ['Matchmaking 3→2→1; answer-complete', 'Chat, rankings, history UI'],
    ['Peer scoring, flags, results', 'Recording / transcription'],
    ['Tests, Docker Compose (3 services), docs', 'K8s / microservices / AI scoring'],
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
    { text: 'Increments: concept → foundation → matchmaking → match → result → LIVE AUDIO → tests/docs → presentation.', options: { bullet: true, breakLine: true } },
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
  titleBar(s, '2. Planning — user journey (spoken live audio)');
  s.addText('Welcome → Pool → match created → audio connected → spoken answers → Result', {
    x: 0.5, y: 0.95, w: 9, h: 0.35, fontSize: 14, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('Play again → Pool (new match + new LiveKit room)  ·  Reset → Welcome', {
    x: 0.5, y: 1.3, w: 9, h: 0.28, fontSize: 12, italic: true, color: MUTED, margin: 0,
  });
  const shots = [
    ['192-welcome.png', 'Welcome'],
    ['193-pool.png', 'Pool'],
    ['194-match.png', 'Match + audio'],
    ['195-result.png', 'Result'],
  ];
  shots.forEach(([file, label], i) => {
    const x = 0.4 + i * 2.4;
    try {
      s.addImage({
        path: path.join(SHOTS, file),
        x, y: 1.7, w: 2.2, h: 2.85,
        sizing: { type: 'contain', w: 2.2, h: 2.85 },
      });
    } catch { /* */ }
    s.addText(label, {
      x, y: 4.6, w: 2.2, h: 0.25,
      fontSize: 11, color: MUTED, align: 'center', margin: 0,
    });
  });
  figNote(s, 'Figures 2–5. Four-screen journey with live spoken match (own software).');
  footer(s, 7);
}

// ========== 8 Architecture ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '3. Architecture — C4 + LiveKit');
  s.addText('Simple distinction: Express + PostgreSQL = game state · LiveKit = live audio · REST polling = game sync', {
    x: 0.5, y: 0.92, w: 9, h: 0.32, fontSize: 12, bold: true, color: GREEN, margin: 0,
  });
  try {
    s.addImage({
      path: path.join(SHOTS, '199-c4.png'),
      x: 0.4, y: 1.25, w: 5.6, h: 3.5,
      sizing: { type: 'contain', w: 5.6, h: 3.5 },
    });
  } catch {
    s.addText('React SPA → REST → Express → SQL → PostgreSQL\nReact SPA ↔ mic audio ↔ LiveKit\nExpress → signed token → LiveKit', {
      x: 0.5, y: 2.0, w: 5.5, h: 1.8, fontSize: 14, color: TEXT,
    });
  }
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 6.2, y: 1.3, w: 3.4, h: 3.4,
    fill: { color: CARD }, rectRadius: 0.08, line: { color: LINE },
  });
  s.addText('Talking points', {
    x: 6.4, y: 1.45, w: 3.0, h: 0.3, fontSize: 13, bold: true, color: ACCENT, margin: 0,
  });
  s.addText('• EXPRESS + POSTGRESQL\n  = authoritative game state\n\n• LIVEKIT (managed Cloud)\n  = live microphone audio\n\n• REST polling ≈ 1s\n  = game synchronisation\n\n• LiveKit is part of the\n  project’s defined solution\n  (not an IU audio mandate)', {
    x: 6.4, y: 1.85, w: 3.0, h: 2.6, fontSize: 12, color: TEXT, margin: 0,
  });
  figNote(s, 'Figure 6. C4 + external LiveKit (own diagram). Media API: LiveKit docs (external).');
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
  figNote(s, 'Figure 7. ER (own). answer_completed booleans; no answer TEXT; LiveKit not in ER (audio not persisted).');
  footer(s, 9);
}

// ========== 10 Code: LiveKit token + MatchAudio ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '4. Implementation — LiveKit token & MatchAudio');
  s.addText('audioTokenService.js — signed grant (secret on server only)', {
    x: 0.4, y: 0.95, w: 4.6, h: 0.28, fontSize: 11, bold: true, color: ACCENT, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 1.25, w: 4.7, h: 3.55,
    fill: { color: '121A24' }, rectRadius: 0.06, line: { color: LINE },
  });
  s.addText(`const at = new AccessToken(apiKey, apiSecret, {
  identity: playerId,
  ttl: '2h',
});
at.addGrant({
  roomJoin: true,
  room: \`match-\${matchId}\`,
  canPublish: true,
  canSubscribe: true,
  canPublishSources: [MICROPHONE],
  canPublishData: false,
});
const token = await at.toJwt();
return { token, serverUrl };`, {
    x: 0.5, y: 1.35, w: 4.4, h: 3.3,
    fontSize: 10, fontFace: 'Consolas', color: 'C8D6E5', margin: 0, valign: 'top',
  });
  s.addText('MatchAudio.jsx — connect lifecycle', {
    x: 5.2, y: 0.95, w: 4.5, h: 0.28, fontSize: 11, bold: true, color: GREEN, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.15, y: 1.25, w: 4.55, h: 3.55,
    fill: { color: '121A24' }, rectRadius: 0.06, line: { color: LINE },
  });
  s.addText(`// CONNECTING → getAudioToken → Room
const { token, serverUrl } =
  await getAudioToken(matchId);
room = new Room({ ... });
room.on(TrackSubscribed, attachRemote);
await room.connect(serverUrl, token);
await room.localParticipant
  .setMicrophoneEnabled(true);
setAudioState('CONNECTED');

// cleanup on unmount only:
// mic off, disconnect, remove listeners
// deps: [matchId] — not phase/question`, {
    x: 5.3, y: 1.35, w: 4.25, h: 3.3,
    fontSize: 10, fontFace: 'Consolas', color: 'C8D6E5', margin: 0, valign: 'top',
  });
  figNote(s, 'Actual source excerpts. Membership validated before token; no API secret in the browser.');
  footer(s, 10);
}

// ========== 11 Code: business logic ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '4. Implementation — matchmaking & third flag');
  s.addText('matchmakingService.js', {
    x: 0.4, y: 0.95, w: 4.6, h: 0.25, fontSize: 11, bold: true, color: ACCENT, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 1.22, w: 4.7, h: 3.55,
    fill: { color: '121A24' }, rectRadius: 0.06, line: { color: LINE },
  });
  s.addText(`export function selectBestCandidate(
  currentInterests, waitingPlayers) {
  return waitingPlayers
    .map(c => ({ ...c,
      overlap: calculateInterestOverlap(
        currentInterests, c.interests) }))
    .filter(c => c.overlap >= 1) // never 0
    .sort((a, b) => {
      if (b.overlap !== a.overlap)
        return b.overlap - a.overlap;
      return new Date(a.joined_at)
        - new Date(b.joined_at);
    })[0] || null;
}`, {
    x: 0.5, y: 1.32, w: 4.4, h: 3.35,
    fontSize: 10, fontFace: 'Consolas', color: 'C8D6E5', margin: 0, valign: 'top',
  });
  s.addText('matchService.js — submitReview', {
    x: 5.2, y: 0.95, w: 4.5, h: 0.25, fontSize: 11, bold: true, color: GREEN, margin: 0,
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.15, y: 1.22, w: 4.55, h: 3.55,
    fill: { color: '121A24' }, rectRadius: 0.06, line: { color: LINE },
  });
  s.addText(`if (flag) {
  await client.query(
    \`UPDATE matches
     SET player1_flag_count = player1_flag_count + 1
     WHERE id = $1\`, [matchId]);
}
const m = (await client.query(
  'SELECT * FROM matches WHERE id = $1',
  [matchId])).rows[0];

// Immediate end — do not wait for
// the other player's review
if (m.player1_flag_count >= 3 ||
    m.player2_flag_count >= 3) {
  await client.query(
    \`UPDATE matches SET status='ENDED',
     end_reason='THREE_FLAGS',
     ended_at=NOW() WHERE id=$1\`,
    [matchId]);
}`, {
    x: 5.3, y: 1.32, w: 4.25, h: 3.35,
    fontSize: 10, fontFace: 'Consolas', color: 'C8D6E5', margin: 0, valign: 'top',
  });
  figNote(s, 'Business logic excerpts: interest priority 3→2→1; either player ends at their own third flag; counts never combine.');
  footer(s, 11);
}

// ========== 12 Testing + Docker ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '5. Testing & reproducible run');
  s.addText([
    { text: 'Backend: ', options: { bold: true } },
    { text: 'audio-token authorization; answer-complete; per-player flag tests including mixed 2+2 remaining active', options: { breakLine: true } },
    { text: 'Frontend: ', options: { bold: true } },
    { text: 'MatchAudio CONNECTING / CONNECTED / FAILED + RETRY; cleanup disconnect; Answer complete calls completeAnswer', options: { breakLine: true } },
    { text: 'Manual: ', options: { bold: true } },
    { text: 'Chrome + Incognito; mic permission; Live audio connected; speak both ways; full spoken match path', options: {} },
  ], {
    x: 0.5, y: 0.95, w: 9, h: 1.15, fontSize: 12, color: TEXT, margin: 0,
  });
  try {
    s.addImage({
      path: path.join(SHOTS, '210-backend-tests.png'),
      x: 0.3, y: 2.2, w: 4.6, h: 2.55,
      sizing: { type: 'contain', w: 4.6, h: 2.55 },
    });
  } catch {
    try {
      s.addImage({
        path: path.join(SHOTS, '197-tests.png'),
        x: 0.3, y: 2.2, w: 4.6, h: 2.55,
        sizing: { type: 'contain', w: 4.6, h: 2.55 },
      });
    } catch { /* */ }
  }
  try {
    s.addImage({
      path: path.join(SHOTS, '212-docker.png'),
      x: 5.2, y: 2.2, w: 4.4, h: 2.0,
      sizing: { type: 'contain', w: 4.4, h: 2.0 },
    });
  } catch {
    try {
      s.addImage({
        path: path.join(SHOTS, '198-docker.png'),
        x: 5.2, y: 2.2, w: 4.4, h: 2.0,
        sizing: { type: 'contain', w: 4.4, h: 2.0 },
      });
    } catch { /* */ }
  }
  s.addText('docker compose up --build  ·  LiveKit env on backend only', {
    x: 5.2, y: 4.3, w: 4.4, h: 0.35, fontSize: 11, fontFace: 'Consolas', color: MUTED, margin: 0,
  });
  figNote(s, 'Figures. Backend test evidence; Docker services (own environment).');
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
    { text: 'Two browser sessions share Express + PostgreSQL; each joins LiveKit for speech', options: { bullet: true, breakLine: true } },
    { text: 'Match created → audio connected → spoken answers (answer-complete, no text upload)', options: { bullet: true, breakLine: true } },
    { text: 'Authoritative phases: speak → score → review; either player’s third personal flag ends immediately', options: { bullet: true, breakLine: true } },
    { text: 'Speech not recorded/stored/transcribed; only completion flags + scores in DB', options: { bullet: true, breakLine: true } },
    { text: 'Play-again: new match + new LiveKit room; Docker Compose runs three app services', options: { bullet: true, breakLine: true } },
    { text: 'Repository: frontend, backend, DB, Docker, tests, docs (GitHub on title slide)', options: { bullet: true } },
  ], {
    x: 0.6, y: 1.55, w: 8.8, h: 3.2, fontSize: 14, color: TEXT, paraSpaceAfter: 7,
  });
  footer(s, 13);
}

// ========== 14 Goal + limits ==========
{
  const s = pres.addSlide();
  s.background = { color: BG };
  titleBar(s, '6. Evaluation — was the goal achieved?');
  s.addText('Yes — for the defined academic MVP (not production readiness).', {
    x: 0.5, y: 0.95, w: 9, h: 0.35, fontSize: 15, bold: true, color: GREEN, margin: 0,
  });
  s.addText('Evidence', {
    x: 0.5, y: 1.4, w: 4.5, h: 0.28, fontSize: 13, bold: true, color: ACCENT, margin: 0,
  });
  s.addText([
    { text: 'Two anonymous browser sessions', options: { bullet: true, breakLine: true } },
    { text: 'Interest matchmaking (3→2→1)', options: { bullet: true, breakLine: true } },
    { text: 'Live spoken turns + peer scoring', options: { bullet: true, breakLine: true } },
    { text: 'Separate P1/P2 flag counts → THREE_FLAGS when either reaches 3', options: { bullet: true, breakLine: true } },
    { text: 'SPA + API + Postgres + LiveKit', options: { bullet: true, breakLine: true } },
    { text: 'Docker Compose (3 app services)', options: { bullet: true, breakLine: true } },
    { text: 'Automated tests pass (FE + BE)', options: { bullet: true } },
  ], {
    x: 0.5, y: 1.7, w: 4.5, h: 3.1, fontSize: 12, color: TEXT, paraSpaceAfter: 3,
  });
  s.addText('Why LiveKit (not raw WebRTC)', {
    x: 5.3, y: 1.4, w: 4.2, h: 0.28, fontSize: 13, bold: true, color: MUTED, margin: 0,
  });
  s.addText('LiveKit is part of this project’s defined solution (not an IU-required audio stack). Managed LiveKit reduced:\n• signaling complexity\n• TURN/STUN responsibility\n• connection-management complexity\n• development time\n\n(Technical API: LiveKit official docs.)\n\nLimits: Cloud + internet, demo reconnection, no recording/transcription/moderation, temporary sessions, polling for game state.', {
    x: 5.3, y: 1.75, w: 4.2, h: 2.95, fontSize: 11, color: TEXT, margin: 0, valign: 'top',
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
    { text: 'Managed LiveKit avoided raw WebRTC infrastructure', options: { bullet: true, breakLine: true } },
    { text: 'Server-owned game state + short-lived media tokens', options: { bullet: true, breakLine: true } },
    { text: 'Polling adequate for game sync; LiveKit for audio only', options: { bullet: true, breakLine: true } },
    { text: 'Focused tests (token, audio states, third flag) beat volume', options: { bullet: true } },
  ], {
    x: 0.5, y: 1.45, w: 4.5, h: 2.8, fontSize: 13, color: TEXT, paraSpaceAfter: 6,
  });
  s.addText('Discussed only (not implemented)', {
    x: 5.3, y: 1.05, w: 4.2, h: 0.3, fontSize: 14, bold: true, color: MUTED, margin: 0,
  });
  s.addText([
    { text: 'Authenticated accounts & history', options: { bullet: true, breakLine: true } },
    { text: 'WebSockets for game state; advanced reconnect', options: { bullet: true, breakLine: true } },
    { text: 'Recording / transcription / voice moderation', options: { bullet: true, breakLine: true } },
    { text: 'Cloud deploy of the app stack; rankings', options: { bullet: true } },
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
      text: 'LiveKit. (n.d.). LiveKit documentation. https://docs.livekit.io/',
      options: { breakLine: true },
    },
    {
      text: 'LiveKit. (n.d.). Access tokens. https://docs.livekit.io/home/server/generating-tokens/',
      options: { breakLine: true },
    },
    {
      text: 'LiveKit. (n.d.). JavaScript client SDK. https://docs.livekit.io/home/client/connect/',
      options: { breakLine: true },
    },
    {
      text: 'Kanaan, M. B. (2026). Minduel Lite [Computer software]. GitHub. ' + GH,
      options: {},
    },
  ], {
    x: 0.5, y: 1.4, w: 9, h: 3.55, fontSize: 10, color: TEXT, paraSpaceAfter: 5,
  });
  footer(s, 18);
}

const out = path.join(ROOT, 'docs', 'presentation', 'MinduelLite-Oral-Project-Report.pptx');
await pres.writeFile({ fileName: out });
console.log('Wrote', out);
