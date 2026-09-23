// Section: card-grid. Source of truth: src/about.html "What Drives Us" grid
// (.grid.grid--3.grid-decon of .card items). Ruling 15: the outer wrapper's
// --gray/--dark modifier is not consistent across sources (src/events.html
// reuses the same inner .grid.grid--3.grid-decon/.card markup under a plain
// <section class="section">), so it is data-driven via the optional
// `background` prop rather than hardcoded. The prop shape also has no
// eyebrow field, so the section-label span seen above the heading in the
// source pages is intentionally not reproduced here — only
// title/intro/columns/background/cards are data-driven. No Node built-ins:
// imported by the Cloudflare Workers runtime.

import { esc, raw, cls, each } from '../lib/html.js';

export function renderCardGrid(props, ctx) {
  const cards = props.cards || [];
  const columns = props.columns || 3;

  const header = (props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
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
