// Section: stats-aw. Source of truth: src/index.html large-number stats
// strip. The visible digits are always the JS counter's resting state "0"
// (GSAP animates to data-count on scroll) with an optional <em>prefix</em>
// prepended — both reproduced exactly, data-prefix/data-suffix are emitted
// only when present via attr(). No Node built-ins: imported by the
// Cloudflare Workers runtime.

import { esc, attr, each } from '../lib/html.js';

function renderItem(it) {
  const content = it.prefix ? `<em>${esc(it.prefix)}</em>0` : '0';
  return `<div class="stats-aw__item">
        <div class="stats-aw__number"${attr('data-count', it.count)}${attr('data-prefix', it.prefix)}${attr('data-suffix', it.suffix)}>${content}</div>
        <div class="stats-aw__label">${esc(it.label)}</div>
      </div>`;
}

export function renderStatsAw(props) {
  const items = props.items || [];
  return `<section class="stats-aw" aria-label="Key statistics">
      <div class="container container--wide">
        <div class="stats-aw__grid">
          ${each(items, renderItem)}
        </div>
      </div>
    </section>`;
}
