import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../src/templates/page.js';
import { compareToGolden } from './helpers/golden.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('partners.html renders identically to the current static file', () => {
  const html = renderPage({
    page: read('../src/content/pages/partners.json'),
    globals: read('../src/content/globals.json'),
    theme: read('../src/content/theme.json'),
    mode: 'public'
  });
  const result = compareToGolden('partners.html', html);
  assert.ok(result.ok, result.message);
});
