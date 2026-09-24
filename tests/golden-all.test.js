import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../src/templates/page.js';
import { compareToGolden } from './helpers/golden.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const globals = read('../src/content/globals.json');
const theme = read('../src/content/theme.json');

const PAGES = [
  'index', 'about', 'formula-student', 'project',
  'partners', 'events', 'news', 'contact', '404'
];

for (const name of PAGES) {
  test(`${name}.html matches the static original`, () => {
    const page = read(`../src/content/pages/${name}.json`);
    const result = compareToGolden(`${name}.html`, renderPage({ page, globals, theme, mode: 'public' }));
    assert.ok(result.ok, result.message);
  });
}

test('every page is covered', () => {
  assert.equal(PAGES.length, 9);
});
