// Section/helper: timeline. Source of truth: src/index.html "GOALS" section
// (.timeline of .timeline__item entries: dot + date + title + text). Used
// here as an internal helper called by timeline-split.js and
// timeline-roadmap.js; also registered as a standalone section type for a
// future page that wants a bare timeline. Optional `threeD` prop adds the
// `timeline-3d` modifier (src/project.html's instance has it, src/index.html's
// does not) — same pattern as cta-section's `threeD`; defaults to false, so
// existing callers that never set it render byte-identically to before. No
// Node built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, cls, each } from '../lib/html.js';

// `it.title` is plain esc(), same as date/text. Two of src/project.html's
// timeline items ("Team Formation & Concept Design", "Assembly & Testing")
// contain a bare, unescaped '&' in the heading text; that used to force a
// raw() exemption under the old blanket-escaping esc(). RULING 23's esc()
// only escapes '&' when it could start a character reference (followed by
// a letter or '#') — a bare '&' before a space is left alone, which is
// exactly what these two headings need, so this renders correctly through
// the ordinary path.
export function renderTimeline(props) {
  const items = props.items || [];
  return `<div class="${cls('timeline', props.threeD && 'timeline-3d')}">
      ${each(items, (it) => `<div class="timeline__item">
        <div class="timeline__dot"></div>
        <div class="timeline__date">${esc(it.date)}</div>
        <h4 class="timeline__title">${esc(it.title)}</h4>
        <p class="timeline__text">${esc(it.text)}</p>
      </div>`)}
    </div>`;
}
