#!/usr/bin/env python3
"""Convert remaining old animation classes to 3D equivalents."""
import os, sys, re
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'src'))

# Only replace in HTML content (not inside <noscript> blocks)
# Strategy: replace class values in actual element tags, not in <style> blocks

replacements = [
    # Wrapper divs with fade-in-left/right -> data-scroll-3d
    ('class="fade-in-left">', '" data-scroll-3d="rotate-left">'),
    ('class="fade-in-right">', '" data-scroll-3d="rotate-right">'),
    # Standalone fade-in on divs -> fly-in
    ('class="fade-in">\n          <span class="section-label">', '" data-scroll-3d="tilt-up">\n          <span class="section-label">'),
    # Team members grid: stagger -> grid-decon
    ('class="team-members-grid stagger-children">', 'class="team-members-grid grid-decon">'),
]

for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html'):
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    for old, new in replacements:
        content = content.replace(old, new)

    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'{fname}: converted')
    else:
        print(f'{fname}: no old anims')
