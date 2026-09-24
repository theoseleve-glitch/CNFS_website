// Section: sponsors-section. Source of truth: src/index.html "SPONSORS"
// section — an s-intro header, one sponsor-grid tier per partner level, and
// a trailing CTA link. Composes the s-intro and sponsor-grid helpers rather
// than duplicating their markup. The second tier's label reproduces the
// source's properly-escaped "Silver &amp; Bronze Partners" through
// sponsor-grid.js's plain esc() call — RULING 24's entity-aware esc()
// leaves an already-valid entity like this one unchanged.
//
// Task 12 (partners.html) found this composite needs two different header
// STYLES: src/index.html's "SPONSORS" section uses `.s-intro`/
// `.s-intro__label`/`.s-intro__title`, while src/partners.html's "Current
// Sponsors" section uses the plain `.text-center`/`.section-label`/
// `.section-title--center` block also used by card-grid.js and
// specs-grid.js (confirmed against both source pages — this is not a typo
// in either). Everything else in this composite (section wrapper, id,
// tiers loop, optional cta) is identical between the two instances.
//
// RULING 31 (fix round 2): the first pass modelled the two styles as two
// separate, mutually-exclusive props (`sIntro` / `header`) with `header`
// silently taking priority when both were set. That shape has no way for a
// CMS editor — or Phase 4's field-generator reading these prop shapes — to
// see that the two fields conflict; setting both silently drops one with no
// warning. Collapsed here to ONE `header` prop carrying an explicit style
// discriminator instead: `header: { style: 's-intro' | 'plain', ...fields
// for that style }`. There is now exactly one field to set, and its shape
// makes the choice explicit rather than implicit in call order.
//
// RENDERING STAYS TOTAL: an absent `header`, or a `header.style` this
// module does not recognise, falls back to the 's-intro' rendering (the
// pre-Ruling-31 default when neither `sIntro` nor `header` was set) rather
// than throwing — this composite runs at the edge in a later phase, and a
// throw there is a blank page, not a stack trace. No Node built-ins:
// imported by the Cloudflare Workers runtime.

import { esc, attrEsc, cls, attr, each } from '../lib/html.js';
import { renderSIntro } from './s-intro.js';
import { renderSponsorGrid } from './sponsor-grid.js';

function renderPlainHeader(h) {
  return `<div class="text-center" data-scroll-3d="fly-in">
      ${h.label ? `<span class="section-label">${esc(h.label)}</span>` : ''}
      ${h.title ? `<h2 class="section-title section-title--center">${esc(h.title)}</h2>` : ''}
      ${h.intro ? `<p class="lead lead--centered-dark">${esc(h.intro)}</p>` : ''}
    </div>`;
}

function renderHeader(props) {
  const header = props.header || {};
  // Every style other than 'plain' — including 's-intro', an absent style
  // (no `header` at all), and any unrecognised value — falls back to the
  // s-intro rendering. This is what makes rendering total: there is no
  // branch that can fail to match and fall through to nothing/undefined.
  return header.style === 'plain' ? renderPlainHeader(header) : renderSIntro(header);
}

export function renderSponsorsSection(props) {
  const tiers = props.tiers || [];
  const cta = props.cta;

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}"${attr('id', props.id)}>
      <div class="container">
        ${renderHeader(props)}
        ${each(tiers, renderSponsorGrid)}
        ${cta ? `<div class="text-center mt-2">
          <span class="magnetic"><a href="${attrEsc(cta.href)}" class="btn btn--${attrEsc(cta.style)}">${esc(cta.label)}</a></span>
        </div>` : ''}
      </div>
    </section>`;
}
