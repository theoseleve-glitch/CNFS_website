// Section: contact-grid. Source of truth: src/contact.html — a two-column
// grid pairing a Formsubmit.co-backed contact form with static contact
// info, social links, and a map placeholder. No Node built-ins: this module
// is imported by the Cloudflare Workers runtime.
//
// BROKEN WRAPPER (task-14 brief, Ruling 10): src/contact.html opens BOTH
// columns with the same malformed `<div " data-scroll-3d="...">` tag
// already reproduced by card-grid.js's `_brokenHeader` (a stray `"` right
// after `<div`, no class attribute) — just with two different
// data-scroll-3d values, one per column ("rotate-left" / "rotate-right").
// This reuses that exact mechanism rather than inventing a new one:
// `_formScroll3d` / `_infoScroll3d` are underscore-prefixed internal props
// (see the internal-prop convention atop ./index.js) carrying the attribute
// value directly, still attrEsc()-escaped like any other attribute
// (Ruling 28) — Phase 4's editor-field generator must skip both.
//
// FORM WIRING (the critical risk on this page): `form._action`,
// `form._method`, `form._hidden` (the three Formsubmit.co hidden inputs —
// _subject, _next, _captcha) and `form._honeypot` (the anti-spam `_honey`
// text input, styled display:none/tabindex=-1) are ALL underscore-prefixed
// and MUST stay out of any future CMS editor surface (commit 41099ce: this
// is the site's only working inbound channel). A non-developer editing the
// endpoint, renaming the honeypot field, or dropping a hidden input would
// silently break delivery with no visible symptom on the rendered page.
// Only the visible field labels/placeholders/options and `submitLabel` are
// ordinary, editor-safe content.
//
// `form.rows` is an array of arrays of field objects — a row of length 2
// renders wrapped in `.form-row` (First/Last Name; Email/Company), a row of
// length 1 renders its single `.form-group` unwrapped (Subject; Message),
// matching the source exactly. Each field's `required` (drives the HTML
// `required` attribute) is independent of the literal " *" suffix baked
// into its `label` text in the source markup itself — the source never
// links the two programmatically either, so storing both is not redundant
// state (Ruling 4), just a faithful transcription of two independent facts.
//
// Every icon/glyph value here (&#9993;, &#9742;, &#9962;, &#128247;, "in",
// "f", &#9654;) is either plain text or a complete, valid HTML character
// reference, so esc() reproduces it unchanged (RULING 24) — no raw()
// exemption needed, same reasoning already used by cards-section.js,
// sponsor-grid.js, and table-scroll.js.
//
// `info.items[].value` accepts a string or an array of lines joined with a
// literal <br> for the Address item, the same convention as s-intro.js /
// cta-banner.js (a structural separator, never derived from the value).
//
// The contact-info social row's markup differs from globals/footer.js's
// social links — it additionally carries a `title` attribute mirroring
// `aria-label` — so it is a genuine markup fork (rendered locally, not
// reused from footer.js), not a duplicate way to say the same thing.
//
// `info.map` renders through map-placeholder.js, called directly as a
// function rather than through the section registry — the same
// "registered but normally invoked as a helper" pattern already used for
// s-intro.js.

import { esc, attrEsc, each } from '../lib/html.js';
import { renderMapPlaceholder } from './map-placeholder.js';

function renderField(f) {
  const id = attrEsc(f.id);
  const name = attrEsc(f.name);
  const required = f.required ? ' required' : '';
  const placeholder = f.placeholder ? ` placeholder="${attrEsc(f.placeholder)}"` : '';
  const autocomplete = f.autocomplete ? ` autocomplete="${attrEsc(f.autocomplete)}"` : '';

  if (f.type === 'select') {
    const placeholderOpt = f.placeholderOption
      ? `<option value="${attrEsc(f.placeholderOption.value)}" disabled selected>${esc(f.placeholderOption.label)}</option>`
      : '';
    return `<div class="form-group">
        <label for="${id}">${esc(f.label)}</label>
        <select id="${id}" name="${name}"${required}>
          ${placeholderOpt}
          ${each(f.options, (o) => `<option value="${attrEsc(o.value)}">${esc(o.label)}</option>`)}
        </select>
      </div>`;
  }

  if (f.type === 'textarea') {
    return `<div class="form-group">
        <label for="${id}">${esc(f.label)}</label>
        <textarea id="${id}" name="${name}"${required}${placeholder}></textarea>
      </div>`;
  }

  return `<div class="form-group">
      <label for="${id}">${esc(f.label)}</label>
      <input type="${attrEsc(f.type)}" id="${id}" name="${name}"${required}${placeholder}${autocomplete}>
    </div>`;
}

function renderRow(row) {
  const inner = each(row, renderField);
  return row.length > 1 ? `<div class="form-row">${inner}</div>` : inner;
}

function renderForm(form) {
  const hidden = each(form._hidden, (h) => `<input type="hidden" name="${attrEsc(h.name)}" value="${attrEsc(h.value)}">`);
  const honeypot = form._honeypot
    ? `<input type="text" name="${attrEsc(form._honeypot.name)}" style="display:none" tabindex="-1">`
    : '';

  return `<form class="contact-form" action="${attrEsc(form._action)}" method="${attrEsc(form._method)}">
        ${hidden}
        ${honeypot}
        ${each(form.rows, renderRow)}
        <button type="submit" class="btn btn--primary">${esc(form.submitLabel)}</button>
      </form>`;
}

function renderInfoItem(item) {
  const value = Array.isArray(item.value) ? item.value.map(esc).join('<br>') : esc(item.value);
  return `<div class="contact-info__item">
        <div class="contact-info__icon">${esc(item.icon)}</div>
        <div>
          <div class="contact-info__label">${esc(item.label)}</div>
          <p class="contact-info__value">${value}</p>
        </div>
      </div>`;
}

function renderSocialLink(s) {
  return s.href
    ? `<a href="${attrEsc(s.href)}" target="_blank" rel="noopener" class="social-link" aria-label="${attrEsc(s.platform)}" title="${attrEsc(s.platform)}">${esc(s.glyph)}</a>`
    : `<a href="#" role="link" aria-disabled="true" class="social-link" aria-label="${attrEsc(s.platform)}" title="${attrEsc(s.platform)}">${esc(s.glyph)}</a>`;
}

export function renderContactGrid(props, ctx) {
  const form = props.form || {};
  const info = props.info || {};

  return `<section class="section">
  <div class="container">
    <div class="contact-grid">

      <div " data-scroll-3d="${attrEsc(props._formScroll3d)}">
        <span class="section-label">${esc(form.label)}</span>
        <h2 class="section-title">${esc(form.title)}</h2>
        <p>${esc(form.intro)}</p>

        ${renderForm(form)}
      </div>

      <div " data-scroll-3d="${attrEsc(props._infoScroll3d)}">
        <span class="section-label">${esc(info.label)}</span>
        <h2 class="section-title">${esc(info.title)}</h2>

        <div class="contact-info">
          ${each(info.items, renderInfoItem)}
        </div>

        <div class="mt-3">
          <h4 class="mb-1">${esc(info.socialHeading)}</h4>
          <div class="social-links">
            ${each(info.social, renderSocialLink)}
          </div>
        </div>

        ${renderMapPlaceholder(info.map || {})}
      </div>

    </div>
  </div>
</section>`;
}
