// HTML string primitives. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

// RULING 23: both escapers below escape only what their context can actually
// make dangerous, not every historically-special character. The excess in
// the old blanket [&<>"] escape was breaking byte parity against the
// immutable source pages, which are inconsistent about escaping '&' (some
// instances properly write '&amp;', others leave a bare '&' that HTML5
// tolerates as literal). A bare '&' is only unsafe when it could start a
// character reference — i.e. when followed by a letter or '#' — so that is
// the only condition under which either escaper still touches it. Neither
// escaper decodes or double-processes existing entities; each '&' in the
// input is judged independently by the character immediately following it.
// Matches a bare '&' only when it is positioned to start a character
// reference (immediately followed by a letter or '#', as in '&amp;',
// '&lt;', '&#39;', '&copy;'). The lookahead is zero-width, so it never
// consumes — and therefore never touches — the character after '&'.
const AMP_STARTING_REF = /&(?=[A-Za-z#])/g;

// esc() is the TEXT-CONTENT escaper: for a value placed between tags (e.g.
// <p>${esc(value)}</p>). '<' and '>' are ALWAYS escaped — either one left
// literal could open or close a tag, which is exactly how markup injection
// in text content happens, so there is no conditional case for them. '&' is
// escaped ONLY when it could start a character reference (followed by
// [A-Za-z#]); a bare '&' before a space, digit, or end-of-string is valid
// HTML that renders as a literal '&', so escaping it there is gratuitous and
// breaks parity with source text that leaves it bare. Quotes have no special
// meaning in text content, so escaping them is gratuitous too: it breaks
// byte parity with source markup that contains literal ' or " in prose
// without adding any safety.
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(AMP_STARTING_REF, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// attrEsc() is the DOUBLE-QUOTED-ATTRIBUTE escaper: for a value placed
// inside double quotes (e.g. attr="${attrEsc(value)}"). '"' is ALWAYS
// escaped — it is the only character that can end a double-quoted attribute
// early, so this is the one non-negotiable case. '&' follows the same
// character-reference rule as esc(). '<' and '>' are NOT escaped here: they
// have no special meaning inside a double-quoted attribute value (the HTML
// parser keeps consuming attribute text, angle brackets and all, until the
// matching closing '"' — it does not open or close tags mid-attribute), so
// escaping them was pure excess that broke parity with source attributes
// containing a literal '<' or '>'. "'" is not escaped either, since a single
// quote inside a double-quoted attribute is just a character. This function
// is safe ONLY when the attribute is double-quoted — the exemption for '<'
// and '>' depends on it, and nothing may ever hand-build a single-quoted or
// unquoted attribute with it. Template authors should prefer attr(), which
// guarantees double-quoting and prevents that mistake.
export function attrEsc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(AMP_STARTING_REF, '&amp;')
    .replace(/"/g, '&quot;');
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
