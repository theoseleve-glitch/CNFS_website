// Section: about-parallax. Source of truth: src/index.html "ABOUT" section.
// NOT the same shape as the shared about-preview.js (Task 7): this instance
// nests an s-intro label+heading inside the content column instead of a bare
// section-label/section-title pair, uses a parallax img-reveal image wrapper
// instead of a plain image + optional accent div, and wraps its single
// action in <span class="magnetic"> — different enough on every axis that
// reusing about-preview.js would mean bolting page-specific structure onto
// an already-reviewed shared template, so this is its own module instead.
// It reuses the s-intro helper for the header sub-block.
//
// RICH TEXT FIELD: `body[]`, like about-preview.js's body, is rendered with
// raw() because the source's first paragraph carries inline markup
// (<strong>Centrale Nantes Formula Student</strong>). Same Phase 3
// blocking requirement applies: sanitise on write against the spec §8
// whitelist before this becomes CMS-editable. No Node built-ins: imported by
// the Cloudflare Workers runtime.

import { esc, attrEsc, raw, attr, each } from '../lib/html.js';
import { renderSIntro } from './s-intro.js';

export function renderAboutParallax(props) {
  const sIntro = props.sIntro || {};
  const body = props.body || [];
  const action = props.action;

  return `<section class="section"${attr('id', props.id)}>
      <div class="container">
        <div class="about-preview">
          <div class="about-preview__image img-reveal" data-parallax="${attrEsc(props.parallax)}">
            <div class="img-reveal__overlay"></div>
            <img src="${attrEsc(props.image)}" alt="${attrEsc(props.imageAlt)}" loading="lazy" style="opacity:0;">
          </div>
          <div class="about-preview__content" data-scroll-3d="rotate-right">
            ${renderSIntro(sIntro)}
            ${each(body, (p) => `<p>${raw(p)}</p>`)}
            ${action ? `<span class="magnetic"><a href="${attrEsc(action.href)}" class="btn btn--${attrEsc(action.style)} mt-2">${esc(action.label)}</a></span>` : ''}
          </div>
        </div>
      </div>
    </section>`;
}
