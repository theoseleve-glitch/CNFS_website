// Section/helper: s-intro. Source of truth: src/index.html — a small label +
// heading (+ optional lead paragraph) block reused as the header of several
// larger composite sections (about-parallax, cards-section, timeline-split,
// sponsors-section on this page). Never appears as a bare top-level <section>
// on index.html itself, but is registered as a section type too so a future
// page that DOES use it standalone can dispatch through the registry the
// same way the composite sections here call it directly as a function.
//
// `heading` accepts a plain string OR an array of strings to be joined with a
// literal <br> — this reproduces headings like "Engineering<br>Excellence"
// without resorting to raw() (esc() runs on every line; the <br> separator
// is structural template markup, never derived from the value). No Node
// built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, attr } from '../lib/html.js';

export function renderSIntro(props) {
  const headingHtml = Array.isArray(props.heading)
    ? props.heading.map(esc).join('<br>')
    : esc(props.heading);

  const lead = props.body ? `<p class="lead"${attr('style', props.leadStyle)}>${esc(props.body)}</p>` : '';

  return `<div class="s-intro"${attr('data-scroll-3d', props.scroll3d)}>
      ${props.label ? `<div class="s-intro__label">${esc(props.label)}</div>` : ''}
      <h2 class="s-intro__title">${headingHtml}</h2>
      ${lead}
    </div>`;
}
