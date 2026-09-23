// Section: labeled-card-grid. Source of truth: src/about.html "Our Mission"
// section (.grid.grid--3.grid-decon of .card items, wrapped in a labeled
// text-center header). This is card-grid.js's markup (icon?/title/text card,
// same grid-decon grid, same background/columns semantics) PLUS the
// `section-label` eyebrow span that every real card-grid instance in the
// source (about.html, project.html, formula-student.html) actually carries
// but that the frozen card-grid.js prop shape has no field for (flagged as a
// known gap in task-7-report.md). card-grid.js is frozen/reviewed and is not
// modified here — this is a sibling type, not a patch to it, so it
// duplicates card-grid's small grid-rendering block rather than importing
// from it (card-grid.js exports no reusable helper). No Node built-ins: this
// module is imported by the Cloudflare Workers runtime.

import { esc, raw, cls, attr, each } from '../lib/html.js';

export function renderLabeledCardGrid(props, ctx) {
  const cards = props.cards || [];
  const columns = props.columns || 3;

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
    <div class="grid grid--${columns} grid-decon">
      ${each(cards, (c) => `<div class="card">
        ${c.icon ? `<div class="card__icon">${raw(c.icon)}</div>` : ''}
        <h3 class="card__title">${esc(c.title)}</h3>
        <p class="card__text">${esc(c.text)}</p>
      </div>`)}
    </div>
  </div>
</section>`;
}
