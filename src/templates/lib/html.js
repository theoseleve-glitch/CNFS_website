// HTML string primitives. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

// RULING 24: both escapers below are ENTITY-AWARE. RULING 23's rule —
// escape '&' whenever the very next character is a letter or '#' — could not
// tell a source's PROPERLY escaped `&amp;` apart from a bare '&' that merely
// happens to be followed by a letter (`AT&T`): both look identical to a rule
// that inspects only the one next character, which is exactly why RULING 23
// broke three pre-existing pages the moment a real ampersand-followed-by-
// letter turned up outside the two known typos it was written for.
//
// The fix has two parts, checked in order:
//   1. Does '&' even LOOK like it could be starting a reference — is the
//      next character a letter or '#'? If not (space, digit, punctuation,
//      end-of-string, as in `Cost & Manufacturing`), it is unambiguous
//      either way and is left bare, exactly as RULING 23 already had it.
//   2. If it DOES look like a candidate, does it actually COMPLETE into one
//      of the three reference forms HTML defines — named (`&amp;`, up to 32
//      letters/digits starting with a letter, terminated by ';'), decimal
//      (`&#39;`), or hex (`&#x1F600;`)? A complete match is a real entity
//      and is left as-is (this is what makes both functions IDEMPOTENT: an
//      already-escaped `&amp;` is never re-escaped into `&amp;amp;`). An
//      INCOMPLETE one — a letter run with no terminating ';' anywhere, as in
//      `AT&T` — is not actually a reference at all and gets escaped, the
//      same as any other bare '&'.
// `Season Kickoff &amp; Recruitment` therefore reproduces unchanged (step 2
// matches `amp;`), `Cost & Manufacturing` reproduces unchanged (step 1 never
// even engages, the '&' is followed by a space), and `AT&T & Sons` escapes
// only the first '&' (step 1 engages on the 'T', step 2 finds no ';' to
// complete it) while leaving the second bare (step 1 never engages, it's
// followed by a space).
//
// WHY LEAVING A VALID ENTITY UNESCAPED IS SAFE: the only thing '&'-escaping
// defends against is a value FORGING an entity it shouldn't be able to
// (e.g. user input containing literal "&lt;script&gt;" being reinterpreted
// as markup). But a string that already IS a valid, complete character
// reference cannot forge anything further — the browser decodes it to
// plain TEXT, never to markup. Typing `&lt;script&gt;` into a CMS field
// produces the visible text `<script>`, not a live element, because a RAW
// '<' is still ALWAYS escaped by both functions below (unconditionally in
// esc(); attrEsc() never had to escape '<' at all, see below) — the entity
// exemption only ever suppresses a redundant re-escape of something that
// was already inert.
const VALID_CHAR_REF = '(?:[A-Za-z][A-Za-z0-9]{1,31}|#\\d{1,7}|#[xX][0-9a-fA-F]{1,6});';
const AMP_LOOKS_LIKE_BUT_ISNT_A_REF = new RegExp(`&(?=[A-Za-z#])(?!${VALID_CHAR_REF})`, 'g');

// esc() is the TEXT-CONTENT escaper: for a value placed between tags (e.g.
// <p>${esc(value)}</p>). '<' and '>' are ALWAYS escaped — either one left
// literal could open or close a tag, which is exactly how markup injection
// in text content happens, so there is no conditional case for them. '&' is
// escaped when it neither is, nor could complete into, a valid character
// reference (see RULING 24 above) — a bare '&' that stays bare either way
// (before a space, digit, punctuation, or end-of-string) or a letter run
// that never reaches a terminating ';' (`AT&T`) is valid HTML that renders
// as a literal '&', so escaping it there is gratuitous and breaks parity
// with source text that leaves it bare. Quotes have no special meaning in
// text content, so escaping them is gratuitous too: it breaks byte parity
// with source markup that contains literal ' or " in prose without adding
// any safety.
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(AMP_LOOKS_LIKE_BUT_ISNT_A_REF, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// attrEsc() is the DOUBLE-QUOTED-ATTRIBUTE escaper: for a value placed
// inside double quotes (e.g. attr="${attrEsc(value)}"). '"' is ALWAYS
// escaped — it is the only character that can end a double-quoted attribute
// early, so this is the one non-negotiable case. '&' follows the same
// entity-aware rule as esc() (RULING 24). '<' and '>' are NOT escaped here:
// they have no special meaning inside a double-quoted attribute value (the
// HTML parser keeps consuming attribute text, angle brackets and all, until
// the matching closing '"' — it does not open or close tags mid-attribute),
// so escaping them was pure excess that broke parity with source attributes
// containing a literal '<' or '>'. "'" is not escaped either, since a single
// quote inside a double-quoted attribute is just a character. This function
// is safe ONLY when the attribute is double-quoted — the exemption for '<'
// and '>' depends on it, and nothing may ever hand-build a single-quoted or
// unquoted attribute with it. Template authors should prefer attr(), which
// guarantees double-quoting and prevents that mistake.
export function attrEsc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(AMP_LOOKS_LIKE_BUT_ISNT_A_REF, '&amp;')
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
