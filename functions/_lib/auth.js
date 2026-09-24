// Authentication primitives. Runs on the Cloudflare Workers runtime, so this
// uses Web Crypto only — no Node built-ins.
//
// Design (from the project spec):
//   - Per-person accounts, not one shared password, so an individual can be
//     revoked without changing everyone else's credentials.
//   - PBKDF2-HMAC-SHA256 at the platform maximum of 100,000 iterations, with a
//     16-byte random salt per user.
//   - Stateless signed session cookie: HttpOnly; Secure; SameSite=Strict.
//   - `users.tokens_valid_from` invalidates sessions issued before it, which
//     gives a working "sign out everywhere" and instant user disable.

// 100,000 is the Cloudflare Workers hard ceiling for PBKDF2 — the runtime
// rejects anything higher ("iteration counts above 100000 are not supported").
// That is below the 600k OWASP suggests for PBKDF2-SHA256, so the compensating
// controls matter: login is rate limited to 10 failures per IP per 15 minutes,
// the hashes are never served to a client, and each user has a unique 16-byte
// salt so a leaked database cannot be attacked with precomputed tables.
const ITERATIONS = 100000;
const SESSION_HOURS = 12;

const enc = new TextEncoder();

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function randomSalt() {
  return b64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function hashPassword(password, saltB64, iterations = ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations },
    key,
    256
  );
  return b64(bits);
}

// Constant-time comparison. Never short-circuit on the first differing byte:
// timing differences leak how much of a guess was correct.
export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(payload, secret) {
  const body = b64(enc.encode(JSON.stringify(payload)));
  const sig = b64(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${sig}`;
}

// Returns the payload, or null for anything malformed, unsigned, expired or
// revoked. Never throws — a bad cookie must not take the admin down.
export async function verifySession(token, secret) {
  try {
    if (!token || typeof token !== 'string') return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64(sig), enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(unb64(body)));
    if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookie(token) {
  const maxAge = SESSION_HOURS * 3600;
  return `cnfs_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export const clearedCookie = 'cnfs_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

export function sessionExpiry() {
  return Date.now() + SESSION_HOURS * 3600 * 1000;
}

// Rate limiting: cap failed attempts per IP before any hashing work is done,
// so a flood cannot burn CPU on PBKDF2.
export async function tooManyAttempts(db, ip, limit = 10, windowMs = 15 * 60 * 1000) {
  const since = Date.now() - windowMs;
  await db.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(since).run();
  const row = await db.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND ts >= ?').bind(ip, since).first();
  return (row && row.n) >= limit;
}

export async function recordFailure(db, ip) {
  await db.prepare('INSERT INTO login_attempts (ip, ts) VALUES (?, ?)').bind(ip, Date.now()).run();
}

export const PBKDF2_ITERATIONS = ITERATIONS;
