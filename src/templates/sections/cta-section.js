// Section: cta-section. Source of truth: src/about.html (single action, no
// wrapper) and src/project.html (two actions, wrapped in .btn-group — the
// wrapper appears only when there is more than one action). Ruling 15: the
// source pages split 7x <section class="cta-section cta-3d"> to 1x plain
// <section class="cta-section">, so the 3d modifier is data-driven via the
// optional `threeD` boolean prop rather than always-on. No Node built-ins:
// this module is imported by the Cloudflare Workers runtime.
//
// Task 14 (contact.html): its cta-section has a second action, "Download
// Brochure (Coming Soon)", that is not a live link in the source —
// `<a href="#" class="btn btn--outline btn--lg" aria-disabled="true">`,
// missing the `href` other actions carry. This reuses the exact
// href-presence-derived-disabled convention already established by
// footer.js's social links, sponsor-grid.js's slots, and card-grid.js's
// per-card link (Ruling 4: no redundant state) — an action with no `href`
// renders the `href="#" ... aria-disabled="true"` placeholder instead of a
// separately stored boolean. Every `href="#"` instance across all 8 source
// pages already correlates 1:1 with this exact disabled rendering, with no
// counterexample, confirming absence-of-href is the real content fact, not
// the literal string "#". Backwards-compatible: every pre-existing action
// across the other 7 pages supplies `href`, so this is unreachable for them.

import { esc, attrEsc, cls, each } from '../lib/html.js';

export function renderCtaSection(props, ctx) {
  const actions = props.actions || [];

  const renderAction = (a) => a.href
    ? `<a href="${attrEsc(a.href)}" class="btn btn--${attrEsc(a.style)} btn--lg">${esc(a.label)}</a>`
    : `<a href="#" class="btn btn--${attrEsc(a.style)} btn--lg" aria-disabled="true">${esc(a.label)}</a>`;

  const actionsBlock = actions.length === 0
    ? ''
    : actions.length === 1
      ? renderAction(actions[0])
      : `<div class="btn-group">
      ${each(actions, renderAction)}
    </div>`;

  const sectionClass = cls('cta-section', props.threeD && 'cta-3d');

  return `<section class="${sectionClass}">
  <div class="container" data-scroll-3d="fly-in">
    <h2>${esc(props.title)}</h2>
    <p>${esc(props.text)}</p>
    ${actionsBlock}
  </div>
</section>`;
}
