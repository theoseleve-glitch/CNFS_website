#!/usr/bin/env python3
"""Apply Awwwards-level treatment to all inner pages:
- Replace old CSS chain with style.css + awwwards.css
- Replace old JS chain with main.js + GSAP CDN + gsap-engine.js
- Add preloader, grain, Syne/Outfit fonts
- Update noscript
"""
import os, sys
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'src'))

# New font link
OLD_FONTS = 'family=Barlow+Condensed:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap'
NEW_FONTS = 'family=Outfit:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap'

# New noscript
NEW_NOSCRIPT = '''  <noscript><style>
    *, *::before, *::after { opacity: 1 !important; transform: none !important; transition: none !important; }
    .preloader { display: none !important; }
  </style></noscript>'''

# New scripts block
NEW_SCRIPTS = '''  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script src="js/main.js"></script>
  <script src="js/gsap-engine.js"></script>'''

# Preloader + grain (insert after <body> / skip-link)
PRELOADER = '''  <!-- PRELOADER -->
  <div class="preloader" role="status" aria-label="Loading">
    <div class="preloader__logo">CNFS</div>
    <div class="preloader__bar"><div class="preloader__fill"></div></div>
  </div>
  <div class="grain" aria-hidden="true"></div>'''

for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html') or fname in ('index.html', '404.html'):
        continue

    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # 1. Fonts
    content = content.replace(OLD_FONTS, NEW_FONTS)

    # 2. Replace CSS chain: remove scroll3d.css, premium.css, add awwwards.css
    content = content.replace('\n  <link rel="stylesheet" href="css/scroll3d.css">', '')
    content = content.replace('\n  <link rel="stylesheet" href="css/premium.css">', '')
    if 'awwwards.css' not in content:
        content = content.replace(
            '<link rel="stylesheet" href="css/style.css">',
            '<link rel="stylesheet" href="css/style.css">\n  <link rel="stylesheet" href="css/awwwards.css">'
        )

    # 3. Replace noscript block
    import re
    content = re.sub(
        r'  <noscript>.*?</noscript>',
        NEW_NOSCRIPT,
        content,
        flags=re.DOTALL
    )

    # 4. Replace JS chain
    # Remove old script tags
    content = content.replace('  <script src="js/scroll3d.js"></script>\n', '')
    content = content.replace('  <script src="js/premium.js"></script>\n', '')
    # Replace main.js line with full new block
    if 'gsap-engine.js' not in content:
        content = content.replace(
            '  <script src="js/main.js"></script>',
            NEW_SCRIPTS
        )

    # 5. Add preloader + grain after skip-link
    if 'preloader' not in content:
        content = content.replace(
            '  <a href="#main-content" class="skip-link">Skip to content</a>\n',
            '  <a href="#main-content" class="skip-link">Skip to content</a>\n' + PRELOADER + '\n'
        )

    # 6. Update theme-color
    content = content.replace('content="#1B2141"', 'content="#0A0C10"')

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'{fname}: upgraded')
    else:
        print(f'{fname}: no changes')
