import { esc, attrEsc, cls, each } from '../lib/html.js';

export function renderHeader({ globals, currentPath, transparent = true, magneticCta = false }) {
  const b = globals.brand || {};
  const cta = globals.navCta;
  const ctaLink = cta
    ? `<a href="${attrEsc(cta.href)}" class="btn btn--primary btn--sm main-nav__cta">${esc(cta.label)}</a>`
    : '';

  return `<header class="${cls('site-header', transparent && 'site-header--transparent')}" role="banner">
  <div class="container container--wide">
    <a href="index.html" class="site-header__logo" aria-label="${attrEsc(b.name)} Home">
      <img src="${attrEsc(b.logo)}" alt="${attrEsc(b.name)} Logo">
      <div class="site-header__logo-text">
        <span>${esc(b.name)}</span>
        <span>${esc(b.tagline)}</span>
      </div>
    </a>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
    </button>
    <nav class="main-nav" role="navigation" aria-label="Main navigation">
      <ul class="main-nav__list">
        ${each(globals.nav, (item) =>
          `<li><a href="${attrEsc(item.href)}" class="${cls('main-nav__link', item.href === currentPath && 'main-nav__link--active')}">${esc(item.label)}</a></li>`
        )}
      </ul>
      ${ctaLink ? (magneticCta ? `<span class="magnetic">${ctaLink}</span>` : ctaLink) : ''}
    </nav>
  </div>
</header>`;
}
