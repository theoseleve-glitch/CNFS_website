// Section: car-pinned. Source of truth: src/index.html "SIGNATURE MOMENT"
// pinned-scroll spec reveal, driven by GSAP ScrollTrigger. Per plan §Task 8
// this is structural: the wrapper DOM (.car-pinned__inner, one
// .car-pinned__spec per entry, the .car-pinned__progress dot row) is fixed;
// only the spec values/labels and which dot starts active are data-driven.
// A value like "<210" is passed through esc() exactly like any text-context
// value, which reproduces the source's "&lt;210" without a raw() call — the
// source escaped it for the same reason. No Node built-ins: imported by the
// Cloudflare Workers runtime.

import { esc, attrEsc, each } from '../lib/html.js';

function renderSpec(s) {
  return `<div class="car-pinned__spec">
          <div class="car-pinned__value">${esc(s.value)}<em>${esc(s.unit)}</em></div>
          <div class="car-pinned__name">${esc(s.label)}</div>
        </div>`;
}

export function renderCarPinned(props) {
  const specs = props.specs || [];
  const activeIndex = props.activeIndex || 0;
  const cta = props.cta;

  return `<section class="car-pinned">
      <div class="car-pinned__inner">
        ${each(specs, renderSpec)}
        <div class="car-pinned__progress">
          ${each(specs, (s, i) => `<div class="car-pinned__dot${i === activeIndex ? ' active' : ''}"></div>`)}
        </div>
      </div>
      ${cta ? `<div class="text-center" style="padding:var(--space-xl) 0;">
        <span class="magnetic"><a href="${attrEsc(cta.href)}" class="btn btn--${attrEsc(cta.style)}">${esc(cta.label)}</a></span>
      </div>` : ''}
    </section>`;
}
