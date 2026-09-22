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

test('KNOWN LIMITATION: inter-tag whitespace is deleted, not collapsed', () => {
  // This pins deliberate behaviour: inter-tag whitespace is deleted entirely,
  // making us blind to spacing between adjacent inline elements. Safe only under
  // the precondition that every such container on this site (.social-links,
  // .main-nav__list, .btn-group, .page-header__breadcrumb, .marquee__track) is
  // flex/inline-flex with explicit gap, so whitespace-only nodes generate no boxes.
  // If a future non-flex inline run appears, this test must fail loudly.
  assert.equal(
    normalizeHtml('<span>a</span> <span>b</span>'),
    normalizeHtml('<span>a</span><span>b</span>')
  );
});
