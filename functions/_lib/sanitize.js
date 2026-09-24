// Write-side sanitisation. The renderer escapes on output, but the spec
// requires sanitising on write AND escaping on render — both, not either — so
// that a second write path added later cannot bypass the only defence.
//
// This implements the five items Phase 1 identified as blocking:
//   1. about-preview.props.body[]        rich text, rendered raw()
//   2. about-preview.props.list.items[]  rich text, rendered raw()
//   3. sponsor-grid placeholder icons    entity-only, rendered raw()
//   4. head.jsonLd                       emitted verbatim inside <script>
//   5. contact form field `name` values  collide with Formsubmit reserved keys
//
// Fields 1-3 are the only content rendered with raw(); everything else goes
// through the escapers and needs no cleaning here.

const ALLOWED_TAGS = new Set(['b', 'i', 'em', 'strong', 'br', 'a']);

// Formsubmit keys its behaviour off field names. A field renamed to one of
// these silently redirects the team's mail or disables spam protection, while
// the page still looks perfect.
const RESERVED_FORM_NAMES = new Set(['_next', '_subject', '_captcha', '_template', '_cc', '_honey', '_autoresponse', '_replyto']);

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#|[a-z0-9._-]+\.html)/i;

// Keep only whitelisted tags. Everything else has its angle brackets escaped,
// so it renders as visible text rather than being silently deleted — a
// deletion hides the mistake from whoever typed it.
export function sanitizeRichText(value) {
  const s = String(value == null ? '' : value);
  return s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tagRaw, attrs) => {
    const tag = tagRaw.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (match.startsWith('</')) return `</${tag}>`;
    if (tag === 'br') return '<br>';
    if (tag === 'a') {
      const href = (attrs.match(/\bhref\s*=\s*"([^"]*)"/i) || attrs.match(/\bhref\s*=\s*'([^']*)'/i) || [])[1] || '';
      // Drop javascript:, data:, vbscript: and anything else unrecognised.
      if (!SAFE_HREF.test(href.trim())) return '<a>';
      const safe = href.trim().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<a href="${safe}">`;
    }
    // b / i / em / strong: keep the tag, drop every attribute (which removes
    // any on* handler or style payload).
    return `<${tag}>`;
  });
}

// Entity-only fields (icon glyphs). Anything that is not a character reference
// or ordinary text has its brackets escaped.
export function sanitizeEntityOnly(value) {
  return String(value == null ? '' : value).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// JSON-LD is emitted verbatim inside <script>. It must be valid JSON and must
// not be able to close the element.
export function sanitizeJsonLd(value) {
  if (value == null || value === '') return value;
  const s = String(value);
  if (/<\/script/i.test(s)) throw new Error('JSON-LD may not contain </script');
  try {
    JSON.parse(s);
  } catch {
    throw new Error('JSON-LD must be valid JSON');
  }
  return s;
}

function walkSections(page, fn) {
  if (!page || !Array.isArray(page.sections)) return;
  for (const section of page.sections) fn(section);
}

export function sanitizeDocument({ doc, theme, globals }) {
  const pages = doc.pages;

  for (const [pageKey, page] of Object.entries(pages)) {
    if (!page || typeof page !== 'object') throw new Error(`Page "${pageKey}" is not an object`);

    if (page.head && page.head.jsonLd != null) {
      page.head.jsonLd = sanitizeJsonLd(page.head.jsonLd);
    }

    walkSections(page, (section) => {
      const p = (section && section.props) || {};

      if (section.type === 'about-preview') {
        if (Array.isArray(p.body)) p.body = p.body.map(sanitizeRichText);
        if (p.list && Array.isArray(p.list.items)) p.list.items = p.list.items.map(sanitizeRichText);
        if (p.list && p.list.icon != null) p.list.icon = sanitizeEntityOnly(p.list.icon);
      }

      if (section.type === 'sponsor-grid' || section.type === 'sponsors-section') {
        const tiers = Array.isArray(p.tiers) ? p.tiers : [];
        for (const tier of tiers) {
          if (tier && tier.placeholderIcon != null) tier.placeholderIcon = sanitizeEntityOnly(tier.placeholderIcon);
        }
      }

      // The visible form controls live in `form.rows`, as rows of fields. The
      // provider's own wiring lives in the internal `_hidden` / `_honeypot`
      // props, which the editor never exposes — so the risk is an EDITABLE
      // field being renamed onto a reserved key, which would silently redirect
      // the team's mail or disable the captcha while the page still looks fine.
      if (section.type === 'contact-grid' && p.form) {
        for (const row of Array.isArray(p.form.rows) ? p.form.rows : []) {
          const fields = Array.isArray(row) ? row : [row];
          for (const field of fields) {
            const name = String((field && field.name) || '');
            if (RESERVED_FORM_NAMES.has(name.toLowerCase())) {
              throw new Error(
                `Form field name "${name}" is reserved by the mail provider and would break delivery to contact@cnfs.racing`
              );
            }
          }
        }
      }
    });
  }

  return { doc, theme, globals };
}

export { RESERVED_FORM_NAMES, ALLOWED_TAGS };
