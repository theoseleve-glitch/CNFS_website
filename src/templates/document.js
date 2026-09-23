// Document shell template: everything outside <main> — doctype, <head>, and
// the closing <body> scripts. No Node built-ins: this module is imported by
// the Cloudflare Workers runtime in Phase 2.
//
// Transcribed from src/index.html and src/about.html, then reconciled against
// src/404.html so one template can produce either shape. Everything identical
// across the pages checked is hardcoded below as a constant; everything that
// differs (including whether a block appears at all) is read from `page`.

import { esc, attr, attrEsc, raw, each } from './lib/html.js';
import { renderThemeVars } from './lib/theme.js';

export function renderDocument({ page, globals, theme, body }) {
  const m = page.meta || {};
  const h = page.head || {};

  // theme-color and the favicon fill are independent values in the source
  // (they coincide on index.html and 404.html, but diverge on every other
  // page), so each has its own field — never derive one from the other.
  const robots = m.robots ? `<meta name="robots" content="${attrEsc(m.robots)}">` : '';

  const hreflang = each(h.hreflang, (l) => `<link rel="alternate" hreflang="${attrEsc(l.lang)}" href="${attrEsc(l.href)}">`);

  const canonical = page.path ? `<link rel="canonical" href="${attrEsc(page.path)}">` : '';

  const description = m.description ? `<meta name="description" content="${attrEsc(m.description)}">` : '';

  const noscript = h.noscript
    ? `<noscript><style>
    *, *::before, *::after { opacity: 1 !important; transform: none !important; transition: none !important; }
    .preloader { display: none !important; }
  </style></noscript>`
    : '';

  const og = m.ogTitle
    ? `\n  <!-- Open Graph -->\n  <meta property="og:type" content="website">` +
      `<meta property="og:title" content="${attrEsc(m.ogTitle)}">` +
      `<meta property="og:description" content="${attrEsc(m.ogDescription)}">` +
      `<meta property="og:image" content="${attrEsc(m.ogImage)}">` +
      `<meta property="og:site_name" content="${attrEsc(m.ogSiteName)}">`
    : '';

  // faviconFill is nested inside the outer href="..." attribute of the <link> below
  // (the %22s are percent-encoded quotes for the inline SVG's own attributes, not
  // HTML attribute delimiters — the HTML parser only sees the real double quotes
  // that open and close href). A literal '"' in faviconFill would still break out
  // of that outer href attribute, so it goes through attrEsc(), not esc().
  const faviconFill = m.faviconFill ? attrEsc(m.faviconFill).replace('#', '%23') : '';
  const favicon = faviconFill
    ? `<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22>` +
      `<rect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22${faviconFill}%22/>` +
      `<text x=%2216%22 y=%2222%22 font-size=%2218%22 font-weight=%22bold%22 text-anchor=%22middle%22 fill=%22%23E8A733%22 font-family=%22sans-serif%22>C</text></svg>">`
    : '';

  const fontsComment = h.preload && h.preload.length ? '\n  <!-- Fonts: Syne (display) + Outfit (body) + Space Mono (accents) -->' : '';

  // EXCEPTION to "every content-derived attribute uses attrEsc()": h.fontHref is a
  // structural constant reproduced verbatim from the source (the Google Fonts URL),
  // not free-form editable content, and it is the only attribute value anywhere in
  // the 9 source pages that carries a raw, unescaped '&' (family=X&family=Y&...).
  // No attribute in the source ever uses '&amp;'. attrEsc() escapes '&' to '&amp;',
  // which would break byte parity against every page. raw() reproduces it exactly.
  // If this field ever becomes user-editable, it MUST be validated as a well-formed
  // URL on write (e.g. an allowlisted host, no quote/angle-bracket characters) —
  // raw() inside an attribute is an injection point for anything not pre-validated.
  const fontLink = h.fontHref ? `<link href="${raw(h.fontHref)}" rel="stylesheet">` : '';

  const jsonLd = h.jsonLd
    ? `<script type="application/ld+json">${raw(JSON.stringify(h.jsonLd))}</script>`
    : '';

  // The preloader overlay and grain texture div sit immediately inside
  // <body>, before everything else, only on index.html in the source (no
  // other page has them). They are document furniture, not page content, so
  // they live here behind an explicit page flag rather than as a section.
  const chrome = page.preloader
    ? `<div class="preloader" role="status" aria-label="Loading">
    <div class="preloader__logo">${esc((globals.brand || {}).name)}</div>
    <div class="preloader__bar"><div class="preloader__fill"></div></div>
  </div>

  <div class="grain" aria-hidden="true"></div>

  `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${m.themeColor ? `<meta name="theme-color" content="${attrEsc(m.themeColor)}">` : ''}
  ${robots}
  ${hreflang}
  ${canonical}
  ${description}
  <title>${esc(page.title)}</title>
  ${favicon}
${og}
${fontsComment}
  ${each(h.preload, (src) => `<link rel="preload" as="image" href="${attrEsc(src)}">`)}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fontLink}

  <!-- Styles -->
  ${each(h.stylesheets, (href) => `<link rel="stylesheet" href="${attrEsc(href)}">`)}

  ${jsonLd}
  ${renderThemeVars(theme)}

  ${noscript}
</head>
<body${attr('class', page.bodyClass)}>
${chrome}${body}
${each(page.scripts, (src) => `<script src="${attrEsc(src)}"></script>`)}
</body>
</html>`;
}
