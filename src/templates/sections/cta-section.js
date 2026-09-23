// Section: cta-section. Source of truth: src/about.html (single action, no
// wrapper) and src/project.html (two actions, wrapped in .btn-group — the
// wrapper appears only when there is more than one action). Ruling 15: the
// source pages split 7x <section class="cta-section cta-3d"> to 1x plain
// <section class="cta-section">, so the 3d modifier is data-driven via the
// optional `threeD` boolean prop rather than always-on. No Node built-ins:
// this module is imported by the Cloudflare Workers runtime.

import { esc, attrEsc, cls, each } from '../lib/html.js';

export function renderCtaSection(props, ctx) {
  const actions = props.actions || [];

  const renderAction = (a) => `<a href="${attrEsc(a.href)}" class="btn btn--${attrEsc(a.style)} btn--lg">${esc(a.label)}</a>`;

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
