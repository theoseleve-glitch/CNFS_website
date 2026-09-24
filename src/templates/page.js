// Page composer: assembles a full page's <body> content (skip link, header,
// <main> of sections, footer, back-to-top button) and hands it to
// renderDocument for the surrounding shell. The skip link, footer, and
// back-to-top button appear identically on every page in the source except
// 404.html, which has none of the three and a structurally different
// (minimal) header — so each is gated behind an explicit page flag
// (`skipLink`, `footer`, `backToTop`, default true; `headerVariant`), same
// pattern as `page.transparentHeader`/`page.magneticCta` below. The
// preloader and grain overlay, which are index.html-only, are instead gated
// in document.js behind page.preloader.
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { each, attr } from './lib/html.js';
import { renderDocument } from './document.js';
import { renderHeader } from './globals/header.js';
import { renderFooter } from './globals/footer.js';
import { renderSection } from './sections/index.js';

// A plain object here means "mergeable record", not an array or null — both
// are typeof 'object' in JS but neither has independent keys worth merging.
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// index.html's header/footer chrome genuinely differs from the other 8 pages
// (shorter footer brand copy, "About"/"Contact" instead of "About Us"/
// "Contact Us", a shorter copyright line, no "A student project at" credit
// prefix) even though it shares the same frozen globals.json. Rather than
// forking globals.json per page, a page may supply `globalsOverride` to
// patch just the keys that differ.
//
// The merge is one level deep, applied uniformly to every top-level key (no
// per-key special case): for a key present in the override, if BOTH the base
// and override values are plain objects, they are merged one level deep —
// override keys win, base keys not mentioned survive (e.g. overriding
// `footer.brandDesc` alone does not require restating `footer.columns`).
// Otherwise — arrays, scalars, null, or a base/override type mismatch — the
// override value replaces the base value wholesale. No recursion beyond this
// one level and no deep-merge helper: a page that wants to replace a whole
// nested object restates its keys, which is visible in the JSON rather than
// silently dropping sibling keys.
//
// With no `globalsOverride`, this returns `globals` unchanged, so the other
// 8 pages render byte-identically to before this existed.
export function mergeGlobals(globals, override) {
  if (!override) return globals;
  const merged = { ...globals };
  for (const key of Object.keys(override)) {
    merged[key] = isPlainObject(globals[key]) && isPlainObject(override[key])
      ? { ...globals[key], ...override[key] }
      : override[key];
  }
  return merged;
}

export function renderPage({ page, globals, theme, mode = 'public' }) {
  const pageGlobals = mergeGlobals(globals, page.globalsOverride);

  const skipLink = page.skipLink === false
    ? ''
    : `<a href="#main-content" class="skip-link">Skip to content</a>`;

  const header = renderHeader({
    globals: pageGlobals,
    currentPath: page.path,
    transparent: page.transparentHeader !== false,
    magneticCta: page.magneticCta === true,
    minimal: page.headerVariant === 'minimal',
  });

  const footer = page.footer === false ? '' : renderFooter({ globals: pageGlobals });

  const backToTop = page.backToTop === false
    ? ''
    : `<button class="back-to-top" aria-label="Back to top" title="Back to top">&#8593;</button>`;

  const body =
    skipLink +
    header +
    `<main class="site-main" id="main-content" role="main"${attr('style', page.mainStyle)}>` +
    each(page.sections, (s) => renderSection(s, { mode })) +
    `</main>` +
    footer +
    backToTop;

  return renderDocument({ page, globals, theme, body });
}
