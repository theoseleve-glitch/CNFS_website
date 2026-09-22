// HTML string primitives. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

const TEXT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => TEXT[c]);
}

export function attrEsc(value) {
  return esc(value);
}

export function attr(name, value) {
  if (value === null || value === undefined || value === '') return '';
  return ` ${name}="${attrEsc(value)}"`;
}

// For content that is already valid HTML — entity literals carried over from
// the original markup, and rich-text fields sanitised server-side in Phase 3.
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
