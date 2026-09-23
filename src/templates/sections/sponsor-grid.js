// Section/helper: sponsor-grid. Source of truth: src/index.html "SPONSORS"
// section — renders ONE sponsor tier (a label plus its grid of slots); the
// composite sponsors-section.js calls this once per tier. A slot is either a
// real sponsor ({name, logo, href}) or falsy/null, meaning an empty
// placeholder slot — every slot in the source today is a placeholder. The
// placeholder icon glyph differs per tier (a star for Gold, a "+" for
// Silver & Bronze) and, like card-grid's icon prop, is passed through raw()
// because it may itself be an HTML entity (e.g. "&#9733;"). Also registered
// as a standalone section type for a future page that wants a bare tier. No
// Node built-ins: imported by the Cloudflare Workers runtime.

import { esc, attrEsc, raw, attr, each } from '../lib/html.js';

function renderSlot(slot, placeholderIcon) {
  if (!slot) {
    return `<a href="#" role="link" aria-disabled="true" class="sponsor-slot"><div class="sponsor-slot__placeholder"><div class="sponsor-slot__placeholder-icon">${raw(placeholderIcon)}</div><div class="sponsor-slot__placeholder-text">Your Logo Here</div></div></a>`;
  }
  return `<a href="${attrEsc(slot.href)}" class="sponsor-slot"><img src="${attrEsc(slot.logo)}" alt="${attrEsc(slot.name)}"></a>`;
}

export function renderSponsorGrid(props) {
  const slots = props.slots || [];
  return `<div class="sponsor-tier"${attr('data-scroll-3d', props.scroll3d)}>
      <div class="sponsor-tier__label">${esc(props.label)}</div>
      <div class="sponsor-grid">
        ${each(slots, (s) => renderSlot(s, props.placeholderIcon))}
      </div>
    </div>`;
}
