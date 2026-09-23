// Section: specs-grid. Source of truth: src/project.html "Key Specifications"
// grid (.specs-grid.specs-3d of .spec-card items). Ruling 15: the outer
// wrapper's --gray/--dark modifier is data-driven via the optional
// `background` prop rather than hardcoded (project.html and about.html's own
// specs-grid instance both happen to use --dark, but the prop keeps this
// generalisable rather than assumed). The prop shape has no eyebrow/intro
// field, so the section-label span and lead paragraph seen above the heading
// on src/about.html's instance are intentionally not reproduced here — only
// title/specs/background are data-driven. No Node built-ins: this module is
// imported by the Cloudflare Workers runtime.

import { esc, cls, each } from '../lib/html.js';

export function renderSpecsGrid(props, ctx) {
  const specs = props.specs || [];

  const header = props.title
    ? `<div class="text-center" data-scroll-3d="fly-in">
      <h2 class="section-title section-title--center">${esc(props.title)}</h2>
    </div>`
    : '';

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}">
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
