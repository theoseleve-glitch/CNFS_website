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
// prop shape; see task-7-report.md.
//
// Task 12 (partners.html) adds one more optional prop: `list` — the "Why
// Partner With Us" instance has a `<ul class="about-preview__list">` of
// checkmark benefits between the lead paragraph and the image column, which
// no prior about-preview instance has. `list.icon` is a single value shared
// by every `<li>` (the source repeats the same "&#10003;" glyph five times;
// storing it once avoids Ruling 4's redundant state — a future instance
// wanting per-item icons is a genuine markup difference, not this shape).
// `list.icon` is rendered with esc(), NOT raw(): "&#10003;" is a complete,
// valid character reference and nothing else, so RULING 24's entity-aware
// esc() reproduces it unchanged — raw() would buy nothing here and would
// needlessly open an injection point on a field that is, and only ever
// needs to be, an entity (fix-round-1 correction: this shipped as raw() in
// the first pass and was caught in review). `list.items` is a genuinely
// different case — see the RICH TEXT FIELD comment on renderList() below.
// Omitted entirely when absent, so every pre-existing caller renders
// byte-identically to before. No Node built-ins: this module is imported by
// the Cloudflare Workers runtime.

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

// RICH TEXT FIELD: `list.items[]` is deliberately rendered with raw(), not
// esc(). WHY: the source's benefit list carries inline markup — e.g.
// src/partners.html has "<strong>Brand visibility</strong> on the car, team
// uniforms, website, and social media". esc() would turn that tag into
// visible "&lt;strong&gt;" text and break byte parity with the source.
// RISK: this makes `list.items` an injection point the moment it becomes
// CMS-editable — raw() performs no sanitisation at all. A later phase MUST
// sanitise `list.items` ON WRITE, server-side, against the whitelist
// b, i, em, strong, br, a[href] (project spec section 8) before accepting
// any external input; render-time escaping is not a substitute for that.
// `list.icon`, by contrast, stays on esc() (see the top-of-file note) —
// it is an entity, not rich text, and the two must not be conflated.
function renderList(list) {
  if (!list || !list.items || list.items.length === 0) return '';
  return `<ul class="about-preview__list">
      ${each(list.items, (item) => `<li class="about-preview__list-item">
        <span class="about-preview__list-icon">${esc(list.icon)}</span>
        <span>${raw(item)}</span>
      </li>`)}
    </ul>`;
}

function renderContent(props) {
  return `<div class="about-preview__content" data-scroll-3d="rotate-left">
      ${props.eyebrow ? `<span class="section-label">${esc(props.eyebrow)}</span>` : ''}
      <h2 class="section-title">${esc(props.title)}</h2>
      ${renderBody(props.body)}
      ${renderList(props.list)}
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
