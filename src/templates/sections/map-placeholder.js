// Section: map-placeholder. Source of truth: src/contact.html — a
// WordPress placeholder div ("Map - Centrale Nantes") standing in for a
// future Google Maps embed plugin. Registered as its own section type in
// ./index.js even though contact-grid.js currently calls it directly as a
// function rather than through the section registry — the same
// "registered but normally invoked as a helper" pattern already used for
// s-intro.js, so a future page embedding a map standalone can dispatch it
// the same way. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime.

import { esc } from '../lib/html.js';

export function renderMapPlaceholder(props = {}) {
  return `<div class="map-placeholder">
      ${esc(props.caption)}
    </div>`;
}
