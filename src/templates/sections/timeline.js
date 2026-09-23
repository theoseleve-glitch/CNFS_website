// Section/helper: timeline. Source of truth: src/index.html "GOALS" section
// (.timeline of .timeline__item entries: dot + date + title + text). Used
// here as an internal helper called by timeline-split.js and
// timeline-roadmap.js; also registered as a standalone section type for a
// future page that wants a bare timeline. Optional `threeD` prop adds the
// `timeline-3d` modifier (src/project.html's instance has it, src/index.html's
// does not) — same pattern as cta-section's `threeD`; defaults to false, so
// existing callers that never set it render byte-identically to before. No
// Node built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, raw, cls, each } from '../lib/html.js';

// `it.title` uses raw(), not esc(), for one reason: two of src/project.html's
// timeline items ("Team Formation & Concept Design", "Assembly & Testing")
// contain a literal, unescaped '&' in the heading text — a typo in the
// immutable source (HTML5 tolerates an ambiguous ampersand not followed by a
// known entity name, so it still renders as a plain '&' in a browser, but
// esc() would "fix" it into &amp; and break byte parity against the frozen
// page). This is safe for every other current caller — src/index.html's
// three timeline item titles contain none of & < > — but like og:description
// in document.js, it does mean `title` is no longer defended against those
// characters; any future CMS write path for timeline items must
// validate/escape this field on write.
export function renderTimeline(props) {
  const items = props.items || [];
  return `<div class="${cls('timeline', props.threeD && 'timeline-3d')}">
      ${each(items, (it) => `<div class="timeline__item">
        <div class="timeline__dot"></div>
        <div class="timeline__date">${esc(it.date)}</div>
        <h4 class="timeline__title">${raw(it.title)}</h4>
        <p class="timeline__text">${esc(it.text)}</p>
      </div>`)}
    </div>`;
}
