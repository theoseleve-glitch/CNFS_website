// Section: org-chart. Source of truth: src/about.html "Meet the Team"
// section (id="team"): a labeled text-center header, a .org-chart.org-3d of
// .org-chart__level rows each containing 1-3 .team-member cards
// (avatar-initials + name + role), and a trailing faculty-advisor line.
// Every team-member in the source carries `team-member--lead` (hardcoded
// below — no instance omits it), and exactly one (the president) additionally
// carries `team-member--president`, so that is the only per-member variant
// modelled (`president?: boolean`).
//
// The brief also named a separate `team-grid` type for a flat member grid,
// but src/about.html has no such markup distinct from this org chart (no
// section in the source renders team members outside org-chart__level rows),
// so it was not built — inventing an unused type would be speculative. See
// task-9-report.md.
//
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, cls, attr, each } from '../lib/html.js';

function renderMember(m) {
  return `<div class="${cls('team-member', 'team-member--lead', m.president && 'team-member--president')}">
          <div class="team-member__avatar">${esc(m.avatar)}</div>
          <h3 class="team-member__name">${esc(m.name)}</h3>
          <div class="team-member__role">${esc(m.role)}</div>
        </div>`;
}

export function renderOrgChart(props, ctx) {
  const levels = props.levels || [];
  const advisor = props.advisor;

  const header = (props.eyebrow || props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.eyebrow ? `<span class="section-label">${esc(props.eyebrow)}</span>` : ''}
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="lead lead--centered">${esc(props.intro)}</p>` : ''}
    </div>`
    : '';

  const advisorBlock = advisor
    ? `<div class="mt-3 text-center">
      <p class="lead" style="color:var(--text-secondary);">Faculty Advisor: <strong>${esc(advisor.name)}</strong></p>
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
    <div class="org-chart org-3d">
      ${each(levels, (level) => `<div class="org-chart__level">
        ${each(level, renderMember)}
      </div>`)}
    </div>
    ${advisorBlock}
  </div>
</section>`;
}
