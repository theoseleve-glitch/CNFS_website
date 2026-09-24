import { esc, attrEsc, cls, each } from '../lib/html.js';

// 404.html's header is structurally different from every other page's, not
// just a class-modifier swap: no nav, no nav-toggle button, no CTA link —
// just the logo — and a "site-header--scrolled" modifier that no other
// source page uses (the other 8 are always "site-header--transparent" in
// practice). Since 404.html carries no nav entry (spec 6.1.2), there is
// nothing for `currentPath`/active-link logic to apply to anyway, so this
// is a distinct rendering branch (`minimal: true`) rather than another
// combination of the existing transparent/magneticCta flags.
function renderMinimalHeader(globals) {
  const b = globals.brand || {};
  return `<header class="site-header site-header--scrolled" role="banner">
  <div class="container container--wide">
    <a href="index.html" class="site-header__logo" aria-label="${attrEsc(b.name)} Home">
      <img src="${attrEsc(b.logo)}" alt="${attrEsc(b.name)} Logo">
      <div class="site-header__logo-text"><span>${esc(b.name)}</span><span>${esc(b.tagline)}</span></div>
    </a>
  </div>
</header>`;
}

export function renderHeader({ globals, currentPath, transparent = true, magneticCta = false, minimal = false }) {
  if (minimal) return renderMinimalHeader(globals);

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
