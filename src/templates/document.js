// Document shell template: everything outside <main> — doctype, <head>, and
// the closing <body> scripts. No Node built-ins: this module is imported by
// the Cloudflare Workers runtime in Phase 2.
//
// Transcribed from src/index.html and src/about.html, then reconciled against
// src/404.html so one template can produce either shape. Everything identical
// across the pages checked is hardcoded below as a constant; everything that
// differs (including whether a block appears at all) is read from `page`.

import { esc, attr, raw, each } from './lib/html.js';
import { renderThemeVars } from './lib/theme.js';

export function renderDocument({ page, globals, theme, body }) {
  const m = page.meta || {};
  const h = page.head || {};

  // theme-color and the favicon fill are independent values in the source
  // (they coincide on index.html and 404.html, but diverge on every other
  // page), so each has its own field — never derive one from the other.
  const robots = m.robots ? `<meta name="robots" content="${esc(m.robots)}">` : '';

  const hreflang = each(h.hreflang, (l) => `<link rel="alternate" hreflang="${esc(l.lang)}" href="${esc(l.href)}">`);

  const canonical = page.path ? `<link rel="canonical" href="${esc(page.path)}">` : '';

  const description = m.description ? `<meta name="description" content="${esc(m.description)}">` : '';

  const noscript = h.noscript
    ? `<noscript><style>
    *, *::before, *::after { opacity: 1 !important; transform: none !important; transition: none !important; }
    .preloader { display: none !important; }
  </style></noscript>`
    : '';

  const og = m.ogTitle
    ? `\n  <!-- Open Graph -->\n  <meta property="og:type" content="website">` +
      `<meta property="og:title" content="${esc(m.ogTitle)}">` +
      `<meta property="og:description" content="${esc(m.ogDescription)}">` +
      `<meta property="og:image" content="${esc(m.ogImage)}">` +
      `<meta property="og:site_name" content="${esc(m.ogSiteName)}">`
    : '';

  const faviconFill = m.faviconFill ? esc(m.faviconFill).replace('#', '%23') : '';
  const favicon = faviconFill
    ? `<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22>` +
      `<rect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22${faviconFill}%22/>` +
      `<text x=%2216%22 y=%2222%22 font-size=%2218%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22%23E8A733%22 font-family=%22sans-serif%22>C</text></svg>">`
    : '';

  const fontsComment = h.preload && h.preload.length ? '\n  <!-- Fonts: Syne (display) + Outfit (body) + Space Mono (accents) -->' : '';

  const jsonLd = h.jsonLd
    ? `<script type="application/ld+json">${raw(JSON.stringify(h.jsonLd))}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${m.themeColor ? `<meta name="theme-color" content="${esc(m.themeColor)}">` : ''}
  ${robots}
  ${hreflang}
  ${canonical}
  ${description}
  <title>${esc(page.title)}</title>
  ${favicon}
${og}
${fontsComment}
  ${each(h.preload, (src) => `<link rel="preload" as="image" href="${esc(src)}">`)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${h.fontHref ? `<link href="${esc(h.fontHref)}" rel="stylesheet">` : ''}

  <!-- Styles -->
  ${each(h.stylesheets, (href) => `<link rel="stylesheet" href="${esc(href)}">`)}

  ${jsonLd}
  ${renderThemeVars(theme)}

  ${noscript}
</head>
<body${attr('class', page.bodyClass)}>
${body}
${each(page.scripts, (src) => `<script src="${esc(src)}"></script>`)}
</body>
</html>`;
}
