// Section/helper: sponsor-grid. Source of truth: src/index.html "SPONSORS"
// section — renders ONE sponsor tier (a label plus its grid of slots); the
// composite sponsors-section.js calls this once per tier. A slot is either a
// real sponsor ({name, logo, href}) or falsy/null, meaning an empty
// placeholder slot — every slot in the source today is a placeholder. The
// placeholder icon glyph differs per tier (a star for Gold, a "+" for
// Silver & Bronze) and, like card-grid's icon prop, is passed through raw()
// because it may itself be an HTML entity (e.g. "&#9733;"). Also registered
// as a standalone section type for a future page that wants a bare tier.
//
// `props.label` uses raw(), not esc(), for the same reason as card-grid's
// `c.title`: the Silver/Bronze tier's label is properly escaped in source
// as `Silver &amp; Bronze Partners`. RULING 23's esc() only escapes '&'
// when it could start a character reference (followed by a letter or '#');
// here it's followed by a space, so esc() would leave it bare and break
// byte parity against the source's own `&amp;`. Safe for the Gold tier's
// label today (no & < > in it); a future CMS write path for tier labels
// must validate/escape this field on write. No Node built-ins: imported by
// the Cloudflare Workers runtime.

import { attrEsc, raw, attr, each } from '../lib/html.js';

function renderSlot(slot, placeholderIcon) {
  if (!slot) {
    return `<a href="#" role="link" aria-disabled="true" class="sponsor-slot"><div class="sponsor-slot__placeholder"><div class="sponsor-slot__placeholder-icon">${raw(placeholderIcon)}</div><div class="sponsor-slot__placeholder-text">Your Logo Here</div></div></a>`;
  }
  return `<a href="${attrEsc(slot.href)}" class="sponsor-slot"><img src="${attrEsc(slot.logo)}" alt="${attrEsc(slot.name)}"></a>`;
}

export function renderSponsorGrid(props) {
  const slots = props.slots || [];
  return `<div class="sponsor-tier"${attr('data-scroll-3d', props.scroll3d)}>
      <div class="sponsor-tier__label">${raw(props.label)}</div>
      <div class="sponsor-grid">
        ${each(slots, (s) => renderSlot(s, props.placeholderIcon))}
      </div>
    </div>`;
}
