#!/usr/bin/env python3
"""Apply 3D scroll classes to all inner pages."""
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'src'))

noscript_3d = """      [data-scroll-3d], .grid-decon > *, .stats-3d .stats-bar__item,
      .specs-3d .spec-card, .timeline-3d .timeline__item,
      .events-3d .event-card, .sponsors-3d .sponsor-slot,
      .org-3d .team-member, .cta-3d > .container {
        opacity: 1 !important;
        transform: none !important;
      }"""

for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html') or fname == 'index.html':
        continue

    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Add scroll3d.css
    if 'scroll3d.css' not in content:
        content = content.replace(
            '<link rel="stylesheet" href="css/style.css">',
            '<link rel="stylesheet" href="css/style.css">\n  <link rel="stylesheet" href="css/scroll3d.css">'
        )

    # 2. Add scroll3d.js
    if 'scroll3d.js' not in content:
        content = content.replace(
            '<script src="js/main.js"></script>',
            '<script src="js/main.js"></script>\n  <script src="js/scroll3d.js"></script>'
        )

    # 3. Expand noscript
    if 'grid-decon' not in content:
        content = content.replace(
            '        transform: none !important;\n      }\n    </style>',
            '        transform: none !important;\n      }\n' + noscript_3d + '\n    </style>'
        )

    # 4. Common replacements across all pages
    reps = [
        ('class="grid grid--3 stagger-children">', 'class="grid grid--3 grid-decon">'),
        ('class="specs-grid stagger-children">', 'class="specs-grid specs-3d">'),
        ('class="text-center fade-in">', 'class="text-center" data-scroll-3d="fly-in">'),
        ('class="cta-section">', 'class="cta-section cta-3d">'),
        ('class="about-preview__image fade-in-left">', 'class="about-preview__image" data-scroll-3d="rotate-left">'),
        ('class="about-preview__image fade-in-right">', 'class="about-preview__image" data-scroll-3d="rotate-right">'),
        ('class="about-preview__content fade-in-left">', 'class="about-preview__content" data-scroll-3d="rotate-left">'),
        ('class="about-preview__content fade-in-right">', 'class="about-preview__content" data-scroll-3d="rotate-right">'),
    ]
    for old, new in reps:
        content = content.replace(old, new)

    # 5. Page-specific
    if fname == 'about.html':
        content = content.replace('class="dept-grid stagger-children">', 'class="dept-grid grid-decon">')
        content = content.replace('class="org-chart fade-in">', 'class="org-chart org-3d">')

    if fname == 'events.html':
        content = content.replace('class="events-list stagger-children">', 'class="events-list events-3d">')

    if fname == 'partners.html':
        content = content.replace('class="sponsor-grid">', 'class="sponsor-grid sponsors-3d">')

    if fname == 'project.html':
        content = content.replace('class="timeline">', 'class="timeline timeline-3d">')
        content = content.replace('class="cost-table fade-in">', 'class="cost-table" data-scroll-3d="tilt-up">')

    if fname == 'formula-student.html':
        content = content.replace('class="fs-events__grid stagger-children">', 'class="fs-events__grid events-3d">')

    if fname == 'news.html':
        content = content.replace('class="news-grid stagger-children">', 'class="news-grid grid-decon">')

    if fname == 'contact.html':
        content = content.replace('class="fade-in-left">', '" data-scroll-3d="rotate-left">')
        content = content.replace('class="fade-in-right">', '" data-scroll-3d="rotate-right">')

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'{fname}: 3D applied')
    else:
        print(f'{fname}: no changes')
