import {
  hashPassword, timingSafeEqual, signSession, sessionCookie, clearedCookie,
  sessionExpiry, tooManyAttempts, recordFailure
} from '../../_lib/auth.js';
import { json } from '../../_lib/store.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.headers.get('X-CNFS-Admin') !== '1') {
    return json({ error: 'Bad request' }, 400);
  }
  if (!env.SESSION_SECRET || !env.DB) return json({ error: 'Server not configured' }, 500);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Rate limit BEFORE any PBKDF2 work, so a flood cannot burn CPU.
  if (await tooManyAttempts(env.DB, ip)) {
    return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }

  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');
  if (!email || !password) return json({ error: 'Email and password required' }, 400);

  const user = await env.DB.prepare(
    'SELECT email, pw_hash, pw_salt, iterations, disabled FROM users WHERE email = ?'
  ).bind(email).first();

  // Same response and roughly the same work for "no such user" and "wrong
  // password", so the endpoint does not enumerate accounts.
  const salt = (user && user.pw_salt) || 'AAAAAAAAAAAAAAAAAAAAAA==';
  const iterations = (user && user.iterations) || 100000;
  const candidate = await hashPassword(password, salt, iterations);

  if (!user || user.disabled || !timingSafeEqual(candidate, user.pw_hash)) {
    await recordFailure(env.DB, ip);
    return json({ error: 'Incorrect email or password' }, 401);
  }

  const iat = Date.now();
  const token = await signSession({ email: user.email, iat, exp: sessionExpiry() }, env.SESSION_SECRET);
  return json({ ok: true, email: user.email }, 200, { 'Set-Cookie': sessionCookie(token) });
}

export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie });
}
