// Section: error-404. Source of truth: src/404.html's <main> content block
// — the only page-body content the 404 page has. It is a large "404"
// numeral, a heading, supporting text, and two actions grouped in a
// .btn-group. This markup is unique to this one page and never reused, so
// — same convention as cta-banner.js — the layout chrome (numeral, wrapper
// structure, one-off inline style attributes) is hardcoded here and only
// the actual copy (title, text, actions) is exposed as props. Unlike
// cta-section.js's actions, these buttons carry no `btn--lg` modifier and
// are always wrapped in .btn-group (the source never renders a single
// unwrapped action here), so this does not reuse that helper. No Node
// built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, attrEsc, each } from '../lib/html.js';

export function renderError404(props) {
  return `<div>
      <div style="font-family:var(--font-heading);font-size:clamp(6rem,15vw,10rem);font-weight:800;color:var(--color-secondary);line-height:1;margin-bottom:var(--space-md);">404</div>
      <h1 style="font-size:clamp(1.5rem,3vw,2.5rem);margin-bottom:var(--space-md);">${esc(props.title)}</h1>
      <p style="color:var(--color-dark-gray);font-size:1.125rem;max-width:480px;margin:0 auto var(--space-xl);">${esc(props.text)}</p>
      <div class="btn-group">
        ${each(props.actions, (a) => `<a href="${attrEsc(a.href)}" class="btn btn--${attrEsc(a.style)}">${esc(a.label)}</a>`)}
      </div>
    </div>`;
}
