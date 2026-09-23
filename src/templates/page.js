// Page composer: assembles a full page's <body> content (skip link, header,
// <main> of sections, footer, back-to-top button) and hands it to
// renderDocument for the surrounding shell. The skip link and back-to-top
// button appear identically on every page in the source except 404.html
// (out of scope here — Task 15 revisits it), so they are hardcoded rather
// than gated behind a page flag; the preloader and grain overlay, which are
// index.html-only, are instead gated in document.js behind page.preloader.
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { each } from './lib/html.js';
import { renderDocument } from './document.js';
import { renderHeader } from './globals/header.js';
import { renderFooter } from './globals/footer.js';
import { renderSection } from './sections/index.js';

// index.html's header/footer chrome genuinely differs from the other 8 pages
// (shorter footer brand copy, "About"/"Contact" instead of "About Us"/
// "Contact Us", a shorter copyright line, no "A student project at" credit
// prefix) even though it shares the same frozen globals.json. Rather than
// forking globals.json per page, a page may supply `globalsOverride` to
// patch just the keys that differ. The merge is intentionally shallow: each
// top-level key in the override replaces the corresponding globals key
// outright, except `footer`, which is merged one level deeper so a page can
// override e.g. `footer.brandDesc` alone without having to restate
// `footer.columns`. No deep-merge/recursion beyond that one nested level.
// With no `globalsOverride`, this is a no-op and output is byte-identical to
// before.
function mergeGlobals(globals, override) {
  if (!override) return globals;
  const merged = { ...globals, ...override };
  if (override.footer) {
    merged.footer = { ...(globals.footer || {}), ...override.footer };
  }
  return merged;
}

export function renderPage({ page, globals, theme, mode = 'public' }) {
  const pageGlobals = mergeGlobals(globals, page.globalsOverride);

  const body =
    `<a href="#main-content" class="skip-link">Skip to content</a>` +
    renderHeader({
      globals: pageGlobals,
      currentPath: page.path,
      transparent: page.transparentHeader !== false,
      magneticCta: page.magneticCta === true,
    }) +
    `<main class="site-main" id="main-content" role="main">` +
    each(page.sections, (s) => renderSection(s, { mode })) +
    `</main>` +
    renderFooter({ globals: pageGlobals }) +
    `<button class="back-to-top" aria-label="Back to top" title="Back to top">&#8593;</button>`;

  return renderDocument({ page, globals, theme, body });
}
