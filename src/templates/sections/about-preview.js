// Section: about-preview. Source of truth: src/about.html — outer wrapper is
// always <section class="section"> (never a --gray/--dark variant, checked
// across every about-preview instance in the source), containing the
// .about-preview grid of a content block then an image block. src/index.html
// reorders content/image via `reversed` (image first — same two divs, swapped
// DOM order; the 2-column CSS grid has no template-areas, so DOM order alone
// controls the visual order). `accent` and `actions` have no about.html
// precedent (the accent div is always present there, and no about-preview in
// the source carries a button) — implemented conservatively per the frozen
// prop shape; see task-7-report.md. No Node built-ins: this module is
// imported by the Cloudflare Workers runtime.

import { esc, attrEsc, raw, cls, each } from '../lib/html.js';

function renderBody(body) {
  return each(body || [], (p, i) => (i === 0 ? `<p class="lead">${raw(p)}</p>` : `<p>${raw(p)}</p>`));
}

function renderActions(actions) {
  if (!actions || actions.length === 0) return '';
  return each(actions, (a) => `<a href="${attrEsc(a.href)}" class="btn btn--${attrEsc(a.style)}">${esc(a.label)}</a>`);
}

function renderContent(props) {
  return `<div class="about-preview__content" data-scroll-3d="rotate-left">
      ${props.eyebrow ? `<span class="section-label">${esc(props.eyebrow)}</span>` : ''}
      <h2 class="section-title">${esc(props.title)}</h2>
      ${renderBody(props.body)}
      ${renderActions(props.actions)}
    </div>`;
}

function renderImage(props) {
  if (!props.image) return '';
  return `<div class="about-preview__image" data-scroll-3d="rotate-right">
      <img src="${attrEsc(props.image)}" alt="${attrEsc(props.imageAlt)}" loading="lazy">
      ${props.accent ? `<div class="about-preview__image-accent"></div>` : ''}
    </div>`;
}

export function renderAboutPreview(props, ctx) {
  const content = renderContent(props);
  const image = renderImage(props);
  const blocks = props.reversed ? image + content : content + image;

  return `<section class="section">
  <div class="container">
    <div class="${cls('about-preview', props.reversed && 'about-preview--reversed')}">
      ${blocks}
    </div>
  </div>
</section>`;
}
