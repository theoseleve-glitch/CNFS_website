// Section: news-grid. Source of truth: src/news.html "News Grid" section
// (.news-grid.grid-decon of .news-card <article> items). A genuine fork,
// not an extension of card-grid: the item is an <article>, not a <div>,
// wraps an image before any text (card-grid's cards are icon-or-nothing,
// never a photo), and groups its text in a nested `.news-card__body` with
// a two-part `.news-card__meta` (category + date) that nothing else in the
// section vocabulary has. There is no header above the grid in the source
// (the "News Grid" comment is authoring-only), so this module renders none
// — no label/title/intro props exist to omit.
//
// `post.image` is `{src, alt}`: RULING (task-13 brief item 7) — every <img>
// emits `alt` unconditionally via attrEsc(), never attr(), so alt is a
// required sibling field, not optional. `loading="lazy"` and the
// `.news-card__image--placeholder` wrapper class are structural markup
// constants reproduced verbatim in every source instance, not content, so
// they are hardcoded rather than turned into props.
//
// `post.date` is the literal display string already used verbatim in the
// source ("March 15, 2026") — unlike events-list's three-part date, this
// one appears as a single text node with no sub-structure to preserve, so
// splitting it would invent structure the source does not have.
//
// The source markup has no anchor around or inside a news-card (the brief's
// guessed `href` field does not exist in src/news.html), so no link prop is
// modelled here — adding one would be an opaque field with no corresponding
// markup to render it into.
//
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, attrEsc, each } from '../lib/html.js';

export function renderNewsGrid(props, ctx) {
  const posts = props.posts || [];

  return `<section class="section">
  <div class="container">
    <div class="news-grid grid-decon">
      ${each(posts, (p) => `<article class="news-card">
        <div class="news-card__image news-card__image--placeholder">
          <img src="${attrEsc(p.image.src)}" alt="${attrEsc(p.image.alt)}" loading="lazy">
        </div>
        <div class="news-card__body">
          <div class="news-card__meta">
            <span class="news-card__category">${esc(p.category)}</span>
            <span>${esc(p.date)}</span>
          </div>
          <h3 class="news-card__title">${esc(p.title)}</h3>
          <p class="news-card__excerpt">${esc(p.excerpt)}</p>
        </div>
      </article>`)}
    </div>
  </div>
</section>`;
}
