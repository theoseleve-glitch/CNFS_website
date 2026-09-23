import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeGlobals } from '../src/templates/page.js';

const globals = {
  brand: { name: 'CNFS', tagline: 'Formula Student', logo: 'assets/images/logo-cnfs.png' },
  nav: [
    { label: 'Home', href: 'index.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Formula Student', href: 'formula-student.html' },
    { label: 'The Project', href: 'project.html' },
    { label: 'Partners', href: 'partners.html' },
    { label: 'Contact', href: 'contact.html' }
  ],
  footer: {
    brandDesc: 'Centrale Nantes Formula Student - default.',
    columns: [{ heading: 'Navigation', links: [{ label: 'Home', href: 'index.html' }] }],
    bottom: { copyright: '&copy; 2026', credit: 'default credit' }
  }
};

test('overriding footer.brandDesc leaves footer.columns and footer.bottom intact', () => {
  const merged = mergeGlobals(globals, { footer: { brandDesc: 'index-only desc' } });
  assert.equal(merged.footer.brandDesc, 'index-only desc');
  assert.deepEqual(merged.footer.columns, globals.footer.columns);
  assert.deepEqual(merged.footer.bottom, globals.footer.bottom);
});

test('overriding brand.name leaves brand.tagline and brand.logo intact', () => {
  const merged = mergeGlobals(globals, { brand: { name: 'X' } });
  assert.equal(merged.brand.name, 'X');
  assert.equal(merged.brand.tagline, globals.brand.tagline);
  assert.equal(merged.brand.logo, globals.brand.logo);
});

test('an array override replaces the base array wholesale rather than merging by index', () => {
  const shortNav = [{ label: 'Home', href: 'index.html' }, { label: 'Contact', href: 'contact.html' }];
  const merged = mergeGlobals(globals, { nav: shortNav });
  assert.equal(merged.nav.length, 2);
  assert.deepEqual(merged.nav, shortNav);
});

test('an absent globalsOverride returns the base globals unchanged', () => {
  assert.deepEqual(mergeGlobals(globals, undefined), globals);
});

test('a base-object/override-scalar type mismatch replaces wholesale and does not throw', () => {
  assert.doesNotThrow(() => mergeGlobals(globals, { brand: 'not an object' }));
  const merged = mergeGlobals(globals, { brand: 'not an object' });
  assert.equal(merged.brand, 'not an object');
});
