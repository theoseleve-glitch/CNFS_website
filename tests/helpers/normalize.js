// Normalises HTML for parity comparison. Ignores differences that do not
// affect rendering: indentation, line breaks, and authoring comments.
// Deliberately does NOT decode entities — a template that emits &amp;copy;
// where the source had &copy; is a real bug and must still fail.
export function normalizeHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')   // authoring comments
    .replace(/>\s+</g, '><')           // whitespace between tags
    .replace(/\s+/g, ' ')              // runs of whitespace in text
    .trim();
}
