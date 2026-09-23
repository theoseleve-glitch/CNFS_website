// Section/helper: timeline. Source of truth: src/index.html "GOALS" section
// (.timeline of .timeline__item entries: dot + date + title + text). Used
// here as an internal helper called by timeline-split.js; also registered as
// a standalone section type for a future page that wants a bare timeline. No
// Node built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, each } from '../lib/html.js';

export function renderTimeline(props) {
  const items = props.items || [];
  return `<div class="timeline">
      ${each(items, (it) => `<div class="timeline__item">
        <div class="timeline__dot"></div>
        <div class="timeline__date">${esc(it.date)}</div>
        <h4 class="timeline__title">${esc(it.title)}</h4>
        <p class="timeline__text">${esc(it.text)}</p>
      </div>`)}
    </div>`;
}
