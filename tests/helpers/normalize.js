// Normalises HTML for parity comparison. Ignores differences that do not
// affect rendering: indentation, line breaks, and authoring comments.
// Deliberately does NOT decode entities — a template that emits &amp;copy;
// where the source had &copy; is a real bug and must still fail.
export function normalizeHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')   // authoring comments
    .replace(/>\s+</g, '><')           // delete inter-tag whitespace (not collapse). Makes normalizer blind to spacing between adjacent inline elements. Safe for this site: all such containers (.social-links, .main-nav__list, .btn-group, .page-header__breadcrumb, .marquee__track) are flex/inline-flex with explicit gap, so whitespace-only text nodes generate no boxes. A future non-flex inline run would need this revisited.
    .replace(/\s+/g, ' ')              // runs of whitespace in text
    .trim();
}
