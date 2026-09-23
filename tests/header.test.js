import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHeader } from '../src/templates/globals/header.js';

const globals = {
  brand: { name: 'CNFS', tagline: 'Formula Student', logo: 'assets/images/logo-cnfs.png' },
  nav: [
    { label: 'Home', href: 'index.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Contact', href: 'contact.html' }
  ],
  navCta: { label: 'Become a Partner', href: 'partners.html' }
};

test('marks only the current page active', () => {
  const html = renderHeader({ globals, currentPath: 'about.html' });
  assert.ok(html.includes('<a href="about.html" class="main-nav__link main-nav__link--active">About</a>'));
  assert.ok(html.includes('<a href="index.html" class="main-nav__link">Home</a>'));
  assert.equal(html.match(/main-nav__link--active/g).length, 1);
});

test('marks nothing active on a page absent from the nav, such as 404', () => {
  const html = renderHeader({ globals, currentPath: '404.html' });
  assert.ok(!html.includes('main-nav__link--active'));
});

test('applies the transparent modifier only when asked', () => {
  assert.ok(renderHeader({ globals, currentPath: 'about.html', transparent: true })
    .includes('class="site-header site-header--transparent"'));
  assert.ok(renderHeader({ globals, currentPath: 'about.html', transparent: false })
    .includes('class="site-header"'));
});

test('renders one list item per nav entry', () => {
  const html = renderHeader({ globals, currentPath: 'about.html' });
  assert.equal(html.match(/<li>/g).length, 3);
});
