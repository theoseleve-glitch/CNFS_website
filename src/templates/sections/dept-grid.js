// Section: dept-grid. Source of truth: src/about.html "Our Structure"
// section (.dept-grid.grid-decon of .dept-card items, wrapped in a labeled
// text-center header). Each dept-card in the source is a plain
// title/text pair (h3.dept-card__title + p.dept-card__text) — there is no
// icon element on any instance, so `depts[].icon` is intentionally not part
// of the shape (adding an unused, always-empty field would be exactly the
// kind of opaque/speculative content field the project brief warns against).
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, cls, attr, each } from '../lib/html.js';

export function renderDeptGrid(props, ctx) {
  const depts = props.depts || [];

  const header = (props.eyebrow || props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.eyebrow ? `<span class="section-label">${esc(props.eyebrow)}</span>` : ''}
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead lead--centered">${esc(props.intro)}</p>` : ''}
    </div>`
    : '';

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  return `<section class="${sectionClass}"${attr('id', props.id)}>
  <div class="container">
    ${header}
    <div class="dept-grid grid-decon">
      ${each(depts, (d) => `<div class="dept-card">
        <h3 class="dept-card__title">${esc(d.name)}</h3>
        <p class="dept-card__text">${esc(d.text)}</p>
      </div>`)}
    </div>
  </div>
</section>`;
}
