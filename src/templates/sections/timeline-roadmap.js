// Section: timeline-roadmap. Source of truth: src/project.html "Timeline"
// section — a 2-column grid: a season timeline (left) beside a stacked
// roadmap of cards (right). This is a genuine fork of timeline-split, not
// an extension of it: timeline-split's left column is one .s-intro (label
// in a <div class="s-intro__label">, heading in .s-intro__title) plus a
// bare .timeline, with per-card `data-scroll-3d="fly-in"` on the right and
// a `.pt-3` wrapper around the card stack; this section's left column uses
// the plain `.section-label`/`.section-title` pair seen in card-grid and
// specs-grid's headers (a different component, not .s-intro), its timeline
// carries the `timeline-3d` modifier, its cards carry no per-card
// data-scroll-3d, and there is no `.pt-3` wrapper — instead each COLUMN
// (not each card) carries its own scroll-3d direction. It reuses the
// registered `timeline` helper directly (with `threeD: true`) for its left
// column, the same way timeline-split reuses it.
//
// Each source column's opening tag is `<div " data-scroll-3d="...">` — a
// stray `"` immediately after `<div`, with no class attribute before it (a
// typo in the immutable source, evidently a leftover from a removed class
// attribute). It is reproduced verbatim, hardcoded per column, because it
// is template markup, not meaningful content a CMS editor should ever
// author. No Node built-ins: this module is imported by the Cloudflare
// Workers runtime.

import { esc, cls, each } from '../lib/html.js';
import { renderTimeline } from './timeline.js';

function renderCard(c) {
  return `<div class="${cls('card', c.stacked && 'card--stacked')}">
        <div class="${cls('card__icon', c.iconVariant && `card__icon--${c.iconVariant}`)}">${esc(c.icon)}</div>
        <h3 class="card__title">${esc(c.title)}</h3>
        <p class="card__text">${esc(c.text)}</p>
      </div>`;
}

export function renderTimelineRoadmap(props, ctx) {
  const left = props.left || {};
  const right = props.right || {};

  return `<section class="section">
  <div class="container">
    <div class="grid grid--2 grid--align-start">
      <div " data-scroll-3d="rotate-left">
        <span class="section-label">${esc(left.label)}</span>
        <h2 class="section-title">${esc(left.title)}</h2>
        ${renderTimeline({ items: left.items, threeD: true })}
      </div>
      <div " data-scroll-3d="rotate-right">
        <span class="section-label">${esc(right.label)}</span>
        <h2 class="section-title">${esc(right.title)}</h2>
        ${each(right.cards, renderCard)}
      </div>
    </div>
  </div>
</section>`;
}
