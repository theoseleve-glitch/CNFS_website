import { esc, attrEsc, raw, each } from '../lib/html.js';

export function renderFooter({ globals }) {
  const f = globals.footer || {};
  return `<footer class="site-footer" role="contentinfo">
  <div class="container container--wide">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <div class="site-footer__brand-name">${esc((globals.brand || {}).name)}</div>
        <p class="site-footer__brand-desc">${esc(f.brandDesc)}</p>
        <div class="social-links">
          ${each(globals.social, (s) => s.href
            ? `<a href="${attrEsc(s.href)}" target="_blank" rel="noopener" class="social-link" aria-label="${attrEsc(s.platform)}">${raw(s.glyph)}</a>`
            : `<a href="#" role="link" aria-disabled="true" class="social-link" aria-label="${attrEsc(s.platform)}">${raw(s.glyph)}</a>`
          )}
        </div>
      </div>
      ${each(f.columns, (col) => `<div>
        <h4 class="site-footer__heading">${esc(col.heading)}</h4>
        <ul class="site-footer__links">
          ${each(col.links, (l) => l.href
            ? `<li><a href="${attrEsc(l.href)}" class="site-footer__link">${esc(l.label)}</a></li>`
            : `<li><span class="site-footer__link">${esc(l.label)}</span></li>`
          )}
        </ul>
      </div>`)}
    </div>
    <div class="site-footer__bottom">
      <span>${raw(f.bottom && f.bottom.copyright)}</span>
      <span>${raw(f.bottom && f.bottom.credit)}</span>
    </div>
  </div>
</footer>`;
}
