/**
 * Verify database/seed.sql meets MVP requirements:
 * - exactly 100 competition IDs (1–100)
 * - exactly 10 questions per competition (1–10)
 * - exactly 1,000 question rows
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, 'seed.sql');
const sql = fs.readFileSync(seedPath, 'utf8');

const re =
  /INSERT INTO questions \(competition_id, question_number, question_text\) VALUES \((\d+), (\d+),/g;

const rows = [];
let m;
while ((m = re.exec(sql)) !== null) {
  rows.push({ c: Number(m[1]), q: Number(m[2]) });
}

const byComp = new Map();
for (const r of rows) {
  if (!byComp.has(r.c)) byComp.set(r.c, new Set());
  byComp.get(r.c).add(r.q);
}

const missingCompetitions = [];
for (let i = 1; i <= 100; i++) {
  if (!byComp.has(i)) missingCompetitions.push(i);
}

const problems = [];
for (const [c, qs] of byComp) {
  if (c < 1 || c > 100) problems.push(`competition ${c} out of range`);
  if (qs.size !== 10) problems.push(`competition ${c} has ${qs.size} questions`);
  for (let q = 1; q <= 10; q++) {
    if (!qs.has(q)) problems.push(`competition ${c} missing question ${q}`);
  }
}

const uniquePairs = new Set(rows.map((r) => `${r.c}:${r.q}`)).size;
const ok =
  rows.length === 1000 &&
  byComp.size === 100 &&
  missingCompetitions.length === 0 &&
  problems.length === 0 &&
  uniquePairs === 1000;

console.log('seed file:', seedPath);
console.log('total rows:', rows.length, rows.length === 1000 ? 'OK' : 'FAIL');
console.log(
  'competition count:',
  byComp.size,
  byComp.size === 100 ? 'OK' : 'FAIL'
);
console.log(
  'questions per competition:',
  problems.length === 0 ? 'all 10 OK' : 'FAIL'
);
console.log('unique (competition, question) pairs:', uniquePairs);
if (missingCompetitions.length) {
  console.log('missing competitions:', missingCompetitions);
}
if (problems.length) {
  console.log('problems:', problems.slice(0, 20));
}
console.log(ok ? 'VERIFY PASSED' : 'VERIFY FAILED');
process.exit(ok ? 0 : 1);
