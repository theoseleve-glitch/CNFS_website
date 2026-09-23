// Section: table-scroll. Source of truth: src/project.html "Cost Breakdown"
// section — a horizontally-scrollable data table (.table-scroll wrapping
// .cost-table) preceded by the same label/title/intro header pattern used
// above specs-grid and card-grid, except the intro paragraph carries the
// DARK contrast modifier (`lead--centered-dark`, not `lead--centered`) —
// this is the only source instance of that header on a dark section, so the
// intro class is derived from `background === 'dark'` rather than hardcoded,
// mirroring the header's own light/dark choice instead of adding a
// page-specific flag.
//
// Two structural conventions are hardcoded rather than exposed as props,
// since the single source instance gives no evidence they should vary: the
// FIRST column of every row is wrapped in <strong> (it is a row label, not
// rich text), and the LAST column of the header row, every data row, and
// the optional total row carries `text-right` (every table-scroll instance
// in the source is a label/detail/figure table with the figure right-
// aligned). A future table-scroll needing different alignment would revisit
// this.
//
// Row cells are plain esc(): two of the "Cost Breakdown" cells are properly
// escaped in source ("4 calipers &amp; discs...", "Wheels &amp; Tyres"),
// and RULING 24's entity-aware esc() reproduces both unchanged (they're
// already complete, valid named references) — no raw() exemption needed.
// No Node built-ins: this module is imported by the Cloudflare Workers
// runtime.

import { esc, cls, each } from '../lib/html.js';

function renderRow(cells, lastCol) {
  return `<tr>
        ${each(cells, (cell, i) => i === 0
          ? `<td><strong>${esc(cell)}</strong></td>`
          : `<td${i === lastCol ? ' class="text-right"' : ''}>${esc(cell)}</td>`)}
      </tr>`;
}

export function renderTableScroll(props, ctx) {
  const columns = props.columns || [];
  const rows = props.rows || [];
  const lastCol = columns.length - 1;

  const header = (props.label || props.title || props.intro)
    ? `<div class="text-center" data-scroll-3d="fly-in">
      ${props.label ? `<span class="section-label">${esc(props.label)}</span>` : ''}
      ${props.title ? `<h2 class="section-title section-title--center">${esc(props.title)}</h2>` : ''}
      ${props.intro ? `<p class="${cls('lead', props.background === 'dark' ? 'lead--centered-dark' : 'lead--centered')}">${esc(props.intro)}</p>` : ''}
    </div>`
    : '';

  const sectionClass = cls(
    'section',
    props.background === 'gray' && 'section--gray',
    props.background === 'dark' && 'section--dark'
  );

  const total = props.total
    ? `<tfoot>
          <tr class="cost-table__total">
            <td colspan="${lastCol}"><strong>${esc(props.total.label)}</strong></td>
            <td class="text-right"><strong>${esc(props.total.value)}</strong></td>
          </tr>
        </tfoot>`
    : '';

  return `<section class="${sectionClass}">
  <div class="container">
    ${header}
    <div class="table-scroll">
      <table class="cost-table" data-scroll-3d="tilt-up">
        <thead>
          <tr>
            ${each(columns, (c, i) => `<th${i === lastCol ? ' class="text-right"' : ''}>${esc(c)}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${each(rows, (r) => renderRow(r, lastCol))}
        </tbody>
        ${total}
      </table>
    </div>
  </div>
</section>`;
}
