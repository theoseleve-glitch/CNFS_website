#!/usr/bin/env python3
"""CNFS Content Overhaul — apply all questionnaire answers across every page."""
import os, sys, re
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(os.path.join(os.path.dirname(__file__), '..', 'src'))

# ==========================================================================
# GLOBAL REPLACEMENTS (safe across all pages)
# ==========================================================================
GLOBAL = [
    # Season
    ('Season 2026-2027', 'Season 2025/2026'),
    ('Season 2026–2027', 'Season 2025/2026'),
    ('season 2026-2027', 'season 2025/2026'),
    ('2026-2027 season', '2025/2026 season'),
    ('2026–2027', '2025/2026'),
    ('2026-2027', '2025/2026'),

    # Member count
    ('150+ engineering students', '20 engineering students'),
    ('150+ future engineers', '20 future engineers'),
    ('150+ motivated students', '20 motivated students'),
    ('150+ students', '20 students'),
    ('150+ members', '20 members'),
    ('150+ Members', '20 Members'),
    ('over 150 students', '20 students'),
    ('Over 150 students', '20 students'),
    ('data-count="150"', 'data-count="20"'),

    # Department count
    ('10 Departments', '4 Departments'),
    ('10 departments', '4 departments'),
    ('10 Specialized Departments', '4 Specialized Departments'),
    ('10 specialized departments', '4 specialized departments'),
    ('data-count="10"', 'data-count="4"'),
    ('across 10 specialized', 'across 4 specialized'),

    # Budget
    ('data-count="30"', 'data-count="40"'),
    ('30K€', '40K\u20ac'),

    # Speed
    ('data-count="110"', 'data-count="120"'),
    ('110+ km/h', '120 km/h'),
    ('110+', '120'),
    ('data-suffix=" km/h"', 'data-suffix=" km/h"'),

    # 0-100
    ('4.0s', '3.6s'),
    ('~4.0s', '3.6s'),
    ('4.0<em>s</em>', '3.6<em>s</em>'),

    # Budget amounts
    ('\u20ac25,300', '\u20ac40,000'),
    ('\u20ac25.3K', '\u20ac40K'),
    ('25,300', '40,000'),
    ('\u20ac25.3<em>K</em>', '\u20ac40<em>K</em>'),

    # Domain / email
    ('cnfs-racing.fr', 'cnfs.racing'),

    # Postcode
    ('44321', '44300'),

    # Engine: 600cc -> EMRAX 228 (electric motor)
    ('600cc', 'EMRAX 228'),
    ('600 cc', 'EMRAX 228'),
    ('600<em>cc</em>', 'EMRAX<em> 228</em>'),

    # Tagline
    ('Engineering the future of motorsport', 'Pr\u00e9parer l\'avenir'),

    # Car name
    ('Our First Car', 'Project Falcon'),
    ('Our first car', 'Project Falcon'),

    # Team names (placeholder -> real)
    ('M. Stipa', 'Th\u00e9o Stipa'),
    ('A. Bernard', 'Karl Nuyts'),
    ('C. Laurent', 'Pierre Baccini'),
    ('E. Martin', 'Elwan El-Hafaia'),
    ('>AB<', '>KN<'),  # avatar initials
    ('>CL<', '>PB<'),
    ('>EM<', '>EH<'),

    # President initials
    ('>MS<', '>TS<'),

    # Department heads with real names
    ('T. Dubois', 'Pierre Baccini'),
    ('>TD<', '>PB<'),
    ('L. Robert', 'Alejandro Navarrete'),
    ('>LR<', '>AN<'),

    # Heads we don't have names for — use TBD or remove
    ('N. Petit', 'TBD'),
    ('J. Garcia', 'TBD'),
    ('S. Fournier', 'TBD'),
    ('M. Henry', 'TBD'),
    ('P. Roux', 'TBD'),
    ('A. Bonnet', 'TBD'),
    ('C. Durand', 'Elwan El-Hafaia'),
    ('L. Moreau', 'TBD'),

    # Unknown initials
    ('>NP<', '>--<'),
    ('>JG<', '>--<'),
    ('>SF<', '>--<'),
    ('>MH<', '>--<'),
    ('>PR<', '>--<'),
    ('>CD<', '>EH<'),
    ('>LM<', '>--<'),

    # Faculty advisor
    ('Not listed', 'Simon Poiret'),

    # Instagram
    ('@cnfs_racing', '@cnfsracingteam'),

    # Combustion -> Electric terminology
    ('combustion engine vehicle', 'electric vehicle'),
    ('Combustion Engine Vehicle', 'Electric Vehicle'),
    ('combustion engine car', 'electric race car'),
    ('Combustion Engine', 'Electric Vehicle'),
    ('combustion engine', 'electric motor'),
    ('Combustion engine', 'Electric motor'),
    ('combustion-engine', 'electric'),
    ('combustion car', 'electric car'),
    ('a combustion engine vehicle', 'an electric vehicle'),

    # Engine descriptions
    ('600cc four-stroke motorcycle engine', 'EMRAX 228 electric motor'),
    ('600cc motorcycle engine', 'EMRAX 228 electric motor'),
    ('motorcycle engine', 'electric motor'),
    ('four-stroke', 'electric'),
    ('Engine Displacement', 'Motor Type'),

    # FS France location
    ('Formula Student France', 'Formula Student France (Transpolis)'),

    # Competition dates
    ('July 10, 2027', 'August 2026'),

    # Year references in timeline
    ('Summer 2027', 'Summer 2026'),
]

# ==========================================================================
# APPLY
# ==========================================================================
for fname in sorted(os.listdir('.')):
    if not fname.endswith('.html'):
        continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    for old, new in GLOBAL:
        content = content.replace(old, new)

    changes = sum(1 for a, b in zip(original, content) if a != b) if len(original) == len(content) else abs(len(original) - len(content))
    if content != original:
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'{fname}: updated ({changes} char changes)')
    else:
        print(f'{fname}: no changes')
