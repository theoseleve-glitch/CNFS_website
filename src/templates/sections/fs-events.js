// Section: fs-events. Source of truth: src/formula-student.html "Dynamic
// Events" grid (.fs-events__grid.events-3d of .fs-event items). This is a
// genuine fork, not an extension of card-grid/specs-grid: the inner grid
// class (`fs-events__grid` vs `grid grid--N`/`specs-grid`), the item class
// (`fs-event` vs `card`/`spec-card`, with no wrapping section-background
// modifier seen elsewhere), the big standalone number
// (`.fs-event__number`, sibling to a second div, not inside it — unlike
// card-grid's `.card__icon`), and the title/text pair living in a NESTED
// div (`<div class="fs-event"><div class="fs-event__number">…</div><div><h3
// class="fs-event__title">…</h3><p class="fs-event__desc">…</p></div></div>`)
// are all markup shapes none of the existing section types have. The header
// above the grid (optional `label`/`title`/`intro`) reuses the exact
// section-label/section-title--center/lead--centered pattern from
// card-grid/specs-grid's headers, so it is copied here rather than shared
// via a helper (Ruling: fork the differing part, not the whole file, when
// the identical part is this small).
//
// `events[].number` is the plain point value shown in `.fs-event__number`
// (75, 50, 150, 300, 100 in the source) — kept numeric since it is always a
// bare integer, never a formatted string like specs-grid's `value`.
//
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, each } from '../lib/html.js';

export function renderFsEvents(props, ctx) {
  const events = props.events || [];

  const header = (props.label || props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.label ? `<span class="section-label">${esc(props.label)}</span>` : ''}
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead lead--centered">${esc(props.intro)}</p>` : ''}
    </div>`
    : '';

  return `<section class="section">
  <div class="container">
    ${header}
    <div class="fs-events__grid events-3d">
      ${each(events, (e) => `<div class="fs-event">
        <div class="fs-event__number">${esc(e.number)}</div>
        <div>
          <h3 class="fs-event__title">${esc(e.title)}</h3>
          <p class="fs-event__desc">${esc(e.text)}</p>
        </div>
      </div>`)}
    </div>
  </div>
</section>`;
}
