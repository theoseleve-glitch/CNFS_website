// Public page renderer. Every page route is produced here from the content
// document, so a save in the admin is visible on the next request without a
// rebuild or a deploy.
//
// Static assets (css/, js/, assets/) are served by Pages before this runs.
// `dist/` deliberately contains no page HTML, otherwise the static file would
// shadow this Function and the CMS would have no effect.

import { renderPage } from '../src/templates/page.js';
import { loadContent } from './_lib/store.js';

// Worst-case staleness after a save. Short, because publishing is instant by
// requirement; the admin also purges these URLs explicitly on save.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=30, stale-while-revalidate=300';

function pageKeyFor(pathname) {
  let p = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (p === '' || p === 'index' || p === 'index.html') return 'index';
  p = p.replace(/\.html$/, '');
  return p;
}

export async function onRequestGet(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // A catch-all Function in Pages receives EVERY request, including ones that
  // should be served as static files. Anything that is not a page route must be
  // handed straight back to asset serving:
  //   - the admin and the API are not site pages;
  //   - any path with a file extension other than .html is an asset
  //     (/css/style.css, /js/main.js, /assets/images/*.png, /favicon.ico...).
  // Getting this wrong 404s every stylesheet and script on the site while the
  // HTML still renders, which looks like a CSS bug rather than a routing one.
  const p = url.pathname;
  if (p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/')) return next();
  if (/\.[a-z0-9]+$/i.test(p) && !/\.html$/i.test(p)) return next();

  const key = pageKeyFor(url.pathname);

  const { doc, theme, globals } = await loadContent(env);
  const pages = (doc && doc.pages) || {};

  const found = Object.prototype.hasOwnProperty.call(pages, key) && key !== '404';
  const pageKey = found ? key : '404';
  const page = pages[pageKey];

  // If even the 404 page is missing the document is unusable; say so plainly
  // rather than serving an empty body.
  if (!page) {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  let html;
  try {
    html = renderPage({ page, globals, theme, mode: 'public' });
  } catch (err) {
    // Rendering must stay total. A malformed section should not blank the site.
    return new Response('Temporarily unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  return new Response(html, {
    status: found ? 200 : 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': found ? CACHE_CONTROL : 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
