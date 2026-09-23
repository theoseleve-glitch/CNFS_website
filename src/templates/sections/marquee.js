// Section: marquee. Source of truth: src/index.html scrolling strip. Per
// plan §Task 8, structural: the source repeats the item list twice back to
// back (for a seamless CSS scroll loop) and appends a literal "&bull;"
// separator inside <em> after every item — both hardcoded here, never
// data-driven, since they are presentation of the loop mechanism, not
// content. No Node built-ins: imported by the Cloudflare Workers runtime.

import { esc, each } from '../lib/html.js';

export function renderMarquee(props) {
  const items = props.items || [];
  const loop = items.concat(items);
  return `<div class="marquee" aria-hidden="true">
      <div class="marquee__track">
        ${each(loop, (text) => `<span class="marquee__item">${esc(text)} <em>&bull;</em></span>`)}
      </div>
    </div>`;
}
