// Section: card-grid. Source of truth: src/about.html "What Drives Us" grid
// (.grid.grid--3.grid-decon of .card items), outer wrapper
// <section class="section section--gray">, reused with the same inner
// structure on src/formula-student.html and src/partners.html (though
// src/events.html reuses the .grid.grid--3.grid-decon/.card markup under a
// plain <section class="section"> with no --gray modifier — the prop shape
// has no background-variant field, so that page's instance cannot be
// byte-matched by this template as written; see task-7-report.md). The prop
// shape also has no eyebrow field, so the section-label span seen above the
// heading in the source pages is intentionally not reproduced here — only
// title/intro/cards are data-driven. No Node built-ins: imported by the
// Cloudflare Workers runtime.

import { esc, raw, each } from '../lib/html.js';

export function renderCardGrid(props, ctx) {
  const cards = props.cards || [];
  const columns = props.columns || 3;

  const header = (props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead lead--centered">${esc(props.intro)}</p>` : ''}
    </div>`
    : '';

  return `<section class="section section--gray">
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
