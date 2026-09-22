// HTML string primitives. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

const TEXT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => TEXT[c]);
}

// Escapes a value for use inside a DOUBLE-QUOTED HTML attribute. This function
// is safe ONLY when the value is placed inside double quotes (e.g. attr="value").
// It does NOT defend against injection if the attribute is unquoted or single-quoted.
// Template authors should prefer the attr() function instead, which guarantees the
// quoting and prevents hand-built attribute mistakes.
export function attrEsc(value) {
  return esc(value);
}

export function attr(name, value) {
  if (value === null || value === undefined || value === '') return '';
  return ` ${name}="${attrEsc(value)}"`;
}

// WARNING: raw() performs NO escaping. The argument is emitted into the page
// verbatim exactly as provided. Use raw() ONLY for markup already known to be safe:
// literal HTML entities carried over from the original source markup (&copy;, &#9737;,
// &bull;), and in later phases, rich-text that has already been sanitised server-side
// against a tag whitelist. Never pass unsanitised user input or CMS-authored content
// to raw() — doing so creates an injection vulnerability.
export function raw(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function cls(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function each(list, fn) {
  if (!list) return '';
  return list.map(fn).join('');
}
