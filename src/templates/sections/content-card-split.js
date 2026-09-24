// Section: content-card-split. Source of truth: src/partners.html "In-Kind
// Partnerships" section — a 2-column grid: prose (label/title/body) on the
// left, a nested 2-column grid of small info-cards on the right.
//
// This is a genuine fork, not an extension of timeline-roadmap or
// timeline-split, even though all three share the "grid grid--2" + broken
// `<div "` two-column skeleton (see the internal-prop convention atop
// ./index.js):
//   - timeline-roadmap's left column is always a `timeline` component;
//     this page's left column is plain prose (label/title/body
//     paragraphs), never a timeline.
//   - timeline-roadmap's right column is a vertical stack of larger
//     `.card`/`.card--stacked` items, each with an h3 title and an optional
//     `.card__icon`; timeline-split's right column cards additionally carry
//     per-card `data-scroll-3d="fly-in"` and sit inside a `.pt-3` wrapper.
//     This section's right column instead nests a second `.grid.grid--2` of
//     small, icon-less cards with an h4 `.card__title--sm` title.
//   - The outer wrapper class here is plain `grid grid--2`, never `grid--2
//     grid--align-start` as both timeline-* siblings use.
// Bending timeline-roadmap into a third shape to cover this would need a
// header/timeline switch on the left AND a stack/nested-grid switch on the
// right, plus a wrapper-class switch — more conditional branching than the
// two shapes share in common. A small sibling module is clearer.
//
// Each column's opening tag reproduces the source's `<div "
// data-scroll-3d="...">` typo verbatim. Both occurrences on this page use
// the fixed rotate-left/rotate-right pair (identical to every other
// occurrence of this bug across the source — see timeline-roadmap.js's
// note), so, like timeline-roadmap, it is hardcoded per column rather than
// exposed as a prop: nothing here varies that would need a field to carry
// it. No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, each } from '../lib/html.js';

function renderBody(body) {
  return each(body || [], (p, i) => (i === 0 ? `<p class="lead">${esc(p)}</p>` : `<p>${esc(p)}</p>`));
}

function renderCard(c) {
  return `<div class="card">
        <h4 class="card__title card__title--sm">${esc(c.title)}</h4>
        <p class="card__text">${esc(c.text)}</p>
      </div>`;
}

export function renderContentCardSplit(props) {
  const left = props.left || {};
  const right = props.right || {};

  return `<section class="section">
  <div class="container">
    <div class="grid grid--2">
      <div " data-scroll-3d="rotate-left">
        <span class="section-label">${esc(left.label)}</span>
        <h2 class="section-title">${esc(left.title)}</h2>
        ${renderBody(left.body)}
      </div>
      <div " data-scroll-3d="rotate-right">
        <div class="grid grid--2">
          ${each(right.cards, renderCard)}
        </div>
      </div>
    </div>
  </div>
</section>`;
}
