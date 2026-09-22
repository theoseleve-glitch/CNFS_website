import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHtml } from './helpers/normalize.js';

test('collapses whitespace between tags', () => {
  assert.equal(
    normalizeHtml('<div>\n  <p>hi</p>\n</div>'),
    '<div><p>hi</p></div>'
  );
});

test('collapses runs of whitespace inside text to one space', () => {
  assert.equal(normalizeHtml('<p>a   b\n\tc</p>'), '<p>a b c</p>');
});

test('strips HTML comments', () => {
  assert.equal(normalizeHtml('<div><!-- note --><p>x</p></div>'), '<div><p>x</p></div>');
});

test('preserves entities without decoding them', () => {
  assert.equal(normalizeHtml('<p>&copy; &#9737;</p>'), '<p>&copy; &#9737;</p>');
});

test('preserves accented characters', () => {
  assert.equal(normalizeHtml("<p>Préparer l'avenir</p>"), "<p>Préparer l'avenir</p>");
});

test('treats differing indentation as equal', () => {
  assert.equal(
    normalizeHtml('<ul>\n    <li>a</li>\n</ul>'),
    normalizeHtml('<ul><li>a</li></ul>')
  );
});
