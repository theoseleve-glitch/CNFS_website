// Section: sponsors-section. Source of truth: src/index.html "SPONSORS"
// section — an s-intro header, one sponsor-grid tier per partner level, and
// a trailing CTA link. Composes the s-intro and sponsor-grid helpers rather
// than duplicating their markup. The second tier's label reproduces the
// source's properly-escaped "Silver &amp; Bronze Partners" through
// sponsor-grid.js's plain esc() call — RULING 24's entity-aware esc()
// leaves an already-valid entity like this one unchanged. No Node
// built-ins: imported by the Cloudflare Workers runtime.

import { esc, attrEsc, cls, attr, each } from '../lib/html.js';
import { renderSIntro } from './s-intro.js';
import { renderSponsorGrid } from './sponsor-grid.js';

export function renderSponsorsSection(props) {
  const sIntro = props.sIntro || {};
  const tiers = props.tiers || [];
  const cta = props.cta;

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}"${attr('id', props.id)}>
      <div class="container">
        ${renderSIntro(sIntro)}
        ${each(tiers, renderSponsorGrid)}
        ${cta ? `<div class="text-center mt-2">
          <span class="magnetic"><a href="${attrEsc(cta.href)}" class="btn btn--${attrEsc(cta.style)}">${esc(cta.label)}</a></span>
        </div>` : ''}
      </div>
    </section>`;
}
