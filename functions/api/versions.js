// Version history. Publishing is instant with no review step, so this is the
// safety net: every save snapshots the previous state and any snapshot can be
// restored in one click. A restore is itself a save, so it too is reversible.

import { loadContent, saveContent, json } from '../_lib/store.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'Server not configured' }, 500);
  const { results } = await env.DB.prepare(
    'SELECT id, created_at, author, note FROM versions ORDER BY id DESC LIMIT 50'
  ).all();
  return json({ versions: results || [] });
}

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (request.headers.get('X-CNFS-Admin') !== '1') return json({ error: 'Bad request' }, 400);
  if (!env.DB) return json({ error: 'Server not configured' }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const id = Number(body && body.id);
  if (!Number.isInteger(id)) return json({ error: 'Version id required' }, 400);

  const row = await env.DB.prepare('SELECT doc, theme, globals, created_at FROM versions WHERE id = ?')
    .bind(id).first();
  if (!row) return json({ error: 'No such version' }, 404);

  const author = (data && data.session && data.session.email) || 'unknown';

  // Restore by saving the old state as a NEW save. The current state is
  // snapshotted first by saveContent, so restoring is itself undoable.
  const payload = {
    doc: JSON.parse(row.doc),
    theme: JSON.parse(row.theme),
    globals: JSON.parse(row.globals)
  };
  const updatedAt = await saveContent(env, payload, author, `Restored version ${id} (${row.created_at})`);

  return json({ ok: true, restored: id, updatedAt });
}

// Reading one snapshot in full, for previewing before restoring.
export async function onRequestPatch({ request, env }) {
  if (!env.DB) return json({ error: 'Server not configured' }, 500);
  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id)) return json({ error: 'Version id required' }, 400);
  const row = await env.DB.prepare('SELECT doc, theme, globals FROM versions WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'No such version' }, 404);
  return json({ doc: JSON.parse(row.doc), theme: JSON.parse(row.theme), globals: JSON.parse(row.globals) });
}

export { loadContent };
