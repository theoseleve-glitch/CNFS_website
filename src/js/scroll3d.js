/* ==========================================================================
   CNFS 3D Scroll Engine
   Drives perspective shifts, section tilts, and continuous scroll transforms.
   Works alongside main.js — this file handles only 3D-specific behavior.
   ========================================================================== */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* -----------------------------------------------------------------------
     1. 3D IntersectionObserver — triggers .in-view on 3D-animated elements
     ----------------------------------------------------------------------- */
  const ANIM_SELECTORS = [
    '[data-scroll-3d]',
    '.grid-decon',
    '.stats-3d',
    '.specs-3d',
    '.timeline-3d',
    '.cta-3d',
    '.events-3d',
    '.sponsors-3d',
    '.org-3d'
  ].join(', ');

  const elements3d = document.querySelectorAll(ANIM_SELECTORS);

  if (elements3d.length > 0 && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    elements3d.forEach(el => obs.observe(el));
  }

  /* -----------------------------------------------------------------------
     2. Continuous scroll-driven section tilt
     Sections with .section-3d get a subtle rotateX based on scroll position
     ----------------------------------------------------------------------- */
  const tiltSections = document.querySelectorAll('.section-3d');
  const heroContent = document.querySelector('.hero-3d .hero__content');

  if (tiltSections.length === 0 && !heroContent) return;

  let ticking = false;

  function onScroll3d() {
    const scrollY = window.scrollY;
    const viewH = window.innerHeight;

    // Section tilt — subtle perspective shift as section enters/leaves
    tiltSections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      // progress: -1 (below viewport) to 0 (centered) to 1 (above viewport)
      const progress = (viewH / 2 - center) / viewH;
      const clampedProgress = Math.max(-1, Math.min(1, progress));

      // Subtle tilt: max ±2deg rotateX, ±1deg rotateY
      const rx = clampedProgress * 2;
      const ry = clampedProgress * -0.5;
      section.style.transform =
        'perspective(1200px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
    });

    // Hero 3D depth — content layers shift at different rates
    if (heroContent && scrollY < window.innerHeight) {
      const ratio = scrollY / window.innerHeight;
      const badge = heroContent.querySelector('.hero__badge');
      const title = heroContent.querySelector('.hero__title');
      const subtitle = heroContent.querySelector('.hero__subtitle');
      const actions = heroContent.querySelector('.hero__actions');

      // Each layer moves up at different speeds (deeper = slower)
      if (title) title.style.transform =
        'translateZ(40px) translateY(' + (ratio * -30) + 'px)';
      if (badge) badge.style.transform =
        'translateZ(80px) translateY(' + (ratio * -50) + 'px)';
      if (subtitle) subtitle.style.transform =
        'translateZ(20px) translateY(' + (ratio * -15) + 'px)';
      if (actions) actions.style.transform =
        'translateZ(10px) translateY(' + (ratio * -10) + 'px)';
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(onScroll3d);
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  onScroll3d();

})();
