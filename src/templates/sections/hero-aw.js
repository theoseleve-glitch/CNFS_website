// Section: hero-aw. Source of truth: src/index.html full-viewport split-text
// hero. Structural per plan §Task 8: the per-line <span class="line">
// <span class="line-inner"> nesting is fixed; only the line text (and
// whether a line is emphasised, e.g. "Formula Student" in <em>) is
// data-driven, via a boolean flag rather than raw() — this keeps the field
// injection-free while still reproducing the source's inline emphasis.
// Every action here is individually wrapped in <span class="magnetic"> in
// the source (a JS hover-magnet hook), which is hardcoded per action since
// it never varies. No Node built-ins: imported by the Cloudflare Workers
// runtime.

import { esc, attrEsc, each } from '../lib/html.js';

function renderTitleLine(line) {
  const text = esc(line.text);
  const inner = line.emphasis ? `<em>${text}</em>` : text;
  return `<span class="line"><span class="line-inner">${inner}</span></span>`;
}

function renderAction(a) {
  return `<span class="magnetic"><a href="${attrEsc(a.href)}" class="btn btn--${attrEsc(a.style)} btn--lg">${esc(a.label)}</a></span>`;
}

export function renderHeroAw(props) {
  return `<section class="hero-aw">
      <div class="hero-aw__bg">
        <img src="${attrEsc(props.image)}" alt="${attrEsc(props.imageAlt)}" aria-hidden="true" fetchpriority="high" decoding="async">
      </div>
      <div class="hero-aw__content">
        <div class="hero-aw__eyebrow">${esc(props.eyebrow)}</div>
        <h1 class="hero-aw__title">
          ${each(props.titleLines, renderTitleLine)}
        </h1>
        <div class="hero-aw__bottom">
          <p class="hero-aw__desc">${esc(props.desc)}</p>
          <div class="hero-aw__actions">
            ${each(props.actions, renderAction)}
          </div>
        </div>
      </div>
      <div class="hero-aw__scroll" aria-hidden="true">
        <span>${esc(props.scrollLabel)}</span>
        <div class="hero-aw__scroll-line"></div>
      </div>
    </section>`;
}
