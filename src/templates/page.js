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

export function renderPage({ page, globals, theme, mode = 'public' }) {
  const body =
    `<a href="#main-content" class="skip-link">Skip to content</a>` +
    renderHeader({ globals, currentPath: page.path, transparent: page.transparentHeader !== false }) +
    `<main class="site-main" id="main-content" role="main">` +
    each(page.sections, (s) => renderSection(s, { mode })) +
    `</main>` +
    renderFooter({ globals }) +
    `<button class="back-to-top" aria-label="Back to top" title="Back to top">&#8593;</button>`;

  return renderDocument({ page, globals, theme, body });
}
