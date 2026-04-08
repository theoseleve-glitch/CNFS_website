/* ==========================================================================
   CNFS Premium Interactions
   Custom cursor, magnetic buttons, text splitting, smooth reveal
   ========================================================================== */

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var isTouchDevice = window.matchMedia('(hover: none)').matches;

  /* -----------------------------------------------------------------------
     1. Custom Cursor
     ----------------------------------------------------------------------- */
  if (!isTouchDevice) {
    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);

    var cursorX = 0, cursorY = 0;
    var targetX = 0, targetY = 0;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    document.addEventListener('mousedown', function () {
      cursor.classList.add('cursor--click');
    });

    document.addEventListener('mouseup', function () {
      cursor.classList.remove('cursor--click');
    });

    var interactives = 'a, button, .btn, .card, .spec-card, .event-card, .sponsor-slot, .news-card, .team-member, input, textarea, select';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactives)) cursor.classList.add('cursor--hover');
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactives)) cursor.classList.remove('cursor--hover');
    });

    function updateCursor() {
      cursorX += (targetX - cursorX) * 0.15;
      cursorY += (targetY - cursorY) * 0.15;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(updateCursor);
    }
    updateCursor();
  }

  /* -----------------------------------------------------------------------
     2. Split Text — hero title (safe DOM manipulation, no innerHTML)
     ----------------------------------------------------------------------- */
  var heroTitle = document.querySelector('.hero-cinema__title');
  if (heroTitle) {
    // Walk text nodes and wrap each word in spans using DOM API
    function splitTextNode(textNode, parent) {
      var words = textNode.textContent.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      words.forEach(function (w) {
        if (w.trim() === '') {
          frag.appendChild(document.createTextNode(w));
        } else {
          var outer = document.createElement('span');
          outer.className = 'word';
          var inner = document.createElement('span');
          inner.className = 'word-inner';
          inner.textContent = w;
          outer.appendChild(inner);
          frag.appendChild(outer);
        }
      });
      parent.replaceChild(frag, textNode);
    }

    function walkAndSplit(el) {
      // Snapshot child nodes to avoid live-list mutation issues
      var nodes = Array.prototype.slice.call(el.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === 3 && node.textContent.trim() !== '') {
          splitTextNode(node, el);
        } else if (node.nodeType === 1 && node.tagName !== 'BR') {
          walkAndSplit(node);
        }
      });
    }

    walkAndSplit(heroTitle);

    setTimeout(function () {
      heroTitle.classList.add('revealed');
    }, 300);

    setTimeout(function () {
      document.querySelectorAll('.hero-cinema__sub, .hero-cinema__desc, .hero-cinema__actions').forEach(function (el) {
        el.classList.add('revealed');
      });
    }, 200);
  }

  /* -----------------------------------------------------------------------
     3. Heading Reveal on Scroll
     ----------------------------------------------------------------------- */
  var headingReveals = document.querySelectorAll('.heading-reveal');
  if (headingReveals.length > 0 && 'IntersectionObserver' in window) {
    var headingObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          headingObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    headingReveals.forEach(function (el) { headingObs.observe(el); });
  }

  /* -----------------------------------------------------------------------
     4. Magnetic Buttons
     ----------------------------------------------------------------------- */
  if (!isTouchDevice) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        this.style.transform = 'translate(' + (x * 0.2) + 'px, ' + (y * 0.2) + 'px)';
      });

      el.addEventListener('mouseleave', function () {
        this.style.transform = 'translate(0, 0)';
      });
    });
  }

  /* -----------------------------------------------------------------------
     5. Continuous Parallax for Elements
     ----------------------------------------------------------------------- */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length > 0) {
    var pTicking = false;
    function updateParallax() {
      parallaxEls.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
        var rect = el.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          var progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
          var offset = (progress - 0.5) * speed * 100;
          el.style.transform = 'translateY(' + offset + 'px)';
        }
      });
      pTicking = false;
    }

    window.addEventListener('scroll', function () {
      if (!pTicking) { requestAnimationFrame(updateParallax); pTicking = true; }
    }, { passive: true });
    updateParallax();
  }

  /* -----------------------------------------------------------------------
     6. Reveal Lines
     ----------------------------------------------------------------------- */
  var revealLines = document.querySelectorAll('.reveal-line');
  if (revealLines.length > 0 && 'IntersectionObserver' in window) {
    var lineObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          lineObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    revealLines.forEach(function (el) { lineObs.observe(el); });
  }

  /* -----------------------------------------------------------------------
     7. Section Intro Stagger
     ----------------------------------------------------------------------- */
  var sectionIntros = document.querySelectorAll('.section-intro');
  if (sectionIntros.length > 0 && 'IntersectionObserver' in window) {
    var introObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var children = entry.target.children;
          for (var i = 0; i < children.length; i++) {
            (function(child, delay) {
              setTimeout(function() {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
              }, delay);
            })(children[i], i * 150);
          }
          introObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    sectionIntros.forEach(function (intro) {
      for (var i = 0; i < intro.children.length; i++) {
        intro.children[i].style.opacity = '0';
        intro.children[i].style.transform = 'translateY(25px)';
        intro.children[i].style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      }
      introObs.observe(intro);
    });
  }

})();
