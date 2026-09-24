// Section registry. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime.

import { renderAboutParallax } from './about-parallax.js';
import { renderAboutPreview } from './about-preview.js';
import { renderCarPinned } from './car-pinned.js';
import { renderCardGrid } from './card-grid.js';
import { renderCardsSection } from './cards-section.js';
import { renderCtaBanner } from './cta-banner.js';
import { renderCtaSection } from './cta-section.js';
import { renderDeptGrid } from './dept-grid.js';
import { renderFsEvents } from './fs-events.js';
import { renderHeroAw } from './hero-aw.js';
import { renderMarquee } from './marquee.js';
import { renderOrgChart } from './org-chart.js';
import { renderPageHeader } from './page-header.js';
import { renderSIntro } from './s-intro.js';
import { renderSpecsGrid } from './specs-grid.js';
import { renderSponsorGrid } from './sponsor-grid.js';
import { renderSponsorsSection } from './sponsors-section.js';
import { renderStatsAw } from './stats-aw.js';
import { renderTableScroll } from './table-scroll.js';
import { renderTimeline } from './timeline.js';
import { renderTimelineRoadmap } from './timeline-roadmap.js';
import { renderTimelineSplit } from './timeline-split.js';

export const SECTIONS = {
  'about-parallax': renderAboutParallax,
  'about-preview': renderAboutPreview,
  'car-pinned': renderCarPinned,
  'card-grid': renderCardGrid,
  'cards-section': renderCardsSection,
  'cta-banner': renderCtaBanner,
  'cta-section': renderCtaSection,
  'dept-grid': renderDeptGrid,
  'fs-events': renderFsEvents,
  'hero-aw': renderHeroAw,
  'marquee': renderMarquee,
  'org-chart': renderOrgChart,
  'page-header': renderPageHeader,
  's-intro': renderSIntro,
  'specs-grid': renderSpecsGrid,
  'sponsor-grid': renderSponsorGrid,
  'sponsors-section': renderSponsorsSection,
  'stats-aw': renderStatsAw,
  'table-scroll': renderTableScroll,
  'timeline': renderTimeline,
  'timeline-roadmap': renderTimelineRoadmap,
  'timeline-split': renderTimelineSplit
};

export function renderSection(section, ctx = {}) {
  if (section.visible === false) return '';
  const fn = SECTIONS[section.type];
  if (!fn) throw new Error('Unknown section type: ' + section.type);
  return fn(section.props || {}, { ...ctx, section });
}
