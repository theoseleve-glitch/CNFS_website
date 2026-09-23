import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderFooter } from '../src/templates/globals/footer.js';
import { normalizeHtml } from './helpers/normalize.js';

const globals = {
  brand: { name: 'CNFS' },
  footer: {
    brandDesc: "Centrale Nantes Formula Student - Préparer l'avenir, one student at a time.",
    columns: [
      { heading: 'Navigation', links: [{ label: 'Home', href: 'index.html' }] },
      { heading: 'Contact', links: [{ label: 'Centrale Nantes' }] }
    ],
    bottom: {
      copyright: '&copy; 2026 Centrale Nantes Formula Student. All rights reserved.',
      credit: 'A student project at <a href="https://www.ec-nantes.fr" class="site-footer__link" target="_blank" rel="noopener">Centrale Nantes</a>'
    }
  },
  social: [
    { platform: 'Instagram', href: 'https://www.instagram.com/cnfsracingteam/', glyph: '&#9737;' },
    { platform: 'Facebook', glyph: 'f' }
  ]
};

test('renders accented copy without mangling it', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes("Préparer l'avenir"));
});

test('does not double-escape entities carried over from the source', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('&copy; 2026'));
  assert.ok(!html.includes('&amp;copy;'));
  assert.ok(html.includes('&#9737;'));
  assert.ok(!html.includes('&amp;#9737;'));
});

test('renders a link for social entries with an href and a disabled link without', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('href="https://www.instagram.com/cnfsracingteam/" target="_blank" rel="noopener"'));
  assert.ok(html.includes('<a href="#" role="link" aria-disabled="true" class="social-link" aria-label="Facebook">f</a>'));
});

test('renders a span, not a link, for a column entry with no href', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('<span class="site-footer__link">Centrale Nantes</span>'));
});

test('SECURITY: attribute values cannot break out of their quotes', () => {
  const payload = '" onmouseover="alert(1)';
  const hostile = {
    brand: { name: 'CNFS' },
    footer: {
      brandDesc: 'desc',
      columns: [{ heading: 'Nav', links: [{ label: 'Evil', href: payload }] }],
      bottom: { copyright: '&copy;', credit: 'credit' }
    },
    social: [{ platform: payload, href: payload, glyph: 'x' }]
  };
  const html = renderFooter({ globals: hostile });
  assert.ok(!html.includes('onmouseover="alert(1)"'));
  assert.ok(html.includes('&quot; onmouseover=&quot;alert(1)'));
});

test('renders the real footer from globals.json byte-identically', () => {
  const real = JSON.parse(readFileSync(new URL('../src/content/globals.json', import.meta.url), 'utf8'));
  const page = readFileSync(new URL('../src/about.html', import.meta.url), 'utf8');
  const expected = normalizeHtml(page.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)[0]);
  assert.equal(normalizeHtml(renderFooter({ globals: real })), expected);
});
