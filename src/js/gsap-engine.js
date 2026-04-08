/* ==========================================================================
   CNFS GSAP Engine
   Lenis smooth scroll + ScrollTrigger + all scroll-driven animations
   Requires: gsap, ScrollTrigger, Lenis (loaded from CDN before this file)
   ========================================================================== */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* -----------------------------------------------------------------------
     0. Preloader
     ----------------------------------------------------------------------- */
  var preloader = document.querySelector('.preloader');
  if (preloader && typeof gsap !== 'undefined') {
    var tl = gsap.timeline();
    tl.to('.preloader__logo', { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .to('.preloader__bar', { opacity: 1, duration: 0.3 }, '-=0.3')
      .to('.preloader__fill', { width: '100%', duration: 1.2, ease: 'power2.inOut' }, '-=0.1')
      .to(preloader, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: function () {
          preloader.classList.add('done');
          document.body.style.overflow = '';
          initAll();
        }
      }, '+=0.2');
    document.body.style.overflow = 'hidden';
  } else {
    if (preloader) preloader.classList.add('done');
    initAll();
  }

  function initAll() {
    if (typeof gsap === 'undefined') return;
    if (reducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    /* -----------------------------------------------------------------------
       1. Lenis Smooth Scroll
       ----------------------------------------------------------------------- */
    var lenis;
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.2,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        touchMultiplier: 1.5
      });

      lenis.on('scroll', ScrollTrigger.update);

      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    /* -----------------------------------------------------------------------
       2. Smart Nav — hide on scroll down, show on scroll up
       ----------------------------------------------------------------------- */
    var header = document.querySelector('.site-header');
    if (header) {
      var lastY = 0;
      ScrollTrigger.create({
        start: 'top -80',
        onUpdate: function (self) {
          var direction = self.direction;
          var scrollY = self.scroll();
          if (scrollY > 100) {
            header.classList.toggle('site-header--hidden', direction === 1);
            header.classList.add('site-header--scrolled');
          } else {
            header.classList.remove('site-header--hidden', 'site-header--scrolled');
          }
        }
      });
    }

    /* -----------------------------------------------------------------------
       3. Hero Split-Text Animation
       ----------------------------------------------------------------------- */
    var heroTitle = document.querySelector('.hero-aw__title');
    if (heroTitle) {
      // Split into lines by <br> or natural wrap
      var lines = heroTitle.querySelectorAll('.line-inner');
      if (lines.length > 0) {
        gsap.set(lines, { yPercent: 110 });
        gsap.to(lines, {
          yPercent: 0,
          duration: 1,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.3
        });
      }

      // Hero subtitle + actions
      gsap.from('.hero-aw__eyebrow', { opacity: 0, y: 20, duration: 0.8, delay: 0.6, ease: 'power2.out' });
      gsap.from('.hero-aw__desc', { opacity: 0, y: 30, duration: 0.8, delay: 1.0, ease: 'power2.out' });
      gsap.from('.hero-aw__actions .btn', { opacity: 0, y: 20, duration: 0.6, stagger: 0.1, delay: 1.2, ease: 'power2.out' });
      gsap.from('.hero-aw__scroll', { opacity: 0, duration: 0.6, delay: 1.5, ease: 'power2.out' });
    }

    /* Hero parallax: BG image scrubs with scroll */
    var heroBg = document.querySelector('.hero-aw__bg img');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 20,
        scale: 1.1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-aw',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* -----------------------------------------------------------------------
       4. Marquee — GSAP-driven infinite scroll
       ----------------------------------------------------------------------- */
    var marqueeTrack = document.querySelector('.marquee__track');
    if (marqueeTrack) {
      // Duplicate content for seamless loop
      var clone = marqueeTrack.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      marqueeTrack.parentNode.appendChild(clone);

      gsap.to('.marquee__track', {
        xPercent: -50,
        duration: 25,
        ease: 'none',
        repeat: -1
      });
    }

    /* -----------------------------------------------------------------------
       5. Section Reveals — staggered entrance
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.s-intro').forEach(function (el) {
      var children = el.children;
      gsap.from(children, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%'
        }
      });
    });

    /* -----------------------------------------------------------------------
       6. Card Grid Reveals — deconstructed 3D assembly
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.grid-decon, .grid--3, .grid--2').forEach(function (grid) {
      var items = grid.children;
      if (items.length === 0) return;
      gsap.from(items, {
        opacity: 0,
        y: 60,
        rotateX: 8,
        rotateY: function (i) { return (i % 2 === 0 ? -5 : 5); },
        scale: 0.92,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 80%'
        }
      });
    });

    /* -----------------------------------------------------------------------
       7. SIGNATURE MOMENT — Pinned Car Specs
       ----------------------------------------------------------------------- */
    var carPinned = document.querySelector('.car-pinned');
    if (carPinned) {
      var specs = carPinned.querySelectorAll('.car-pinned__spec');
      var dots = carPinned.querySelectorAll('.car-pinned__dot');
      var numSpecs = specs.length;

      if (numSpecs > 0) {
        var carTl = gsap.timeline({
          scrollTrigger: {
            trigger: carPinned,
            start: 'top top',
            end: '+=' + (numSpecs * 100) + '%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1
          }
        });

        specs.forEach(function (spec, i) {
          var value = spec.querySelector('.car-pinned__value');

          // Animate in
          carTl.fromTo(spec,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: 'power2.out' }
          );
          carTl.fromTo(value,
            { scale: 0.5, rotateX: 20 },
            { scale: 1, rotateX: 0, duration: 0.4, ease: 'power3.out' },
            '<'
          );

          // Hold
          carTl.to(spec, { opacity: 1, duration: 0.5 });

          // Activate dot
          if (dots[i]) {
            carTl.call(function (idx) {
              dots.forEach(function (d, j) {
                d.classList.toggle('active', j === idx);
              });
            }, [i], '<');
          }

          // Animate out (not on last)
          if (i < numSpecs - 1) {
            carTl.to(spec, { opacity: 0, duration: 0.2, ease: 'power2.in' });
            carTl.fromTo(value, { scale: 1 }, { scale: 1.3, duration: 0.2 }, '<');
          }
        });
      }
    }

    /* -----------------------------------------------------------------------
       8. Stats Counter Pop
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.stats-aw').forEach(function (section) {
      gsap.from(section.querySelectorAll('.stats-aw__item'), {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 75%' }
      });
    });

    /* -----------------------------------------------------------------------
       9. Image Parallax
       ----------------------------------------------------------------------- */
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
      gsap.to(el, {
        yPercent: speed * 15,
        ease: 'none',
        scrollTrigger: {
          trigger: el.closest('.section') || el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    /* -----------------------------------------------------------------------
       10. Image Clip-Path Reveals
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.img-reveal').forEach(function (el) {
      var overlay = el.querySelector('.img-reveal__overlay');
      var img = el.querySelector('img');
      if (overlay && img) {
        var tl2 = gsap.timeline({
          scrollTrigger: { trigger: el, start: 'top 75%' }
        });
        tl2.fromTo(overlay, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.inOut' })
           .set(img, { opacity: 1 })
           .to(overlay, { scaleX: 0, transformOrigin: 'right', duration: 0.5, ease: 'power3.inOut' });
      }
    });

    /* -----------------------------------------------------------------------
       11. CTA Perspective Tilt on Scroll
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.cta-section').forEach(function (el) {
      gsap.from(el.querySelector('.container'), {
        rotateX: 3,
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 80%' }
      });
    });

    /* -----------------------------------------------------------------------
       12. Horizontal Scroll (News)
       ----------------------------------------------------------------------- */
    var hscroll = document.querySelector('.hscroll-section');
    if (hscroll) {
      var track = hscroll.querySelector('.hscroll__track');
      if (track) {
        var trackWidth = track.scrollWidth - hscroll.offsetWidth;
        gsap.to(track, {
          x: -trackWidth,
          ease: 'none',
          scrollTrigger: {
            trigger: hscroll,
            start: 'top top',
            end: '+=' + trackWidth,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1
          }
        });
      }
    }

    /* -----------------------------------------------------------------------
       13. Scroll Velocity Skew on Images
       ----------------------------------------------------------------------- */
    if (!isTouch) {
      var skewSetter = gsap.quickTo('.about-preview__image img, .news-card__image img', 'skewY', {
        duration: 0.3,
        ease: 'power2.out'
      });

      ScrollTrigger.create({
        onUpdate: function (self) {
          var velocity = self.getVelocity() / 300;
          var clamped = gsap.utils.clamp(-3, 3, velocity);
          skewSetter(clamped);
        }
      });
    }

    /* -----------------------------------------------------------------------
       14. Generic [data-scroll-3d] elements (from old system, GSAP-driven now)
       ----------------------------------------------------------------------- */
    document.querySelectorAll('[data-scroll-3d]').forEach(function (el) {
      var type = el.getAttribute('data-scroll-3d');
      var from = { opacity: 0, duration: 0.8, ease: 'power3.out' };

      if (type === 'fly-in') { from.y = 50; from.scale = 0.95; }
      else if (type === 'fly-back') { from.y = -30; from.scale = 1.05; }
      else if (type === 'rotate-left') { from.x = -60; from.rotateY = 8; }
      else if (type === 'rotate-right') { from.x = 60; from.rotateY = -8; }
      else if (type === 'tilt-up') { from.y = 40; from.rotateX = 5; }
      else if (type === 'flip') { from.rotateX = -20; from.y = 40; }
      else { from.y = 40; }

      gsap.from(el, Object.assign(from, {
        scrollTrigger: { trigger: el, start: 'top 82%' }
      }));
    });

    /* -----------------------------------------------------------------------
       15. Magnetic Buttons
       ----------------------------------------------------------------------- */
    if (!isTouch) {
      document.querySelectorAll('.magnetic').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var rect = el.getBoundingClientRect();
          var x = e.clientX - rect.left - rect.width / 2;
          var y = e.clientY - rect.top - rect.height / 2;
          gsap.to(el, { x: x * 0.25, y: y * 0.25, duration: 0.3, ease: 'power2.out' });
        });
        el.addEventListener('mouseleave', function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
        });
      });
    }

    /* -----------------------------------------------------------------------
       16. Custom Cursor (enhanced)
       ----------------------------------------------------------------------- */
    if (!isTouch) {
      var cursor = document.createElement('div');
      cursor.className = 'cursor';
      document.body.appendChild(cursor);

      var cx = 0, cy = 0, tx = 0, ty = 0;
      document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; });
      document.addEventListener('mousedown', function () { cursor.classList.add('cursor--click'); });
      document.addEventListener('mouseup', function () { cursor.classList.remove('cursor--click'); });

      var interactives = 'a, button, .btn, .card, .spec-card, .event-card, .sponsor-slot, .news-card, input, textarea, select';
      document.addEventListener('mouseover', function (e) {
        if (e.target.closest(interactives)) cursor.classList.add('cursor--hover');
      });
      document.addEventListener('mouseout', function (e) {
        if (e.target.closest(interactives)) cursor.classList.remove('cursor--hover');
      });

      gsap.ticker.add(function () {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        gsap.set(cursor, { x: cx, y: cy });
      });
    }

    /* -----------------------------------------------------------------------
       17. Timeline Unfold
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.timeline').forEach(function (tl) {
      gsap.from(tl.querySelectorAll('.timeline__item'), {
        opacity: 0,
        x: -30,
        rotateY: 5,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: { trigger: tl, start: 'top 75%' }
      });
    });

    /* -----------------------------------------------------------------------
       18. Events list cascade
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.events-list, .events-3d').forEach(function (list) {
      gsap.from(list.querySelectorAll('.event-card'), {
        opacity: 0,
        y: 40,
        rotateX: 4,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: list, start: 'top 78%' }
      });
    });

    /* -----------------------------------------------------------------------
       19. Sponsor slots materialize
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.sponsor-grid').forEach(function (grid) {
      gsap.from(grid.querySelectorAll('.sponsor-slot'), {
        opacity: 0,
        scale: 0.8,
        y: 20,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: grid, start: 'top 80%' }
      });
    });

    /* -----------------------------------------------------------------------
       20. Org chart drop-in
       ----------------------------------------------------------------------- */
    document.querySelectorAll('.org-chart').forEach(function (org) {
      org.querySelectorAll('.org-chart__level').forEach(function (level, i) {
        gsap.from(level.querySelectorAll('.team-member'), {
          opacity: 0,
          y: -30,
          scale: 0.9,
          duration: 0.7,
          stagger: 0.1,
          delay: i * 0.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: org, start: 'top 75%' }
        });
      });
    });
  }

})();
