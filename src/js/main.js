/* ==========================================================================
   CNFS - Centrale Nantes Formula Student
   Main JavaScript
   WordPress-compatible: no framework dependencies, vanilla JS only
   ========================================================================== */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     1. Unified scroll handler (single listener, rAF-throttled)
     ----------------------------------------------------------------------- */
  const header = document.querySelector('.site-header');
  const backToTop = document.querySelector('.back-to-top');
  const heroBg = document.querySelector('.hero__bg-image');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scrollTicking = false;

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('site-header--scrolled', y > 50);
    if (backToTop) backToTop.classList.toggle('back-to-top--visible', y > 600);
    if (heroBg && !prefersReducedMotion && y < window.innerHeight) {
      heroBg.style.transform = 'translateY(' + (y * 0.3) + 'px)';
    }
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(onScroll);
      scrollTicking = true;
    }
  }, { passive: true });
  onScroll();

  /* -----------------------------------------------------------------------
     2. Mobile navigation toggle
     ----------------------------------------------------------------------- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('nav-toggle--active');
      mainNav.classList.toggle('main-nav--open');
      const isOpen = mainNav.classList.contains('main-nav--open');
      document.body.style.overflow = isOpen ? 'hidden' : '';
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.querySelectorAll('.main-nav__link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('nav-toggle--active');
        mainNav.classList.remove('main-nav--open');
        document.body.style.overflow = '';
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('main-nav--open')) {
        navToggle.classList.remove('nav-toggle--active');
        mainNav.classList.remove('main-nav--open');
        document.body.style.overflow = '';
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* -----------------------------------------------------------------------
     3. Smooth scroll for anchor links
     ----------------------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || this.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* -----------------------------------------------------------------------
     4. Scroll-triggered animations — now handled by scroll3d.js
     ----------------------------------------------------------------------- */

  /* -----------------------------------------------------------------------
     5. Counter animation for stats
     ----------------------------------------------------------------------- */
  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 2000;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = Math.round(eased * target);
      el.textContent = prefix + current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll('[data-count]');
  if (counters.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(el => counterObserver.observe(el));
  }

  /* -----------------------------------------------------------------------
     6. Active nav link based on current page
     ----------------------------------------------------------------------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('main-nav__link--active');
    }
  });

  /* -----------------------------------------------------------------------
     7. Contact form (front-end only, WP will replace with plugin)
     ----------------------------------------------------------------------- */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Sent!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        this.reset();
      }, 2500);
    });
  }

  /* -----------------------------------------------------------------------
     8. Back-to-top click handler (scroll logic is in unified handler above)
     ----------------------------------------------------------------------- */
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();
