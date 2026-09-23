// Section: about-preview. Source of truth: src/about.html — outer wrapper is
// always <section class="section"> in every about-preview instance in the
// source (never a --gray/--dark variant), but Ruling 15 adds the optional
// `background` prop for consistency with the other .section-wrapped types
// (card-grid, specs-grid) and future pages, containing the .about-preview
// grid of a content block then an image block. src/index.html
// reorders content/image via `reversed` (image first — same two divs, swapped
// DOM order; the 2-column CSS grid has no template-areas, so DOM order alone
// controls the visual order). `accent` and `actions` have no about.html
// precedent (the accent div is always present there, and no about-preview in
// the source carries a button) — implemented conservatively per the frozen
// prop shape; see task-7-report.md. No Node built-ins: this module is
// imported by the Cloudflare Workers runtime.

import { esc, attrEsc, raw, cls, each } from '../lib/html.js';

// RICH TEXT FIELD: `body[]` is deliberately rendered with raw(), not esc().
// WHY: the source paragraphs carry inline markup — e.g. src/about.html has
// <p>...<strong>Centrale Nantes Formula Student</strong> is a...</p> and
// src/project.html has <p>Our target: enter <strong>concept class</strong>
// at...</p>. esc() would turn those tags into visible "&lt;strong&gt;" text
// and break byte parity with the source.
// RISK: this makes `body` an injection point the moment it becomes
// CMS-editable — raw() performs no sanitisation at all. A later phase MUST
// sanitise `body` ON WRITE, server-side, against the whitelist
// b, i, em, strong, br, a[href] (project spec section 8) before accepting
// any external input; render-time escaping is not a substitute for that.
// No other prose field in this module may be switched to raw() on this
// precedent — eyebrow, title and action labels below all stay on esc()/
// attrEsc() because they carry no inline markup in the source.
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

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}">
  <div class="container">
    <div class="${cls('about-preview', props.reversed && 'about-preview--reversed')}">
      ${blocks}
    </div>
  </div>
</section>`;
}
