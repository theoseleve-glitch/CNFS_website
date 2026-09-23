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

test('favicon fill and theme-color are independent values', () => {
  const divergent = {
    ...page,
    meta: { ...page.meta, themeColor: '#0A0C10', faviconFill: '#1B2141' }
  };
  const html = renderDocument({ page: divergent, globals: {}, theme: {}, body: '' });
  assert.ok(html.includes('fill=%22%231B2141%22'));
  assert.ok(html.includes('<meta name="theme-color" content="#0A0C10">'));
});

test('omits canonical, hreflang, Open Graph, JSON-LD and closing scripts when their fields are absent', () => {
  const minimal = {
    title: 'Page Not Found - CNFS',
    meta: { themeColor: '#1B2141', faviconFill: '#1B2141' },
    head: { fontHref: 'https://fonts.googleapis.com/css2?family=X', stylesheets: ['css/style.css'] }
  };
  const html = renderDocument({ page: minimal, globals: {}, theme: {}, body: '<main></main>' });
  assert.ok(!html.includes('rel="canonical"'));
  assert.ok(!html.includes('hreflang'));
  assert.ok(!html.includes('og:'));
  assert.ok(!html.includes('ld+json'));
  assert.ok(!html.includes('<script src'));
  assert.ok(!html.includes('undefined'));
});

test('renders meta robots when present and omits it when absent', () => {
  const withRobots = { ...page, meta: { ...page.meta, robots: 'noindex' } };
  const htmlWith = renderDocument({ page: withRobots, globals: {}, theme: {}, body: '' });
  assert.ok(htmlWith.includes('<meta name="robots" content="noindex">'));

  const htmlWithout = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(!htmlWithout.includes('name="robots"'));
});

test('omits meta description entirely when absent, renders it when present', () => {
  const noDescription = { ...page, meta: { themeColor: page.meta.themeColor } };
  const htmlWithout = renderDocument({ page: noDescription, globals: {}, theme: {}, body: '' });
  assert.ok(!htmlWithout.includes('name="description"'));
  assert.ok(!htmlWithout.includes('content=""'));

  const htmlWith = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(htmlWith.includes('<meta name="description" content="Who we are.">'));
});

test('omits the noscript block by default, renders it when head.noscript is true', () => {
  const htmlWithout = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(!htmlWithout.includes('<noscript'));

  const withNoscript = { ...page, head: { ...page.head, noscript: true } };
  const htmlWith = renderDocument({ page: withNoscript, globals: {}, theme: {}, body: '' });
  assert.ok(htmlWith.includes('<noscript><style>'));
  assert.ok(htmlWith.includes('.preloader { display: none !important; }'));
});

test('SECURITY: attribute values cannot break out of their quotes', () => {
  const payload = '" onmouseover="alert(1)';
  const hostile = {
    path: payload,
    title: 't',
    meta: { description: payload, ogTitle: payload, ogImage: payload, ogDescription: 'd', ogSiteName: 's' },
    head: {}
  };
  const html = renderDocument({ page: hostile, globals: {}, theme: {}, body: '' });
  assert.ok(!html.includes('onmouseover="alert(1)"'));
  assert.ok(html.includes('&quot; onmouseover=&quot;alert(1)'));
});

test('the Google Fonts href renders with a raw & and no &amp;', () => {
  const withFont = {
    ...page,
    head: { ...page.head, fontHref: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400&display=swap' }
  };
  const html = renderDocument({ page: withFont, globals: {}, theme: {}, body: '' });
  assert.ok(html.includes('href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400&display=swap"'));
  assert.ok(!html.includes('&amp;family='));
});

test('a 404-shaped page renders none of the full-page-only head elements', () => {
  const notFound = {
    title: 'Page Not Found - CNFS',
    meta: { themeColor: '#1B2141', robots: 'noindex', faviconFill: '#1B2141' },
    head: { fontHref: 'https://fonts.googleapis.com/css2?family=X', stylesheets: ['css/style.css'] }
  };
  const html = renderDocument({ page: notFound, globals: {}, theme: {}, body: '<main></main>' });
  assert.ok(!html.includes('name="description"'));
  assert.ok(!html.includes('rel="canonical"'));
  assert.ok(!html.includes('hreflang'));
  assert.ok(!html.includes('og:'));
  assert.ok(!html.includes('ld+json'));
  assert.ok(!html.includes('<noscript'));
  assert.ok(!html.includes('<script src'));
  assert.ok(!html.includes('undefined'));
});
