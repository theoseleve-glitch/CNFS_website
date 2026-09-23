// Section: page-header. Source of truth: src/about.html (identical structure
// reused verbatim on src/project.html and every other inner page). No Node
// built-ins: this module is imported by the Cloudflare Workers runtime.

import { esc, attrEsc, each } from '../lib/html.js';

// ctx is unused in Phase 1 (declared for signature parity — Phase 4 reads
// ctx.mode to emit data-edit-id attributes).
export function renderPageHeader(props, ctx) {
  const crumbs = props.breadcrumb || [];
  return `<section class="page-header">
  <div class="container">
    <nav class="page-header__breadcrumb" aria-label="Breadcrumb">
      ${each(crumbs, (c, i) => {
        const sep = i > 0 ? '<span class="page-header__breadcrumb-sep">/</span>' : '';
        const item = c.href
          ? `<a href="${attrEsc(c.href)}">${esc(c.label)}</a>`
          : `<span>${esc(c.label)}</span>`;
        return sep + item;
      })}
    </nav>
    <h1 class="page-header__title">${esc(props.title)}</h1>
  </div>
</section>`;
}
