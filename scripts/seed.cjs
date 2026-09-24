#!/usr/bin/env node
/**
 * Generates the SQL that seeds D1 with the current content and creates an
 * admin account. Run the emitted file with:
 *
 *   npx wrangler d1 execute cnfs-content --remote --file=migrations/seed.generated.sql
 *
 * Usage:
 *   node scripts/seed.cjs content            # content + globals + theme only
 *   node scripts/seed.cjs user <email>       # also create/reset a user, password generated
 *
 * The generated password is written to .admin-credentials.txt (gitignored) so
 * it never lands in a terminal transcript or in git history.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'migrations', 'seed.generated.sql');
const ITERATIONS = 100000; // Workers caps PBKDF2 here; must match functions/_lib/auth.js

const PAGES = ['index', 'about', 'project', 'formula-student', 'partners', 'events', 'news', 'contact', '404'];

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'"; // SQLite literal

function contentSql() {
  const doc = { pages: {} };
  for (const name of PAGES) doc.pages[name] = read(`src/content/pages/${name}.json`);
  const globals = read('src/content/globals.json');
  const theme = read('src/content/theme.json');
  const now = new Date().toISOString();

  return [
    '-- Content seed: the same document the golden tests prove renders byte-identically.',
    `INSERT INTO content (id, doc, theme, globals, updated_at, updated_by)`,
    `VALUES (1, ${q(JSON.stringify(doc))}, ${q(JSON.stringify(theme))}, ${q(JSON.stringify(globals))}, ${q(now)}, 'seed')`,
    `ON CONFLICT(id) DO UPDATE SET doc=excluded.doc, theme=excluded.theme, globals=excluded.globals,`,
    `  updated_at=excluded.updated_at, updated_by=excluded.updated_by;`,
    '',
    '-- First history entry, so the very first save has something to revert to.',
    `INSERT INTO versions (doc, theme, globals, created_at, author, note)`,
    `VALUES (${q(JSON.stringify(doc))}, ${q(JSON.stringify(theme))}, ${q(JSON.stringify(globals))}, ${q(now)}, 'seed',`,
    `  'Initial import from the static site');`,
    ''
  ].join('\n');
}

function userSql(email) {
  // 18 random bytes -> 24 base64 chars. Long enough that the rate limiter, not
  // the entropy, is the binding constraint.
  const password = crypto.randomBytes(18).toString('base64url');
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  const now = new Date().toISOString();

  fs.writeFileSync(
    path.join(ROOT, '.admin-credentials.txt'),
    [
      'CNFS admin credentials',
      '======================',
      `URL:      https://cnfs.racing/admin`,
      `Email:    ${email}`,
      `Password: ${password}`,
      '',
      'Change this password after first sign-in by re-running:',
      `  node scripts/seed.cjs user ${email}`,
      'then applying the generated SQL. This file is gitignored — delete it once',
      'the password is stored in your password manager.',
      ''
    ].join('\n'),
    'utf8'
  );

  return [
    `-- User ${email}. Password hash only; the plaintext is in .admin-credentials.txt (gitignored).`,
    `INSERT INTO users (email, pw_hash, pw_salt, iterations, tokens_valid_from, disabled, created_at)`,
    `VALUES (${q(email.toLowerCase())}, ${q(hash.toString('base64'))}, ${q(salt.toString('base64'))}, ${ITERATIONS}, 0, 0, ${q(now)})`,
    `ON CONFLICT(email) DO UPDATE SET pw_hash=excluded.pw_hash, pw_salt=excluded.pw_salt,`,
    `  iterations=excluded.iterations, tokens_valid_from=${Date.now()}, disabled=0;`,
    ''
  ].join('\n');
}

const mode = process.argv[2] || 'content';
let sql = contentSql();
if (mode === 'user') {
  const email = process.argv[3];
  if (!email) {
    console.error('Usage: node scripts/seed.cjs user <email>');
    process.exit(1);
  }
  sql += '\n' + userSql(email);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${path.relative(ROOT, OUT)} (${sql.length} bytes)`);
if (mode === 'user') console.log('Credentials written to .admin-credentials.txt (gitignored)');
console.log('\nApply with:\n  npx wrangler d1 execute cnfs-content --remote --file=migrations/seed.generated.sql');
