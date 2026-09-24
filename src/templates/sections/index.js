// Section registry. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime.
//
// RULING 29 — internal-prop convention: a prop name prefixed with `_` (e.g.
// card-grid's `_brokenHeader`) is internal bug-compatibility or structural
// plumbing, not content. It exists only to reproduce a quirk — typically a
// typo — in the original static HTML, and must never surface to a
// non-developer as an editable field. Phase 4's field-definition generator
// MUST skip every underscore-prefixed prop when building an editor form.
// These props are expected to be deleted the day the underlying HTML quirk
// they compensate for is fixed — they are not permanent API surface, and
// every value that reaches one is still escaped exactly like ordinary
// content (Ruling 28) since "internal" describes who edits it, not how
// trusted its value is.

import { renderAboutParallax } from './about-parallax.js';
import { renderAboutPreview } from './about-preview.js';
import { renderCarPinned } from './car-pinned.js';
import { renderCardGrid } from './card-grid.js';
import { renderCardsSection } from './cards-section.js';
import { renderContactGrid } from './contact-grid.js';
import { renderContentCardSplit } from './content-card-split.js';
import { renderCtaBanner } from './cta-banner.js';
import { renderCtaSection } from './cta-section.js';
import { renderDeptGrid } from './dept-grid.js';
import { renderError404 } from './error-404.js';
import { renderEventsList } from './events-list.js';
import { renderFsEvents } from './fs-events.js';
import { renderHeroAw } from './hero-aw.js';
import { renderMapPlaceholder } from './map-placeholder.js';
import { renderMarquee } from './marquee.js';
import { renderNewsGrid } from './news-grid.js';
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
  'contact-grid': renderContactGrid,
  'content-card-split': renderContentCardSplit,
  'cta-banner': renderCtaBanner,
  'cta-section': renderCtaSection,
  'dept-grid': renderDeptGrid,
  'error-404': renderError404,
  'events-list': renderEventsList,
  'fs-events': renderFsEvents,
  'hero-aw': renderHeroAw,
  'map-placeholder': renderMapPlaceholder,
  'marquee': renderMarquee,
  'news-grid': renderNewsGrid,
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
