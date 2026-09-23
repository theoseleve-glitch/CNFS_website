// Section: labeled-specs-grid. Source of truth: src/about.html "Our
// University" section (.specs-grid.specs-3d of .spec-card items, wrapped in
// a labeled text-center header with both an eyebrow AND a lead paragraph).
// This is specs-grid.js's markup (value/label spec card, same
// background semantics) PLUS the `section-label` eyebrow span and intro
// paragraph that every real specs-grid instance in the source (about.html,
// project.html, formula-student.html) actually carries but that the frozen
// specs-grid.js prop shape has no field for (flagged as a known gap in
// task-7-report.md). specs-grid.js is frozen/reviewed and is not modified
// here — this is a sibling type, not a patch to it, so it duplicates
// specs-grid's small grid-rendering block rather than importing from it
// (specs-grid.js exports no reusable helper). No Node built-ins: this module
// is imported by the Cloudflare Workers runtime.

import { esc, cls, attr, each } from '../lib/html.js';

export function renderLabeledSpecsGrid(props, ctx) {
  const specs = props.specs || [];

  const header = (props.eyebrow || props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.eyebrow ? `<span class="section-label">${esc(props.eyebrow)}</span>` : ''}
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead lead--centered">${esc(props.intro)}</p>` : ''}
    </div>`
    : '';

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}"${attr('id', props.id)}>
  <div class="container">
    ${header}
    <div class="specs-grid specs-3d">
      ${each(specs, (s) => `<div class="spec-card">
        <div class="spec-card__value">${esc(s.value)}</div>
        <div class="spec-card__label">${esc(s.label)}</div>
      </div>`)}
    </div>
  </div>
</section>`;
}
