// Section: card-grid. Source of truth: src/about.html "What Drives Us" grid
// (.grid.grid--3.grid-decon of .card items). Ruling 15: the outer wrapper's
// --gray/--dark modifier is not consistent across sources (src/events.html
// reuses the same inner .grid.grid--3.grid-decon/.card markup under a plain
// <section class="section">), so it is data-driven via the optional
// `background` prop rather than hardcoded. Ruling 21: the section-label span
// seen above the heading on most source instances (about.html,
// project.html, formula-student.html) is available via the optional
// `label` prop — omitted entirely when absent, so pre-Ruling-21 callers
// that never set it render byte-identically to before. No Node built-ins:
// imported by the Cloudflare Workers runtime.

import { esc, raw, cls, each } from '../lib/html.js';

export function renderCardGrid(props, ctx) {
  const cards = props.cards || [];
  const columns = props.columns || 3;

  const header = (props.label || props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.label ? `<span class="section-label">${esc(props.label)}</span>` : ''}
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead lead--centered">${esc(props.intro)}</p>` : ''}
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
