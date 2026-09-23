// HTML string primitives. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

// esc() is the TEXT-CONTENT escaper: for a value placed between tags (e.g.
// <p>${esc(value)}</p>). Only '&', '<' and '>' are special there — they could
// start an entity or open/close a tag. Quotes have no special meaning in text
// content, so escaping them is gratuitous: it breaks byte parity with source
// markup that contains literal ' or " in prose without adding any safety.
const TEXT = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>]/g, (c) => TEXT[c]);
}

// attrEsc() is the DOUBLE-QUOTED-ATTRIBUTE escaper: for a value placed inside
// double quotes (e.g. attr="${attrEsc(value)}"). Here '"' is also special,
// because an unescaped one would close the attribute early — but "'" is not,
// since a single quote inside a double-quoted attribute is just a character.
// This function is safe ONLY when the attribute is double-quoted; nothing may
// ever hand-build a single-quoted attribute with it. Template authors should
// prefer attr(), which guarantees double-quoting and prevents that mistake.
const ATTR = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function attrEsc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"]/g, (c) => ATTR[c]);
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
