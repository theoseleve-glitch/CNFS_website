// Content store. Reads the live document from D1, and falls back to the
// content bundled at build time if D1 is empty or unreachable.
//
// The fallback is load-bearing: the site publishes instantly with no review
// step, so the render path must never be able to serve a blank page. A cold
// database, a failed migration or a D1 outage degrades to exactly the content
// that shipped with the deploy, which is the same content the golden tests
// prove byte-identical to the original site.

import indexPage from '../../src/content/pages/index.json';
import aboutPage from '../../src/content/pages/about.json';
import projectPage from '../../src/content/pages/project.json';
import fsPage from '../../src/content/pages/formula-student.json';
import partnersPage from '../../src/content/pages/partners.json';
import eventsPage from '../../src/content/pages/events.json';
import newsPage from '../../src/content/pages/news.json';
import contactPage from '../../src/content/pages/contact.json';
import notFoundPage from '../../src/content/pages/404.json';
import seedGlobals from '../../src/content/globals.json';
import seedTheme from '../../src/content/theme.json';

export const BUNDLED = {
  doc: {
    pages: {
      'index': indexPage,
      'about': aboutPage,
      'project': projectPage,
      'formula-student': fsPage,
      'partners': partnersPage,
      'events': eventsPage,
      'news': newsPage,
      'contact': contactPage,
      '404': notFoundPage
    }
  },
  globals: seedGlobals,
  theme: seedTheme
};

const parse = (value, fallback) => {
  try {
    const v = JSON.parse(value);
    return v && typeof v === 'object' ? v : fallback;
  } catch {
    return fallback;
  }
};

export async function loadContent(env) {
  try {
    if (!env || !env.DB) return { ...BUNDLED, source: 'bundled' };
    const row = await env.DB.prepare('SELECT doc, theme, globals FROM content WHERE id = 1').first();
    if (!row) return { ...BUNDLED, source: 'bundled' };
    return {
      doc: parse(row.doc, BUNDLED.doc),
      theme: parse(row.theme, BUNDLED.theme),
      globals: parse(row.globals, BUNDLED.globals),
      source: 'd1'
    };
  } catch {
    return { ...BUNDLED, source: 'bundled' };
  }
}

export async function saveContent(env, { doc, theme, globals }, author, note) {
  const now = new Date().toISOString();
  const d = JSON.stringify(doc);
  const t = JSON.stringify(theme);
  const g = JSON.stringify(globals);

  // Snapshot first, then overwrite. If the second statement fails the history
  // still gained a row, which is the harmless direction to fail in.
  await env.DB.batch([
    env.DB.prepare('INSERT INTO versions (doc, theme, globals, created_at, author, note) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(d, t, g, now, author, note || null),
    env.DB.prepare(
      `INSERT INTO content (id, doc, theme, globals, updated_at, updated_by) VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET doc = excluded.doc, theme = excluded.theme,
         globals = excluded.globals, updated_at = excluded.updated_at, updated_by = excluded.updated_by`
    ).bind(d, t, g, now, author)
  ]);
  return now;
}

export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders }
  });
}
