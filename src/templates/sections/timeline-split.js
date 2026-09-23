// Section: timeline-split. Source of truth: src/index.html "GOALS" section —
// a 2-column grid: an s-intro + timeline on the left, a stack of cards (each
// carrying data-scroll-3d="fly-in", hardcoded since every instance on this
// page has it) on the right. Reuses the s-intro and timeline helpers for the
// left column. No Node built-ins: imported by the Cloudflare Workers
// runtime.

import { esc, raw, cls, attr, each } from '../lib/html.js';
import { renderSIntro } from './s-intro.js';
import { renderTimeline } from './timeline.js';

function renderCard(c) {
  return `<div class="${cls('card', c.stacked && 'card--stacked')}" data-scroll-3d="fly-in">
        ${c.icon ? `<div class="card__icon">${raw(c.icon)}</div>` : ''}
        <h3 class="card__title">${esc(c.title)}</h3>
        <p class="card__text">${esc(c.text)}</p>
      </div>`;
}

export function renderTimelineSplit(props) {
  const sIntro = props.sIntro || {};
  const cards = props.cards || [];

  return `<section class="section"${attr('id', props.id)}>
      <div class="container">
        <div class="grid grid--2 grid--align-start">
          <div>
            ${renderSIntro(sIntro)}
            ${renderTimeline({ items: props.timelineItems })}
          </div>
          <div class="pt-3">
            ${each(cards, renderCard)}
          </div>
        </div>
      </div>
    </section>`;
}
