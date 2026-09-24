// Auth gate. Pages middleware runs ahead of static asset serving, so this
// protects the admin's own HTML/JS/CSS as well as the API — not just the
// endpoints.

import { verifySession, readCookie } from './_lib/auth.js';
import { json } from './_lib/store.js';

const PUBLIC_API = ['/api/auth/login'];

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const isApi = path.startsWith('/api/');
  if (!isAdmin && !isApi) return next();
  if (isApi && PUBLIC_API.includes(path)) return next();

  // The login page itself must be reachable while signed out.
  if (path === '/admin/login' || path === '/admin/login.html') return next();

  const secret = env.SESSION_SECRET;
  if (!secret) {
    // Fail closed. A missing secret must never mean "let everyone in".
    return isApi
      ? json({ error: 'Server not configured' }, 500)
      : new Response('Admin not configured', { status: 500 });
  }

  const session = await verifySession(readCookie(request, 'cnfs_session'), secret);

  if (session && env.DB) {
    // Honour revocation: a session issued before tokens_valid_from is dead,
    // which is what makes "sign out everywhere" and disabling a user work.
    try {
      const user = await env.DB.prepare('SELECT tokens_valid_from, disabled FROM users WHERE email = ?')
        .bind(session.email).first();
      if (!user || user.disabled || (session.iat || 0) < (user.tokens_valid_from || 0)) {
        return reject(isApi, url);
      }
    } catch {
      return reject(isApi, url);
    }
  }

  if (!session) return reject(isApi, url);

  context.data = { ...(context.data || {}), session };
  return next();
}

function reject(isApi, url) {
  if (isApi) return json({ error: 'Unauthorized' }, 401);
  return Response.redirect(new URL('/admin/login', url).toString(), 302);
}

// CSRF: SameSite=Strict plus a required custom header that a cross-origin form
// post cannot set. Mutating API routes call this.
export function requireCsrf(request) {
  return request.headers.get('X-CNFS-Admin') === '1';
}
