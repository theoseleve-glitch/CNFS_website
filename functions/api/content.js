// Content API. GET returns the live document; PUT replaces it, snapshots the
// previous state into history, and purges the edge cache so the change is
// visible immediately.

import { loadContent, saveContent, json } from '../_lib/store.js';
import { sanitizeDocument } from '../_lib/sanitize.js';

export async function onRequestGet({ env }) {
  const { doc, theme, globals, source } = await loadContent(env);
  return json({ doc, theme, globals, source });
}

export async function onRequestPut(context) {
  const { request, env, data } = context;

  if (request.headers.get('X-CNFS-Admin') !== '1') return json({ error: 'Bad request' }, 400);
  if (!env.DB) return json({ error: 'Server not configured' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { doc, theme, globals } = body || {};
  if (!doc || typeof doc !== 'object' || !doc.pages || typeof doc.pages !== 'object') {
    return json({ error: 'doc.pages is required' }, 400);
  }
  if (!theme || typeof theme !== 'object' || !globals || typeof globals !== 'object') {
    return json({ error: 'theme and globals are required' }, 400);
  }

  // Sanitise on write. The renderer escapes too — the spec requires both, so a
  // second write path added later cannot bypass the only defence.
  let clean;
  try {
    clean = sanitizeDocument({ doc, theme, globals });
  } catch (err) {
    return json({ error: String((err && err.message) || 'Rejected') }, 400);
  }

  const author = (data && data.session && data.session.email) || 'unknown';
  const updatedAt = await saveContent(env, clean, author, (body && body.note) || null);

  await purge(context, Object.keys(clean.doc.pages));

  return json({ ok: true, updatedAt, author });
}

// Best-effort edge purge for the affected URLs. Cache API deletes are
// per-datacenter, so this narrows the window rather than closing it; the short
// s-maxage bounds the rest.
async function purge(context, pageKeys) {
  try {
    const origin = new URL(context.request.url).origin;
    const cache = caches.default;
    await Promise.all(
      pageKeys.flatMap((k) => {
        const paths = k === 'index' ? ['/', '/index.html'] : [`/${k}`, `/${k}.html`];
        return paths.map((p) => cache.delete(new Request(origin + p)));
      })
    );
  } catch {
    // A failed purge is not a failed save.
  }
}
