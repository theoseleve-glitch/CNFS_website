// Section: cards-section. Source of truth: src/index.html "FORMULA STUDENT"
// section. NOT the same shape as the shared card-grid.js (Task 7): the
// header here is an s-intro (label + heading + lead paragraph) rather than a
// centered title/intro pair, the grid has no grid-decon modifier
// (`grid grid--3`, not `grid grid--3 grid-decon`), and the section carries
// its own trailing CTA link below the grid that card-grid.js has no prop
// for — different enough on every axis to warrant its own module rather
// than bolting page-specific variance onto the already-reviewed shared
// template. Reuses the s-intro helper for the header.
//
// `c.title` uses raw(), not esc(): src/index.html's "Business & Cost" card
// has its title properly escaped in source as `Business &amp; Cost`.
// RULING 23's esc() only escapes a bare '&' when it could start a character
// reference (followed by a letter or '#'); here the '&' is followed by a
// space, so esc() would leave it bare and break byte parity against the
// source's own `&amp;`. Mirrors the same fix applied to the Google Fonts
// href in document.js: when a value's desired escaped-vs-bare form can't be
// derived from the character-reference rule, the value carries its own
// correct entity and is passed through unchanged. Safe for this section's
// other two card titles today (no & < > in them); a future CMS write path
// for card titles must validate/escape this field on write, since raw()
// performs none of that here. No Node built-ins: imported by the Cloudflare
// Workers runtime.

import { esc, attrEsc, raw, cls, attr, each } from '../lib/html.js';
import { renderSIntro } from './s-intro.js';

export function renderCardsSection(props) {
  const sIntro = props.sIntro || {};
  const cards = props.cards || [];
  const columns = props.columns || 3;
  const cta = props.cta;

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}"${attr('id', props.id)}>
      <div class="container">
        ${renderSIntro(sIntro)}
        <div class="grid grid--${columns}">
          ${each(cards, (c) => `<div class="card">
            ${c.icon ? `<div class="card__icon">${raw(c.icon)}</div>` : ''}
            <h3 class="card__title">${raw(c.title)}</h3>
            <p class="card__text">${esc(c.text)}</p>
          </div>`)}
        </div>
        ${cta ? `<div class="text-center mt-3">
          <span class="magnetic"><a href="${attrEsc(cta.href)}" class="btn btn--${attrEsc(cta.style)}">${esc(cta.label)}</a></span>
        </div>` : ''}
      </div>
    </section>`;
}
