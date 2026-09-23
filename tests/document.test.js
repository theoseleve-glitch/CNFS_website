import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDocument } from '../src/templates/document.js';

const page = {
  path: 'about.html',
  title: 'About Us - CNFS',
  meta: { description: 'Who we are.', themeColor: '#0A0C10' },
  head: { stylesheets: ['css/style.css'], fontHref: 'https://fonts.googleapis.com/css2?family=X' },
  scripts: ['js/main.js']
};

test('opens with the doctype and the lang attribute', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '<main></main>' });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<html lang="en">'));
});

test('places the title and description from page meta', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(html.includes('<title>About Us - CNFS</title>'));
  assert.ok(html.includes('<meta name="description" content="Who we are.">'));
});

test('omits the Open Graph block when no og fields are present', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(!html.includes('og:title'));
  assert.ok(!html.includes('undefined'));
});

test('omits the JSON-LD block when the page has none', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(!html.includes('application/ld+json'));
});

test('injects no theme style block when there are no overrides', () => {
  const html = renderDocument({ page, globals: {}, theme: { overrides: {} }, body: '' });
  assert.ok(!html.includes('cnfs-theme'));
});

test('places the body markup inside the body element', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '<main id="x"></main>' });
  assert.ok(html.includes('<main id="x"></main>'));
});
