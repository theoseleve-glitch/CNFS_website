// Section registry. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime.

import { renderAboutPreview } from './about-preview.js';
import { renderCardGrid } from './card-grid.js';
import { renderCtaSection } from './cta-section.js';
import { renderPageHeader } from './page-header.js';
import { renderSpecsGrid } from './specs-grid.js';

export const SECTIONS = {
  'about-preview': renderAboutPreview,
  'card-grid': renderCardGrid,
  'cta-section': renderCtaSection,
  'page-header': renderPageHeader,
  'specs-grid': renderSpecsGrid
};

export function renderSection(section, ctx = {}) {
  if (section.visible === false) return '';
  const fn = SECTIONS[section.type];
  if (!fn) throw new Error('Unknown section type: ' + section.type);
  return fn(section.props || {}, { ...ctx, section });
}
