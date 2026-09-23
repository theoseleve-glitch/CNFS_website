import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, attrEsc, attr, raw, cls, each } from '../src/templates/lib/html.js';

test('esc escapes only the three text-context-significant characters', () => {
  assert.equal(esc('<a> & "b" \'c\''), '&lt;a&gt; &amp; "b" \'c\'');
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

test('PARITY: text escaping must not introduce entities the source does not have', () => {
  const html = esc(`France's "best" team`);
  assert.ok(!html.includes('&#39;'));
  assert.ok(!html.includes('&quot;'));
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
