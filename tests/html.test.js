import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, attrEsc, attr, raw, cls, each } from '../src/templates/lib/html.js';

test('esc always escapes < and > in text content', () => {
  assert.equal(esc('<a> & "b" \'c\''), '&lt;a&gt; & "b" \'c\'');
  assert.equal(esc('<b>'), '&lt;b&gt;');
});

test('esc leaves a bare & literal when it is not followed by a letter or #', () => {
  assert.equal(esc('A & B'), 'A & B');
  assert.equal(esc('Team Formation & Concept Design'), 'Team Formation & Concept Design');
  assert.equal(esc('Cost & Manufacturing'), 'Cost & Manufacturing');
});

test('IDEMPOTENCE: esc leaves an already-valid character reference unchanged, never double-encoding it', () => {
  assert.equal(esc('Season Kickoff &amp; Recruitment'), 'Season Kickoff &amp; Recruitment');
  assert.equal(esc('&copy; 2026'), '&copy; 2026');
  assert.equal(esc('&#9737;'), '&#9737;');
  assert.equal(esc('&#x1F600;'), '&#x1F600;');
});

test('esc escapes a letter-run that looks like a reference but never completes with a ;', () => {
  // 'AT&T & Sons': the first '&' is followed by a letter ('T') but the run
  // is never terminated by ';' anywhere, so it is not actually a reference
  // and gets escaped. The second '&' is followed by a space — never even a
  // candidate — so it stays bare, exactly like the 'Cost & Manufacturing'
  // case above. Both outcomes appear in one string on purpose: this is the
  // exact ambiguity RULING 23's plain "next character" rule could not
  // resolve, and RULING 24's completion check does.
  assert.equal(esc('AT&T & Sons'), 'AT&amp;T & Sons');
});

test('esc always escapes a raw < even when an adjacent & forms a valid entity', () => {
  // A complete, valid reference is passed through unchanged (safe — it
  // decodes to inert text, never markup) while a genuinely raw '<' is still
  // caught unconditionally, in the very same string.
  assert.equal(esc('&lt;script&gt;'), '&lt;script&gt;');
  assert.equal(esc('<script>'), '&lt;script&gt;');
});

test('esc returns empty string for null and undefined', () => {
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
});

test('esc leaves accented characters alone', () => {
  assert.equal(esc("Préparer l'avenir"), "Préparer l'avenir");
});

test('esc leaves a literal double quote and apostrophe untouched in text', () => {
  assert.equal(esc(`She said "hi" and it's fine`), `She said "hi" and it's fine`);
});

test('attrEsc prevents breaking out of a double-quoted attribute', () => {
  assert.equal(attrEsc('x" onerror="alert(1)'), 'x&quot; onerror=&quot;alert(1)');
});

test('attrEsc escapes " but leaves \' untouched', () => {
  assert.equal(attrEsc(`a"b'c`), 'a&quot;b\'c');
});

test('attrEsc does not escape < or > inside a double-quoted attribute', () => {
  assert.equal(attrEsc('<210kg'), '<210kg');
  assert.equal(attrEsc('a " b'), 'a &quot; b');
  assert.equal(attrEsc('A & B'), 'A & B');
});

test('IDEMPOTENCE: attrEsc leaves an already-valid character reference unchanged, never double-encoding it', () => {
  assert.equal(attrEsc('&amp;'), '&amp;');
  assert.equal(attrEsc('&#39;'), '&#39;');
  assert.equal(attrEsc('&#x1F600;'), '&#x1F600;');
});

test('attrEsc escapes a letter-run that looks like a reference but never completes with a ;', () => {
  // Same ambiguity as esc()'s equivalent test, in an attribute-value string:
  // the first '&' (followed by 'T', never terminated by ';') is escaped; the
  // second (followed by a space) stays bare.
  assert.equal(attrEsc('AT&T & Sons'), 'AT&amp;T & Sons');
});

test('PARITY: text escaping must not introduce entities the source does not have', () => {
  const html = esc(`France's "best" team`);
  assert.ok(!html.includes('&#39;'));
  assert.ok(!html.includes('&quot;'));
});

test('SECURITY: attribute values cannot break out of their quotes', () => {
  // A '"' still terminates the attribute early if unescaped, so it remains
  // the one character attrEsc() must always neutralise.
  assert.equal(attrEsc('x" onload="alert(1)'), 'x&quot; onload=&quot;alert(1)');

  // RULING 23 stops escaping '<' and '>' inside a double-quoted attribute,
  // since neither can end the attribute or open a tag there — the HTML
  // parser consumes everything up to the matching closing '"' as attribute
  // text. Prove that directly: build the tag markup with an unescaped
  // <script> payload in the attribute value, and confirm no live `<script`
  // element appears in the surrounding tag source (the payload's `<` and
  // `>` stay inert characters inside the quoted value, not parser-visible
  // markup).
  const payload = '<script>alert(1)</script>';
  const tag = `<meta name="x" content="${attrEsc(payload)}">`;
  assert.equal(tag, '<meta name="x" content="<script>alert(1)</script>">');

  // The whole tag is still one well-formed <meta ...> element: everything
  // up to and including the opening quote of content=" is untouched by the
  // payload, and the string ends with exactly one '">' right after it — so
  // the payload's '<' and '>' stay inert characters inside the quoted
  // value; there is no SECOND, unquoted '<script' anywhere in the tag that
  // a parser could open as a live element.
  const openQuoteEnd = tag.indexOf('content="') + 'content="'.length;
  assert.ok(!tag.slice(0, openQuoteEnd).includes('<script'));
  assert.equal((tag.match(/<script/g) || []).length, 1);
  assert.ok(tag.endsWith('</script>">'));
});

test('INVARIANT: attrEsc is safe only inside double quotes', () => {
  // attrEsc()'s only non-negotiable job is neutralising '"', because that is
  // the sole character that can end a double-quoted attribute value early.
  // A single-quoted or unquoted attribute is unsupported: '\'' is left
  // untouched (documented above attrEsc()), so hand-building either of
  // those attribute forms with attrEsc() would remain breakable.
  assert.equal(attrEsc('"'), '&quot;');
  assert.equal(attrEsc("'"), "'");
});

test('attr omits the attribute entirely when the value is absent', () => {
  assert.equal(attr('src', undefined), '');
  assert.equal(attr('src', null), '');
  assert.equal(attr('src', ''), '');
  assert.equal(attr('src', 'a.jpg'), ' src="a.jpg"');
});

test('raw passes pre-sanitised markup through unchanged', () => {
  assert.equal(raw('&copy; 2026'), '&copy; 2026');
  assert.equal(raw(undefined), '');
});

test('cls drops falsy parts and joins with one space', () => {
  assert.equal(cls('btn', false && 'x', null, 'btn--lg'), 'btn btn--lg');
});

test('each tolerates an absent list', () => {
  assert.equal(each(undefined, (x) => `<li>${x}</li>`), '');
  assert.equal(each(['a', 'b'], (x) => `<li>${x}</li>`), '<li>a</li><li>b</li>');
});
