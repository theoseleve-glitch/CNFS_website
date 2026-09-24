// Section: card-grid. Source of truth: src/about.html "What Drives Us" grid
// (.grid.grid--3.grid-decon of .card items). Ruling 15: the outer wrapper's
// --gray/--dark modifier is not consistent across sources (src/events.html
// reuses the same inner .grid.grid--3.grid-decon/.card markup under a plain
// <section class="section">), so it is data-driven via the optional
// `background` prop rather than hardcoded. Ruling 21: the section-label span
// seen above the heading on most source instances (about.html,
// project.html, formula-student.html) is available via the optional
// `label` prop — omitted entirely when absent, so pre-Ruling-21 callers
// that never set it render byte-identically to before.
//
// Task 11 (formula-student.html) adds two more optional props, both
// backwards-compatible (omitted = prior behaviour, byte-identical):
//
// `_brokenHeader` (underscore-prefixed — see the internal-prop convention
// documented atop ./index.js): src/events.html's "Partner & Public Events"
// instance and src/formula-student.html's "Competition Calendar" instance
// both open their header with `<div " data-scroll-3d="tilt-up">` — a stray
// `"` immediately after `<div`, no class attribute, a plain (non-`--center`)
// title, and (on events.html) a plain `.lead` intro instead of
// `.lead.lead--centered`. This is the same "typo in the immutable source"
// pattern reproduced verbatim (hardcoded, no prop) in timeline-roadmap.js's
// rotate-left/rotate-right columns, just with a different data-scroll-3d
// value here, and variable enough (multiple values across pages) that it
// needs to be a prop rather than hardcoded. `_brokenHeader` carries that
// value directly (e.g. `'tilt-up'`) rather than a separate boolean + value
// pair (Ruling 4: no redundant state) — its mere presence toggles the broken
// wrapper markup, its string value fills in the attribute. RULING 28: the
// value still goes through attrEsc() like every other attribute — being
// dev-authored today is not a reason to skip it; Phase 4 may feed it from a
// field a non-developer never sees (which is exactly why it is underscore-
// prefixed and excluded from the editor).
//
// `subtitle` (per card): src/formula-student.html's Static Events cards have
// a second line inside the `<h3>` — e.g. `Engineering Design<br><small
// class="card__subtitle">150 Points</small>`. That is genuine inline markup,
// but the tag structure (`<br>` + `.card__subtitle`) is presentation, not
// content, so it is hardcoded here and only the two text values (`title`,
// `subtitle`) are CMS content, both still going through esc() — no raw()
// needed.
//
// Task 13 (news.html) adds two more optional props for the "Social Media"
// instance, both backwards-compatible:
//
// `cardsCentered` / `iconLarge`: that instance's cards are `<div class="card
// text-center">` with `<div class="card__icon card__icon--lg">` — every
// card in the grid uniformly, so these are section-level flags (Ruling 4:
// asking an editor to repeat the same modifier on every card would be
// redundant state), not per-card props.
//
// `link` (per card): the same instance appends an `<a class="btn
// btn--outline-dark btn--sm mt-2">` after the text (Instagram/LinkedIn link
// out, Facebook a disabled placeholder). This reuses the exact
// href-presence convention already established by footer.js's social links
// and sponsor-grid.js's slots: `link.href` present renders a real
// `target="_blank" rel="noopener"` anchor, absent renders the `href="#"
// role="link" aria-disabled="true"` placeholder — no separate boolean is
// stored for "is this disabled" (Ruling 4), it is derived from whether href
// is set, exactly like the two prior art sites.
//
// No Node built-ins: imported by the Cloudflare Workers runtime.

import { esc, attrEsc, raw, cls, each } from '../lib/html.js';

function renderCardLink(link) {
  if (!link) return '';
  return link.href
    ? `<a href="${attrEsc(link.href)}" target="_blank" rel="noopener" class="btn btn--outline-dark btn--sm mt-2">${esc(link.label)}</a>`
    : `<a href="#" role="link" aria-disabled="true" class="btn btn--outline-dark btn--sm mt-2">${esc(link.label)}</a>`;
}

export function renderCardGrid(props, ctx) {
  const cards = props.cards || [];
  const columns = props.columns || 3;
  const broken = props._brokenHeader;
  const centered = props.cardsCentered;
  const iconLarge = props.iconLarge;

  const header = (props.label || props.title || props.intro)
    ? broken
      ? `<div " data-scroll-3d="${attrEsc(broken)}">
      ${props.label ? `<span class="section-label">${esc(props.label)}</span>` : ''}
      ${props.title ? `<h2 class="section-title">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead">${esc(props.intro)}</p>` : ''}
    </div>`
      : `<div class="text-center" data-scroll-3d="fly-in">
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
      ${each(cards, (c) => `<div class="${cls('card', centered && 'text-center')}">
        ${c.icon ? `<div class="${cls('card__icon', iconLarge && 'card__icon--lg')}">${raw(c.icon)}</div>` : ''}
        <h3 class="card__title">${esc(c.title)}${c.subtitle ? `<br><small class="card__subtitle">${esc(c.subtitle)}</small>` : ''}</h3>
        <p class="card__text">${esc(c.text)}</p>
        ${renderCardLink(c.link)}
      </div>`)}
    </div>
  </div>
</section>`;
}
