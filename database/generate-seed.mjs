import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const templates = [
  'Does technological progress necessarily improve human life?',
  'What role should ethics play in scientific research?',
  'Is free will compatible with a deterministic universe?',
  'How should societies balance privacy and security?',
  'Can artificial intelligence ever be considered creative?',
  'What is the most important skill for lifelong learning?',
  'Should education prioritize specialization or breadth?',
  'How do cultural narratives shape political identity?',
  'Is economic growth always beneficial for society?',
  'What responsibilities do individuals have toward the environment?',
  'How should history inform present-day decision making?',
  'Does media influence public opinion more than facts?',
  'What makes a mathematical proof convincing?',
  'How should law adapt to emerging technologies?',
  'Is competition essential for human excellence?',
  'What defines meaningful work in modern society?',
  'Should art primarily challenge or comfort its audience?',
  'How does language structure the way we think?',
  'Can sports build character beyond physical fitness?',
  'What is the future of human exploration of space?',
];

const lines = [
  '-- Minduel Lite question bank: 100 competitions x 10 questions = 1000 rows',
  'BEGIN;',
];

for (let c = 1; c <= 100; c++) {
  for (let q = 1; q <= 10; q++) {
    const base = templates[(c + q) % templates.length];
    const text = `${base} (Set ${c}, Q${q})`.replace(/'/g, "''");
    lines.push(
      `INSERT INTO questions (competition_id, question_number, question_text) VALUES (${c}, ${q}, '${text}');`
    );
  }
}
lines.push('COMMIT;');

const out = path.join(__dirname, 'seed.sql');
fs.writeFileSync(out, lines.join('\n') + '\n');
console.log('Wrote', out, 'rows=1000');
