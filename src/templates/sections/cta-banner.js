// Section: cta-banner. Source of truth: src/index.html closing CTA section.
// NOT the same shape as the shared cta-section.js (Task 7): this instance's
// container has no data-scroll-3d, its heading/paragraph carry the page's
// own inline styles, and — unlike cta-section.js's plain .btn-group — every
// action is individually wrapped in <span class="magnetic"> as well as being
// grouped. All of that is page-specific chrome, hardcoded here rather than
// added as new optional props on the already-reviewed shared template.
// `heading` accepts a string or an array of lines joined with a literal
// <br>, same convention as s-intro.js, to reproduce "Support the
// Next<br>Generation of Engineers" without raw(). No Node built-ins:
// imported by the Cloudflare Workers runtime.

import { esc, attrEsc, each } from '../lib/html.js';

export function renderCtaBanner(props) {
  const headingHtml = Array.isArray(props.heading)
    ? props.heading.map(esc).join('<br>')
    : esc(props.heading);
  const actions = props.actions || [];

  return `<section class="cta-section">
      <div class="container text-center">
        <h2 class="s-intro__title" style="margin-bottom:var(--space-lg);">${headingHtml}</h2>
        <p style="color:var(--text-secondary);font-size:1.125rem;max-width:540px;margin:0 auto var(--space-2xl);">${esc(props.text)}</p>
        <div class="btn-group">
          ${each(actions, (a) => `<span class="magnetic"><a href="${attrEsc(a.href)}" class="btn btn--${attrEsc(a.style)} btn--lg">${esc(a.label)}</a></span>`)}
        </div>
      </div>
    </section>`;
}
