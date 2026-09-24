// Section: events-list. Source of truth: src/events.html "Race Calendar
// 2027" and "Team Milestones" sections (.events-list.events-3d of
// .event-card items). A genuine fork, not an extension of card-grid: the
// item markup is a two-column layout (a `.event-card__date` block of three
// stacked spans, sibling to a plain `<div>` holding a badge/title/location/
// text stack) with nothing in card-grid's single-icon-then-title-then-text
// shape.
//
// Both source instances open their header with the same stray-quote typo
// card-grid's `_brokenHeader` was built for (`<div "
// data-scroll-3d="tilt-up">`, no class, non-centered title/lead) — this
// module reproduces the identical header logic (both branches, so an
// instance without the typo still renders the plain centered header,
// keeping rendering total) rather than importing it from card-grid, since
// the two modules share no other code and Ruling 3 says fork when the
// surrounding markup differs, not just borrow a fragment silently.
//
// `badge.type` is the `event-card__badge--*` modifier class (competition /
// team / milestone in the source) and `badge.label` is the visible text.
// They are independent fields, not one derived from the other: the source's
// "Formula Student Germany" and "Formula Student UK" entries both carry
// badge.type "competition" but display the label "Future Goal", not
// "Competition" (Ruling 4 — storing one and deriving a mismatched other
// would lose information, not add redundant state).
//
// `date` is split into the three literal strings the source already shows
// in separate spans (month/day/year) rather than a single ISO value parsed
// at render time — this module has no Node built-ins and must stay a pure
// string template, and the three spans are exactly what a CMS editor would
// be filling in anyway.
//
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, attrEsc, cls, each } from '../lib/html.js';

export function renderEventsList(props, ctx) {
  const events = props.events || [];
  const broken = props._brokenHeader;

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
    <div class="events-list events-3d">
      ${each(events, (e) => `<div class="event-card">
        <div class="event-card__date">
          <span class="event-card__month">${esc(e.date.month)}</span>
          <span class="event-card__day">${esc(e.date.day)}</span>
          <span class="event-card__year">${esc(e.date.year)}</span>
        </div>
        <div>
          <span class="event-card__badge event-card__badge--${attrEsc(e.badge.type)}">${esc(e.badge.label)}</span>
          <h3 class="event-card__title">${esc(e.title)}</h3>
          <div class="event-card__location">${esc(e.location)}</div>
          <p class="event-card__text">${esc(e.text)}</p>
        </div>
      </div>`)}
    </div>
  </div>
</section>`;
}
