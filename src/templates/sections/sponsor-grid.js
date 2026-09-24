// Section/helper: sponsor-grid. Source of truth: src/index.html "SPONSORS"
// section — renders ONE sponsor tier (a label plus its grid of slots); the
// composite sponsors-section.js calls this once per tier. A slot is either a
// real sponsor ({name, logo, href}) or falsy/null, meaning an empty
// placeholder slot — every slot in the source today is a placeholder. The
// placeholder icon glyph differs per tier (a star for Gold, a "+" for
// Silver & Bronze) and, like card-grid's icon prop, is passed through raw()
// because it may itself be an HTML entity (e.g. "&#9733;"). Also registered
// as a standalone section type for a future page that wants a bare tier.
// `props.label` is plain esc(): the Silver/Bronze tier's label is properly
// escaped in source as `Silver &amp; Bronze Partners`, and RULING 24's
// entity-aware esc() reproduces that unchanged (it's already a complete,
// valid named reference) — no raw() exemption needed.
//
// Task 12 (partners.html) adds one optional prop: `threeD`. src/index.html's
// two tiers render `<div class="sponsor-grid">`; src/partners.html's two
// tiers render `<div class="sponsor-grid sponsors-3d">` — same structure,
// same per-slot markup, only this one modifier class differs, so it is
// data-driven the same way card-grid/specs-grid's `background` prop is
// (Ruling 15), rather than hardcoded or forked. Omitted (falsy), it renders
// byte-identically to every pre-existing caller.
//
// Task 12 also adds an optional per-slot `text` override: every placeholder
// slot on every source page reads "Your Logo Here" EXCEPT the first Gold
// slot on src/partners.html, which reads "Be Our First Gold Partner". A
// placeholder slot is still identified by the absence of `href` (real
// sponsors always have one), so `null`/`undefined` keep defaulting to "Your
// Logo Here" exactly as before; only a slot object with no `href` but a
// `text` field overrides the wording, still through esc(). No Node
// built-ins: imported by the Cloudflare Workers runtime.

import { esc, attrEsc, raw, cls, attr, each } from '../lib/html.js';

function renderSlot(slot, placeholderIcon) {
  if (!slot || !slot.href) {
    const text = (slot && slot.text) || 'Your Logo Here';
    return `<a href="#" role="link" aria-disabled="true" class="sponsor-slot"><div class="sponsor-slot__placeholder"><div class="sponsor-slot__placeholder-icon">${raw(placeholderIcon)}</div><div class="sponsor-slot__placeholder-text">${esc(text)}</div></div></a>`;
  }
  return `<a href="${attrEsc(slot.href)}" class="sponsor-slot"><img src="${attrEsc(slot.logo)}" alt="${attrEsc(slot.name)}"></a>`;
}

export function renderSponsorGrid(props) {
  const slots = props.slots || [];
  return `<div class="sponsor-tier"${attr('data-scroll-3d', props.scroll3d)}>
      <div class="sponsor-tier__label">${esc(props.label)}</div>
      <div class="${cls('sponsor-grid', props.threeD && 'sponsors-3d')}">
        ${each(slots, (s) => renderSlot(s, props.placeholderIcon))}
      </div>
    </div>`;
}
