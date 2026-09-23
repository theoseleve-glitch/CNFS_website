// Section: specs-grid. Source of truth: src/project.html "Key Specifications"
// grid (.specs-grid.specs-3d of .spec-card items), outer wrapper
// <section class="section section--dark"> — the same wrapper class is used
// by every specs-grid instance in the source (src/about.html's "Our
// University" block included), so it is hardcoded rather than parameterised.
// The prop shape has no eyebrow/intro field, so the section-label span and
// lead paragraph seen above the heading on src/about.html's instance are
// intentionally not reproduced here — only title/specs are data-driven. No
// Node built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, each } from '../lib/html.js';

export function renderSpecsGrid(props, ctx) {
  const specs = props.specs || [];

  const header = props.title
    ? `<div class="text-center" data-scroll-3d="fly-in">
      <h2 class="section-title section-title--center">${esc(props.title)}</h2>
    </div>`
    : '';

  return `<section class="section section--dark">
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
