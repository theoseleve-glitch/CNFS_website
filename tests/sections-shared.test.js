import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection, SECTIONS } from '../src/templates/sections/index.js';

test('page-header renders breadcrumb and title', () => {
  const html = renderSection({
    type: 'page-header',
    props: { breadcrumb: [{ label: 'Home', href: 'index.html' }, { label: 'About Us' }], title: 'About Us' }
  });
  assert.ok(html.includes('<a href="index.html">Home</a>'));
  assert.ok(html.includes('<span class="page-header__breadcrumb-sep">/</span>'));
  assert.ok(html.includes('<span>About Us</span>'));
  assert.ok(html.includes('<h1 class="page-header__title">About Us</h1>'));
});

test('a hidden section renders nothing', () => {
  assert.equal(renderSection({ type: 'page-header', visible: false, props: { title: 'x' } }), '');
});

test('an unknown section type fails loudly rather than silently', () => {
  assert.throws(() => renderSection({ type: 'nope', props: {} }), /Unknown section type: nope/);
});

test('about-preview omits the image block entirely when there is no image', () => {
  const html = renderSection({ type: 'about-preview', props: { title: 'T', body: ['p'] } });
  assert.ok(!html.includes('undefined'));
  assert.ok(!html.includes('src=""'));
  assert.ok(!html.includes('about-preview__image'));
});

test('cta-section omits the button group when there are no actions', () => {
  const html = renderSection({ type: 'cta-section', props: { title: 'T', text: 'x' } });
  assert.ok(!html.includes('btn-group'));
  assert.ok(!html.includes('undefined'));
});

test('card-grid renders one card per entry and omits absent icons', () => {
  const html = renderSection({
    type: 'card-grid',
    props: { cards: [{ title: 'A', text: 'a', icon: '&#9881;' }, { title: 'B', text: 'b' }] }
  });
  assert.equal(html.match(/class="card"/g).length, 2);
  assert.equal(html.match(/card__icon/g).length, 1);
  assert.ok(html.includes('&#9881;'));
  assert.ok(!html.includes('&amp;#9881;'));
});

test('every registered type is a function', () => {
  for (const [type, fn] of Object.entries(SECTIONS)) {
    assert.equal(typeof fn, 'function', `${type} is not a function`);
  }
});
