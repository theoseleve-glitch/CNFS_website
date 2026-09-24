// Section: sponsors-section. Source of truth: src/index.html "SPONSORS"
// section — an s-intro header, one sponsor-grid tier per partner level, and
// a trailing CTA link. Composes the s-intro and sponsor-grid helpers rather
// than duplicating their markup. The second tier's label reproduces the
// source's properly-escaped "Silver &amp; Bronze Partners" through
// sponsor-grid.js's plain esc() call — RULING 24's entity-aware esc()
// leaves an already-valid entity like this one unchanged.
//
// Task 12 (partners.html) adds an optional `header` prop as an alternative
// to `sIntro`. src/partners.html's "Current Sponsors" instance wraps the
// same tiers-of-sponsor-grid body, but its header is the plain
// `.text-center`/`.section-label`/`.section-title--center` block also used
// by card-grid.js and specs-grid.js — never `.s-intro`/`.s-intro__label`/
// `.s-intro__title` (confirmed against src/index.html's own SPONSORS
// section, which does use `.s-intro`). Everything else in this composite
// (section wrapper, id, tiers loop, optional cta) is identical between the
// two instances, so this is an extension of the one differing sub-block,
// not a fork of the whole composite: `header` and `sIntro` are mutually
// exclusive alternatives (no separate boolean flag — Ruling 4), `header`
// taking priority lets existing `sIntro` callers render byte-identically
// with no prop changes. This page's instance also has no trailing lead
// paragraph under the heading paired with a lighter tone — its intro
// paragraph carries `.lead.lead--centered-dark` rather than card-grid's
// plain `.lead.lead--centered`, so that class is hardcoded here rather than
// reused from card-grid's header (a genuinely different value, not worth a
// prop for a single caller). No Node built-ins: imported by the Cloudflare
// Workers runtime.

import { esc, attrEsc, cls, attr, each } from '../lib/html.js';
import { renderSIntro } from './s-intro.js';
import { renderSponsorGrid } from './sponsor-grid.js';

function renderHeader(props) {
  if (!props.header) return renderSIntro(props.sIntro || {});
  const h = props.header;
  return `<div class="text-center" data-scroll-3d="fly-in">
      ${h.label ? `<span class="section-label">${esc(h.label)}</span>` : ''}
      ${h.title ? `<h2 class="section-title section-title--center">${esc(h.title)}</h2>` : ''}
      ${h.intro ? `<p class="lead lead--centered-dark">${esc(h.intro)}</p>` : ''}
    </div>`;
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
