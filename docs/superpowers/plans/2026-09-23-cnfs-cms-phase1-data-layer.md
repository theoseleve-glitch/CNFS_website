# CNFS CMS Phase 1 — Content Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract all content from the 9 hardcoded HTML pages into structured JSON and turn the HTML into dependency-free ESM template modules, proving via a golden-file diff that the rendered output still matches today's site exactly.

**Architecture:** Each page becomes a list of typed sections with props. Template modules render a section type to an HTML string. A document shell renders head, chrome and scripts around them. A normalising diff compares rendered output against the current `src/*.html` files; the refactor is correct when that diff is empty for all 9 pages.

**Tech Stack:** Vanilla ESM JavaScript, no runtime dependencies. `node:test` + `node:assert` as the test runner (built into Node, no install). Templates must be importable unchanged by both Node and the Cloudflare Workers runtime in Phase 2.

**Spec:** `docs/superpowers/specs/2026-09-23-cnfs-admin-cms-design.md`

## Global Constraints

- **Zero new dependencies.** No npm installs. `package.json` currently has no `dependencies` or `devDependencies` and must still have none when Phase 1 ends.
- **Templates are dependency-free ESM.** No Node built-ins (`fs`, `path`, `url`) inside `src/templates/**`. They are imported by the Workers runtime in Phase 2, where those modules do not exist. Only `scripts/**` and `tests/**` may use Node built-ins.
- **Files stay under 500 lines** (CLAUDE.md).
- **Nothing is written to the repository root.** Source in `src/`, tests in `tests/`, scripts in `scripts/`, docs in `docs/`.
- **Phase 1 changes no deploy behaviour.** `scripts/build.js` is not modified and `dist/` output is unchanged. Nothing in this plan is deployed to `cnfs.racing`. The site keeps shipping from the existing static HTML until Phase 2 replaces it.
- **All output is escaped on render.** No template interpolates a content value into HTML without passing it through `esc()` or `attrEsc()`.
- Encoding is UTF-8 throughout. The content contains French text with accents and apostrophes (`Préparer l'avenir`).

## Review Focus

Input classes the spec implies but which no task's happy path exercises. Each has a test assigned to the task that owns the code.

1. **Pre-existing HTML entities** (`&copy;`, `&#9737;`, `&bull;`, `&amp;`) appear throughout the source. Extraction must not decode them and rendering must not double-escape them into `&amp;copy;`. — Task 2 and Task 6.
2. **Accented and apostrophised French copy** (`Préparer l'avenir`) must survive the extract-then-render round trip byte-for-byte, including in attributes. — Task 2 and Task 6.
3. **Text placed into attributes** (`alt`, `aria-label`, `href`, `content`) needs attribute-context escaping. A double quote in an editable field must not be able to break out of the attribute and inject a new one. — Task 2.
4. **Absent optional props.** Sections legitimately lack an image, an eyebrow or actions. Those must render as omitted markup, never the string `undefined` or an empty `src=""`. — Task 2 and Task 7.
5. **Per-page nav active state.** `main-nav__link--active` sits on a different link on each page, and no link is active on 404. Active state must be computed from the page being rendered, not baked into the nav data. — Task 5.

---

### Task 1: Golden-file test harness

The parity gate that every later task depends on. Nothing can be verified before this exists.

**Files:**
- Create: `tests/helpers/normalize.js`
- Create: `tests/helpers/golden.js`
- Create: `tests/normalize.test.js`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `normalizeHtml(html: string) => string`
  - `compareToGolden(pageFile: string, rendered: string) => {ok: boolean, message: string}` where `pageFile` is a filename such as `'index.html'`, resolved against `src/`.

- [ ] **Step 1: Write the failing test**

Create `tests/normalize.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHtml } from './helpers/normalize.js';

test('collapses whitespace between tags', () => {
  assert.equal(
    normalizeHtml('<div>\n  <p>hi</p>\n</div>'),
    '<div><p>hi</p></div>'
  );
});

test('collapses runs of whitespace inside text to one space', () => {
  assert.equal(normalizeHtml('<p>a   b\n\tc</p>'), '<p>a b c</p>');
});

test('strips HTML comments', () => {
  assert.equal(normalizeHtml('<div><!-- note --><p>x</p></div>'), '<div><p>x</p></div>');
});

test('preserves entities without decoding them', () => {
  assert.equal(normalizeHtml('<p>&copy; &#9737;</p>'), '<p>&copy; &#9737;</p>');
});

test('preserves accented characters', () => {
  assert.equal(normalizeHtml("<p>Préparer l'avenir</p>"), "<p>Préparer l'avenir</p>");
});

test('treats differing indentation as equal', () => {
  assert.equal(
    normalizeHtml('<ul>\n    <li>a</li>\n</ul>'),
    normalizeHtml('<ul><li>a</li></ul>')
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/normalize.test.js`
Expected: FAIL — `Cannot find module './helpers/normalize.js'`

- [ ] **Step 3: Write minimal implementation**

Create `tests/helpers/normalize.js`:

```js
// Normalises HTML for parity comparison. Ignores differences that do not
// affect rendering: indentation, line breaks, and authoring comments.
// Deliberately does NOT decode entities — a template that emits &amp;copy;
// where the source had &copy; is a real bug and must still fail.
export function normalizeHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')   // authoring comments
    .replace(/>\s+</g, '><')           // whitespace between tags
    .replace(/\s+/g, ' ')              // runs of whitespace in text
    .trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/normalize.test.js`
Expected: PASS, 6 tests.

Note: the `<!DOCTYPE html>` declaration is not a comment and is preserved by this implementation. Verify by eye that `normalizeHtml('<!DOCTYPE html><html>')` returns `'<!DOCTYPE html><html>'`.

- [ ] **Step 5: Write the golden comparison helper**

Create `tests/helpers/golden.js`:

```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeHtml } from './normalize.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

// Returns the first differing position with surrounding context, so a failure
// points at the markup rather than dumping two 40KB strings.
export function compareToGolden(pageFile, rendered) {
  const expected = normalizeHtml(readFileSync(join(SRC, pageFile), 'utf8'));
  const actual = normalizeHtml(rendered);
  if (expected === actual) return { ok: true, message: '' };

  let i = 0;
  while (i < expected.length && i < actual.length && expected[i] === actual[i]) i++;
  const from = Math.max(0, i - 120);
  return {
    ok: false,
    message:
      `${pageFile}: first difference at character ${i}\n` +
      `--- context before ---\n${expected.slice(from, i)}\n` +
      `--- expected next ---\n${expected.slice(i, i + 200)}\n` +
      `--- actual next   ---\n${actual.slice(i, i + 200)}\n`
  };
}
```

- [ ] **Step 6: Add the test script**

Modify `package.json`, adding to `scripts`:

```json
"test": "node --test tests/"
```

- [ ] **Step 7: Run the suite**

Run: `npm test`
Expected: PASS, 6 tests, 0 failures.

- [ ] **Step 8: Commit**

```bash
git add tests/helpers/normalize.js tests/helpers/golden.js tests/normalize.test.js package.json
git commit -m "test: add golden-file parity harness for template refactor"
```

---

### Task 2: HTML primitives

Every template depends on these. They own Review Focus items 1, 2, 3 and 4.

**Files:**
- Create: `src/templates/lib/html.js`
- Create: `tests/html.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `esc(value: unknown) => string` — escapes for text context; returns `''` for `null`/`undefined`.
  - `attrEsc(value: unknown) => string` — escapes for double-quoted attribute context.
  - `attr(name: string, value: unknown) => string` — renders ` name="value"`, or `''` when the value is `null`/`undefined`/`''`.
  - `raw(value: unknown) => string` — passes a pre-sanitised string through untouched.
  - `cls(...parts) => string` — joins truthy class names with a single space.
  - `each(list, fn) => string` — maps a possibly-`undefined` list to concatenated HTML.

- [ ] **Step 1: Write the failing test**

Create `tests/html.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esc, attrEsc, attr, raw, cls, each } from '../src/templates/lib/html.js';

test('esc escapes the five HTML-significant characters', () => {
  assert.equal(esc('<a> & "b" \'c\''), '&lt;a&gt; &amp; &quot;b&quot; &#39;c&#39;');
});

test('esc returns empty string for null and undefined', () => {
  assert.equal(esc(null), '');
  assert.equal(esc(undefined), '');
});

test('esc leaves accented characters alone', () => {
  assert.equal(esc("Préparer l'avenir"), 'Préparer l&#39;avenir');
});

test('attrEsc prevents breaking out of a double-quoted attribute', () => {
  assert.equal(attrEsc('x" onerror="alert(1)'), 'x&quot; onerror=&quot;alert(1)');
});

test('attr omits the attribute entirely when the value is absent', () => {
  assert.equal(attr('src', undefined), '');
  assert.equal(attr('src', null), '');
  assert.equal(attr('src', ''), '');
  assert.equal(attr('src', 'a.jpg'), ' src="a.jpg"');
});

test('raw passes pre-sanitised markup through unchanged', () => {
  assert.equal(raw('&copy; 2026'), '&copy; 2026');
  assert.equal(raw(undefined), '');
});

test('cls drops falsy parts and joins with one space', () => {
  assert.equal(cls('btn', false && 'x', null, 'btn--lg'), 'btn btn--lg');
});

test('each tolerates an absent list', () => {
  assert.equal(each(undefined, (x) => `<li>${x}</li>`), '');
  assert.equal(each(['a', 'b'], (x) => `<li>${x}</li>`), '<li>a</li><li>b</li>');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/html.test.js`
Expected: FAIL — `Cannot find module '../src/templates/lib/html.js'`

- [ ] **Step 3: Write minimal implementation**

Create `src/templates/lib/html.js`:

```js
// HTML string primitives. No Node built-ins: this module is imported by the
// Cloudflare Workers runtime in Phase 2.

const TEXT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => TEXT[c]);
}

export function attrEsc(value) {
  return esc(value);
}

export function attr(name, value) {
  if (value === null || value === undefined || value === '') return '';
  return ` ${name}="${attrEsc(value)}"`;
}

// For content that is already valid HTML — entity literals carried over from
// the original markup, and rich-text fields sanitised server-side in Phase 3.
export function raw(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function cls(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function each(list, fn) {
  if (!list) return '';
  return list.map(fn).join('');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/html.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/templates/lib/html.js tests/html.test.js
git commit -m "feat: add HTML escaping primitives for templates"
```

**Note for later tasks — this decides how entities are handled.** The existing markup contains literal entities (`&copy;`, `&#9737;`, `&bull;`, `&amp;`). Extraction stores those fields verbatim, entities intact, and the template renders them with `raw()`, not `esc()`. Fields that hold plain prose use `esc()`. When you extract a field, decide which of the two it is and record it: any field containing `&` needs `raw()`, everything else needs `esc()`. Getting this wrong shows up immediately as `&amp;copy;` in the golden diff.

---

### Task 3: Theme token renderer

**Files:**
- Create: `src/templates/lib/theme.js`
- Create: `src/content/theme.json`
- Create: `scripts/extract-theme.js`
- Create: `tests/theme.test.js`

**Interfaces:**
- Consumes: `esc` from `src/templates/lib/html.js`.
- Produces: `renderThemeVars(theme: object) => string` — returns `''` when there are no overrides, otherwise a `<style>` block.

**Why this shape:** the spec (§6.2) renders the theme as a `:root` override block placed after the stylesheets, so unedited tokens fall back to `style.css`. For Phase 1 parity this matters enormously: the seed theme has **no overrides**, so the block must render as the empty string and the output HTML must be byte-identical to today's. A theme file that eagerly restated every current value would inject a `<style>` block and fail every golden test.

Accordingly `theme.json` has two parts: `defaults`, extracted from the stylesheet purely so the editor UI can show starting values in Phase 4, and `overrides`, which starts empty and is the only part that renders.

- [ ] **Step 1: Write the failing test**

Create `tests/theme.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderThemeVars } from '../src/templates/lib/theme.js';

test('renders nothing when there are no overrides', () => {
  assert.equal(renderThemeVars({ defaults: { colors: { primary: '#1B2141' } }, overrides: {} }), '');
  assert.equal(renderThemeVars({ overrides: {} }), '');
  assert.equal(renderThemeVars({}), '');
  assert.equal(renderThemeVars(undefined), '');
});

test('renders only the overridden tokens', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: '#FF0000' } } });
  assert.equal(out, '<style id="cnfs-theme">:root{--color-primary:#FF0000}</style>');
});

test('maps every supported token group to its CSS custom property', () => {
  const out = renderThemeVars({
    overrides: {
      colors: { secondary: '#000000' },
      fonts: { heading: 'Syne' },
      scale: { radius: '12px' }
    }
  });
  assert.equal(
    out,
    '<style id="cnfs-theme">:root{--color-secondary:#000000;--font-heading:Syne;--border-radius:12px}</style>'
  );
});

test('escapes values so a token cannot terminate the style element', () => {
  const out = renderThemeVars({ overrides: { colors: { primary: '</style><script>x' } } });
  assert.ok(!out.includes('<script>'));
  assert.ok(!out.includes('</style><script>'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/theme.test.js`
Expected: FAIL — `Cannot find module '../src/templates/lib/theme.js'`

- [ ] **Step 3: Write minimal implementation**

Create `src/templates/lib/theme.js`:

```js
import { esc } from './html.js';

// Maps the editable token names to the CSS custom properties already defined
// in src/css/style.css. Only tokens listed here can be overridden.
const TOKEN_MAP = {
  colors: {
    primary: '--color-primary',
    primaryLight: '--color-primary-light',
    secondary: '--color-secondary',
    secondaryLight: '--color-secondary-light',
    accent: '--color-accent',
    accentLight: '--color-accent-light',
    text: '--color-text',
    dark: '--color-dark'
  },
  fonts: {
    heading: '--font-heading',
    body: '--font-body'
  },
  scale: {
    radius: '--border-radius',
    radiusLg: '--border-radius-lg',
    containerMax: '--container-max',
    headerHeight: '--header-height'
  }
};

export function renderThemeVars(theme) {
  const overrides = (theme && theme.overrides) || {};
  const decls = [];

  for (const [group, tokens] of Object.entries(TOKEN_MAP)) {
    const values = overrides[group];
    if (!values) continue;
    for (const [key, cssVar] of Object.entries(tokens)) {
      const value = values[key];
      if (value === undefined || value === null || value === '') continue;
      decls.push(`${cssVar}:${esc(value)}`);
    }
  }

  if (decls.length === 0) return '';
  return `<style id="cnfs-theme">:root{${decls.join(';')}}</style>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/theme.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Extract the defaults from the stylesheet**

Create `scripts/extract-theme.js`:

```js
#!/usr/bin/env node
// One-off: reads the :root block from src/css/style.css and writes the
// editor's starting values into src/content/theme.json. Overrides stay empty.
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'css', 'style.css');
const outPath = path.join(__dirname, '..', 'src', 'content', 'theme.json');

const css = fs.readFileSync(cssPath, 'utf8');
const root = css.match(/:root\s*\{([\s\S]*?)\}/);
if (!root) throw new Error('No :root block found in style.css');

const vars = {};
for (const line of root[1].split('\n')) {
  const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/i);
  if (m) vars[m[1]] = m[2].trim();
}

const theme = {
  defaults: {
    colors: {
      primary: vars['--color-primary'],
      primaryLight: vars['--color-primary-light'],
      secondary: vars['--color-secondary'],
      secondaryLight: vars['--color-secondary-light'],
      accent: vars['--color-accent'],
      accentLight: vars['--color-accent-light'],
      text: vars['--color-text'],
      dark: vars['--color-dark']
    },
    fonts: {
      heading: vars['--font-heading'],
      body: vars['--font-body']
    },
    scale: {
      radius: vars['--border-radius'],
      radiusLg: vars['--border-radius-lg'],
      containerMax: vars['--container-max'],
      headerHeight: vars['--header-height']
    }
  },
  overrides: {}
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(theme, null, 2) + '\n', 'utf8');
console.log('Wrote', outPath);
```

- [ ] **Step 6: Run it and check the output**

Run: `node scripts/extract-theme.js && cat src/content/theme.json`
Expected: `defaults.colors.primary` is `#1B2141`, `defaults.fonts.heading` is `'Bebas Neue', 'Arial Narrow', sans-serif`, and `overrides` is `{}`.

- [ ] **Step 7: Commit**

```bash
git add src/templates/lib/theme.js src/content/theme.json scripts/extract-theme.js tests/theme.test.js
git commit -m "feat: render theme token overrides as a :root style block"
```

---

### Task 4: Document shell

Renders everything outside `<main>`: doctype, head, preloader, chrome slots, scripts.

**Files:**
- Create: `src/templates/document.js`
- Create: `tests/document.test.js`

**Interfaces:**
- Consumes: `esc`, `attr`, `raw` from `lib/html.js`; `renderThemeVars` from `lib/theme.js`.
- Produces: `renderDocument({page, globals, theme, body}) => string` where `page` carries `{path, title, meta:{description, ogTitle, ogDescription, ogImage, themeColor}, head:{preload, stylesheets, fontHref, jsonLd}, scripts:[], bodyClass}` and `body` is the already-rendered `<main>` plus chrome.

**How to build it:** open `src/index.html` and `src/about.html` side by side and diff their `<head>` sections. Everything identical between them is a constant inside the template; everything that differs is a field on `page`. Known differences: `<title>`, `<meta name="description">`, `<link rel="canonical">`, the Open Graph block, the preload link, which stylesheets are included (`index.html` adds `awwwards.css`), the JSON-LD block (index only), and which scripts load.

- [ ] **Step 1: Write the failing test**

Create `tests/document.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDocument } from '../src/templates/document.js';

const page = {
  path: 'about.html',
  title: 'About Us - CNFS',
  meta: { description: 'Who we are.', themeColor: '#0A0C10' },
  head: { stylesheets: ['css/style.css'], fontHref: 'https://fonts.googleapis.com/css2?family=X' },
  scripts: ['js/main.js']
};

test('opens with the doctype and the lang attribute', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '<main></main>' });
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.includes('<html lang="en">'));
});

test('places the title and description from page meta', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(html.includes('<title>About Us - CNFS</title>'));
  assert.ok(html.includes('<meta name="description" content="Who we are.">'));
});

test('omits the Open Graph block when no og fields are present', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(!html.includes('og:title'));
  assert.ok(!html.includes('undefined'));
});

test('omits the JSON-LD block when the page has none', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '' });
  assert.ok(!html.includes('application/ld+json'));
});

test('injects no theme style block when there are no overrides', () => {
  const html = renderDocument({ page, globals: {}, theme: { overrides: {} }, body: '' });
  assert.ok(!html.includes('cnfs-theme'));
});

test('places the body markup inside the body element', () => {
  const html = renderDocument({ page, globals: {}, theme: {}, body: '<main id="x"></main>' });
  assert.ok(html.includes('<main id="x"></main>'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/document.test.js`
Expected: FAIL — `Cannot find module '../src/templates/document.js'`

- [ ] **Step 3: Implement the shell**

Create `src/templates/document.js`. Transcribe the `<head>` from `src/about.html` literally, replacing only the varying parts with interpolation. Structure:

```js
import { esc, attr, raw, each } from './lib/html.js';
import { renderThemeVars } from './lib/theme.js';

export function renderDocument({ page, globals, theme, body }) {
  const m = page.meta || {};
  const h = page.head || {};

  const og = m.ogTitle
    ? `<meta property="og:type" content="website">` +
      `<meta property="og:title" content="${esc(m.ogTitle)}">` +
      `<meta property="og:description" content="${esc(m.ogDescription)}">` +
      `<meta property="og:image" content="${esc(m.ogImage)}">` +
      `<meta property="og:site_name" content="${esc(m.ogSiteName)}">`
    : '';

  const jsonLd = h.jsonLd
    ? `<script type="application/ld+json">${raw(JSON.stringify(h.jsonLd))}</script>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${m.themeColor ? `<meta name="theme-color" content="${esc(m.themeColor)}">` : ''}
<link rel="canonical"${attr('href', page.path)}>
<meta name="description" content="${esc(m.description)}">
<title>${esc(page.title)}</title>
${og}
${each(h.preload, (src) => `<link rel="preload" as="image" href="${esc(src)}">`)}
${h.fontHref ? `<link href="${esc(h.fontHref)}" rel="stylesheet">` : ''}
${each(h.stylesheets, (href) => `<link rel="stylesheet" href="${esc(href)}">`)}
${jsonLd}
${renderThemeVars(theme)}
</head>
<body${attr('class', page.bodyClass)}>
${body}
${each(page.scripts, (src) => `<script src="${esc(src)}" defer></script>`)}
</body>
</html>`;
}
```

Correct the details against the real file as you go — the exact tag order, the favicon data URI, the `hreflang` links, the `preconnect` links and the `<noscript>` block are all present in `src/index.html` and must be reproduced. The unit test above only pins the contract; **Task 8's golden test is what proves the head is right.**

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/document.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/templates/document.js tests/document.test.js
git commit -m "feat: add document shell template"
```

---

### Task 5: Header and navigation

Owns Review Focus item 5.

**Files:**
- Create: `src/templates/globals/header.js`
- Create: `tests/header.test.js`

**Interfaces:**
- Consumes: `esc`, `attr`, `cls`, `each` from `lib/html.js`.
- Produces: `renderHeader({globals, currentPath, transparent}) => string`.

The real markup to reproduce, from `src/about.html` lines 34 onward:

```html
<header class="site-header site-header--transparent" role="banner">
  <div class="container container--wide">
    <a href="index.html" class="site-header__logo" aria-label="CNFS Home">
      <img src="assets/images/logo-cnfs.png" alt="CNFS Logo">
      <div class="site-header__logo-text">
        <span>CNFS</span>
        <span>Formula Student</span>
      </div>
    </a>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
    </button>
    <nav class="main-nav" role="navigation" aria-label="Main navigation">
      <ul class="main-nav__list">
        <li><a href="index.html" class="main-nav__link">Home</a></li>
        <li><a href="about.html" class="main-nav__link main-nav__link--active">About</a></li>
        ...
      </ul>
      <a href="partners.html" class="btn btn--primary btn--sm main-nav__cta">Become a Partner</a>
    </nav>
  </div>
</header>
```

- [ ] **Step 1: Write the failing test**

Create `tests/header.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHeader } from '../src/templates/globals/header.js';

const globals = {
  brand: { name: 'CNFS', tagline: 'Formula Student', logo: 'assets/images/logo-cnfs.png' },
  nav: [
    { label: 'Home', href: 'index.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Contact', href: 'contact.html' }
  ],
  navCta: { label: 'Become a Partner', href: 'partners.html' }
};

test('marks only the current page active', () => {
  const html = renderHeader({ globals, currentPath: 'about.html' });
  assert.ok(html.includes('<a href="about.html" class="main-nav__link main-nav__link--active">About</a>'));
  assert.ok(html.includes('<a href="index.html" class="main-nav__link">Home</a>'));
  assert.equal(html.match(/main-nav__link--active/g).length, 1);
});

test('marks nothing active on a page absent from the nav, such as 404', () => {
  const html = renderHeader({ globals, currentPath: '404.html' });
  assert.ok(!html.includes('main-nav__link--active'));
});

test('applies the transparent modifier only when asked', () => {
  assert.ok(renderHeader({ globals, currentPath: 'about.html', transparent: true })
    .includes('class="site-header site-header--transparent"'));
  assert.ok(renderHeader({ globals, currentPath: 'about.html', transparent: false })
    .includes('class="site-header"'));
});

test('renders one list item per nav entry', () => {
  const html = renderHeader({ globals, currentPath: 'about.html' });
  assert.equal(html.match(/<li>/g).length, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/header.test.js`
Expected: FAIL — `Cannot find module '../src/templates/globals/header.js'`

- [ ] **Step 3: Implement**

Create `src/templates/globals/header.js`:

```js
import { esc, cls, each } from '../lib/html.js';

export function renderHeader({ globals, currentPath, transparent = true }) {
  const b = globals.brand || {};
  const cta = globals.navCta;

  return `<header class="${cls('site-header', transparent && 'site-header--transparent')}" role="banner">
  <div class="container container--wide">
    <a href="index.html" class="site-header__logo" aria-label="${esc(b.name)} Home">
      <img src="${esc(b.logo)}" alt="${esc(b.name)} Logo">
      <div class="site-header__logo-text">
        <span>${esc(b.name)}</span>
        <span>${esc(b.tagline)}</span>
      </div>
    </a>
    <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
      <span class="nav-toggle__bar"></span>
    </button>
    <nav class="main-nav" role="navigation" aria-label="Main navigation">
      <ul class="main-nav__list">
        ${each(globals.nav, (item) =>
          `<li><a href="${esc(item.href)}" class="${cls('main-nav__link', item.href === currentPath && 'main-nav__link--active')}">${esc(item.label)}</a></li>`
        )}
      </ul>
      ${cta ? `<a href="${esc(cta.href)}" class="btn btn--primary btn--sm main-nav__cta">${esc(cta.label)}</a>` : ''}
    </nav>
  </div>
</header>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/header.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/templates/globals/header.js tests/header.test.js
git commit -m "feat: add header template with per-page nav active state"
```

---

### Task 6: Footer and globals content

Owns Review Focus items 1 and 2 — the footer is where the entities (`&copy;`, `&#9737;`, `&#9654;`) and the accented French copy (`Préparer l'avenir`) both live.

**Files:**
- Create: `src/templates/globals/footer.js`
- Create: `src/content/globals.json`
- Create: `tests/footer.test.js`

**Interfaces:**
- Consumes: `esc`, `raw`, `each` from `lib/html.js`.
- Produces: `renderFooter({globals}) => string`.

`globals.json` holds the shared chrome named in spec §6.1.1: `brand`, `nav`, `navCta`, `footer.columns`, `footer.brandDesc`, `footer.bottom`, `contact`, `social`.

**Entity decision for this task:** `social[].glyph` holds `&#9737;`, `&#9654;`, `in`, `f`, and `footer.bottom.copyright` holds `&copy; 2026 ...`. Store them **verbatim with entities intact** and render with `raw()`. `footer.brandDesc` holds `Préparer l'avenir, one student at a time.` — real characters, no entities, rendered with `esc()`.

- [ ] **Step 1: Write the failing test**

Create `tests/footer.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFooter } from '../src/templates/globals/footer.js';

const globals = {
  brand: { name: 'CNFS' },
  footer: {
    brandDesc: "Centrale Nantes Formula Student - Préparer l'avenir, one student at a time.",
    columns: [
      { heading: 'Navigation', links: [{ label: 'Home', href: 'index.html' }] },
      { heading: 'Contact', links: [{ label: 'Centrale Nantes' }] }
    ],
    bottom: {
      copyright: '&copy; 2026 Centrale Nantes Formula Student. All rights reserved.',
      credit: 'A student project at <a href="https://www.ec-nantes.fr" class="site-footer__link" target="_blank" rel="noopener">Centrale Nantes</a>'
    }
  },
  social: [
    { platform: 'Instagram', href: 'https://www.instagram.com/cnfsracingteam/', glyph: '&#9737;' },
    { platform: 'Facebook', glyph: 'f' }
  ]
};

test('renders accented copy without mangling it', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('Préparer l&#39;avenir'));
});

test('does not double-escape entities carried over from the source', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('&copy; 2026'));
  assert.ok(!html.includes('&amp;copy;'));
  assert.ok(html.includes('&#9737;'));
  assert.ok(!html.includes('&amp;#9737;'));
});

test('renders a link for social entries with an href and a disabled link without', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('href="https://www.instagram.com/cnfsracingteam/" target="_blank" rel="noopener"'));
  assert.ok(html.includes('<a href="#" role="link" aria-disabled="true" class="social-link" aria-label="Facebook">f</a>'));
});

test('renders a span, not a link, for a column entry with no href', () => {
  const html = renderFooter({ globals });
  assert.ok(html.includes('<span class="site-footer__link">Centrale Nantes</span>'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/footer.test.js`
Expected: FAIL — `Cannot find module '../src/templates/globals/footer.js'`

- [ ] **Step 3: Implement**

Create `src/templates/globals/footer.js`, transcribing the markup printed in Task 6's preamble of this plan and shown in `src/about.html`:

```js
import { esc, raw, each } from '../lib/html.js';

export function renderFooter({ globals }) {
  const f = globals.footer || {};
  return `<footer class="site-footer" role="contentinfo">
  <div class="container container--wide">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <div class="site-footer__brand-name">${esc((globals.brand || {}).name)}</div>
        <p class="site-footer__brand-desc">${esc(f.brandDesc)}</p>
        <div class="social-links">
          ${each(globals.social, (s) => s.href
            ? `<a href="${esc(s.href)}" target="_blank" rel="noopener" class="social-link" aria-label="${esc(s.platform)}">${raw(s.glyph)}</a>`
            : `<a href="#" role="link" aria-disabled="true" class="social-link" aria-label="${esc(s.platform)}">${raw(s.glyph)}</a>`
          )}
        </div>
      </div>
      ${each(f.columns, (col) => `<div>
        <h4 class="site-footer__heading">${esc(col.heading)}</h4>
        <ul class="site-footer__links">
          ${each(col.links, (l) => l.href
            ? `<li><a href="${esc(l.href)}" class="site-footer__link">${esc(l.label)}</a></li>`
            : `<li><span class="site-footer__link">${esc(l.label)}</span></li>`
          )}
        </ul>
      </div>`)}
    </div>
    <div class="site-footer__bottom">
      <span>${raw(f.bottom && f.bottom.copyright)}</span>
      <span>${raw(f.bottom && f.bottom.credit)}</span>
    </div>
  </div>
</footer>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/footer.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Author globals.json**

Create `src/content/globals.json` by reading the header and footer out of `src/about.html`. Fill in `brand`, `nav` (6 entries: Home, About, Formula Student, The Project, Partners, Contact), `navCta`, `footer.brandDesc`, `footer.columns` (Navigation, Get Involved, Contact), `footer.bottom`, `contact` (email `contact@cnfs.racing`, phone `+33783990278`, address `1 Rue de la Noe, 44300 Nantes`) and `social` (4 entries).

- [ ] **Step 6: Verify the globals render against the real page**

Add to `tests/footer.test.js`:

```js
import { readFileSync } from 'node:fs';
import { normalizeHtml } from './helpers/normalize.js';

test('renders the real footer from globals.json byte-identically', () => {
  const real = JSON.parse(readFileSync(new URL('../src/content/globals.json', import.meta.url), 'utf8'));
  const page = readFileSync(new URL('../src/about.html', import.meta.url), 'utf8');
  const expected = normalizeHtml(page.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)[0]);
  assert.equal(normalizeHtml(renderFooter({ globals: real })), expected);
});
```

- [ ] **Step 7: Run and iterate until it passes**

Run: `node --test tests/footer.test.js`
Expected: PASS, 5 tests. If it fails, the assertion prints both strings; fix `globals.json` until they match.

- [ ] **Step 8: Commit**

```bash
git add src/templates/globals/footer.js src/content/globals.json tests/footer.test.js
git commit -m "feat: add footer template and shared globals content"
```

---

### Task 7: Shared section templates

The five section types that appear on more than one page. Owns Review Focus item 4.

**Files:**
- Create: `src/templates/sections/page-header.js`
- Create: `src/templates/sections/cta-section.js`
- Create: `src/templates/sections/card-grid.js`
- Create: `src/templates/sections/about-preview.js`
- Create: `src/templates/sections/specs-grid.js`
- Create: `src/templates/sections/index.js` (the registry)
- Create: `tests/sections-shared.test.js`

**Interfaces:**
- Consumes: `lib/html.js`.
- Produces:
  - Each module exports a single function taking `(props)` and returning an HTML string: `renderPageHeader`, `renderCtaSection`, `renderCardGrid`, `renderAboutPreview`, `renderSpecsGrid`.
  - `src/templates/sections/index.js` exports `SECTIONS`, an object mapping a section `type` string to its render function, and `renderSection(section)` which looks up `section.type`, throws `Error('Unknown section type: ' + type)` if absent, returns `''` when `section.visible === false`, and otherwise returns the rendered markup.

Prop shapes, read off the existing markup:

- `page-header`: `{ breadcrumb: [{label, href}], title }`
- `cta-section`: `{ title, text, actions: [{label, href, style}] }`
- `card-grid`: `{ title, intro, columns, cards: [{icon, title, text}] }`
- `about-preview`: `{ eyebrow, title, body: [paragraph], image, imageAlt, accent: bool, reversed: bool, actions }`
- `specs-grid`: `{ title, specs: [{label, value}] }`

- [ ] **Step 1: Write the failing test**

Create `tests/sections-shared.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSection, SECTIONS } from '../src/templates/sections/index.js';

test('page-header renders breadcrumb and title', () => {
  const html = renderSection({
    type: 'page-header',
    props: { breadcrumb: [{ label: 'Home', href: 'index.html' }, { label: 'About Us' }], title: 'About Us' }
  });
  assert.ok(html.includes('<a href="index.html">Home</a>'));
  assert.ok(html.includes('<span class="page-header__breadcrumb-sep">/</span>'));
  assert.ok(html.includes('<span>About Us</span>'));
  assert.ok(html.includes('<h1 class="page-header__title">About Us</h1>'));
});

test('a hidden section renders nothing', () => {
  assert.equal(renderSection({ type: 'page-header', visible: false, props: { title: 'x' } }), '');
});

test('an unknown section type fails loudly rather than silently', () => {
  assert.throws(() => renderSection({ type: 'nope', props: {} }), /Unknown section type: nope/);
});

test('about-preview omits the image block entirely when there is no image', () => {
  const html = renderSection({ type: 'about-preview', props: { title: 'T', body: ['p'] } });
  assert.ok(!html.includes('undefined'));
  assert.ok(!html.includes('src=""'));
  assert.ok(!html.includes('about-preview__image'));
});

test('cta-section omits the button group when there are no actions', () => {
  const html = renderSection({ type: 'cta-section', props: { title: 'T', text: 'x' } });
  assert.ok(!html.includes('btn-group'));
  assert.ok(!html.includes('undefined'));
});

test('card-grid renders one card per entry and omits absent icons', () => {
  const html = renderSection({
    type: 'card-grid',
    props: { cards: [{ title: 'A', text: 'a', icon: '&#9881;' }, { title: 'B', text: 'b' }] }
  });
  assert.equal(html.match(/class="card"/g).length, 2);
  assert.equal(html.match(/card__icon/g).length, 1);
  assert.ok(html.includes('&#9881;'));
  assert.ok(!html.includes('&amp;#9881;'));
});

test('every registered type is a function', () => {
  for (const [type, fn] of Object.entries(SECTIONS)) {
    assert.equal(typeof fn, 'function', `${type} is not a function`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/sections-shared.test.js`
Expected: FAIL — `Cannot find module '../src/templates/sections/index.js'`

- [ ] **Step 3: Write the registry**

Create `src/templates/sections/index.js`:

```js
import { renderPageHeader } from './page-header.js';
import { renderCtaSection } from './cta-section.js';
import { renderCardGrid } from './card-grid.js';
import { renderAboutPreview } from './about-preview.js';
import { renderSpecsGrid } from './specs-grid.js';

export const SECTIONS = {
  'page-header': renderPageHeader,
  'cta-section': renderCtaSection,
  'card-grid': renderCardGrid,
  'about-preview': renderAboutPreview,
  'specs-grid': renderSpecsGrid
};

export function renderSection(section, ctx = {}) {
  if (section.visible === false) return '';
  const fn = SECTIONS[section.type];
  if (!fn) throw new Error('Unknown section type: ' + section.type);
  return fn(section.props || {}, { ...ctx, section });
}
```

Every section module therefore has the signature `(props, ctx) => string`. Phase 1
templates ignore `ctx`; Phase 4 reads `ctx.mode` from it to emit `data-edit-id`
attributes. Declaring the second parameter now means no template signature has to
change later.

Later tasks add entries to `SECTIONS` as they add section types. Keep the import list and the map alphabetical so merges stay clean.

- [ ] **Step 4: Write the five section modules**

Create each module by copying the corresponding markup out of `src/about.html` (for `page-header`, `cta-section`, `card-grid`, `about-preview`) and `src/project.html` (for `specs-grid`), then replacing content with interpolation. For example, `src/templates/sections/page-header.js`:

```js
import { esc, each } from '../lib/html.js';

export function renderPageHeader(props) {
  const crumbs = props.breadcrumb || [];
  return `<section class="page-header">
  <div class="container">
    <nav class="page-header__breadcrumb" aria-label="Breadcrumb">
      ${crumbs.map((c, i) => {
        const sep = i > 0 ? '<span class="page-header__breadcrumb-sep">/</span>' : '';
        const item = c.href
          ? `<a href="${esc(c.href)}">${esc(c.label)}</a>`
          : `<span>${esc(c.label)}</span>`;
        return sep + item;
      }).join('')}
    </nav>
    <h1 class="page-header__title">${esc(props.title)}</h1>
  </div>
</section>`;
}
```

Apply the same treatment to the other four. The rule for optional props, which the tests above enforce: guard the whole markup block with a truthiness check rather than interpolating a possibly-absent value.

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/sections-shared.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 6: Commit**

```bash
git add src/templates/sections tests/sections-shared.test.js
git commit -m "feat: add shared section templates and section registry"
```

---

### Task 8: index.html parity

The first whole-page proof, and the hardest page: it owns 7 section types nothing else uses.

**Files:**
- Create: `src/templates/sections/hero-aw.js`, `marquee.js`, `s-intro.js`, `stats-aw.js`, `timeline.js`, `car-pinned.js`, `sponsor-grid.js`
- Create: `src/templates/page.js`
- Create: `src/content/pages/index.json`
- Modify: `src/templates/sections/index.js` (register the 7 new types)
- Create: `tests/golden-index.test.js`

**Interfaces:**
- Consumes: `renderDocument`, `renderHeader`, `renderFooter`, `renderSection`, `compareToGolden`.
- Produces: `renderPage({page, globals, theme, mode}) => string` in `src/templates/page.js`, which composes header + `<main>` of sections + footer inside `renderDocument`. `mode` is `'public'` in Phase 1; Phase 4 passes `'edit'` to add `data-edit-id` attributes.

**Structural sections.** `marquee` and `car-pinned` exist to drive GSAP. Per spec §3 their DOM is fixed: expose `marquee.items` (an array of strings) and `car-pinned`'s labels and values as props, and hardcode the wrapper structure in the template. Do not attempt to make their nesting configurable.

- [ ] **Step 1: Write the failing golden test**

Create `tests/golden-index.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../src/templates/page.js';
import { compareToGolden } from './helpers/golden.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('index.html renders identically to the current static file', () => {
  const html = renderPage({
    page: read('../src/content/pages/index.json'),
    globals: read('../src/content/globals.json'),
    theme: read('../src/content/theme.json'),
    mode: 'public'
  });
  const result = compareToGolden('index.html', html);
  assert.ok(result.ok, result.message);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/golden-index.test.js`
Expected: FAIL — `Cannot find module '../src/templates/page.js'`

- [ ] **Step 3: Write the page composer**

Create `src/templates/page.js`:

```js
import { each } from './lib/html.js';
import { renderDocument } from './document.js';
import { renderHeader } from './globals/header.js';
import { renderFooter } from './globals/footer.js';
import { renderSection } from './sections/index.js';

export function renderPage({ page, globals, theme, mode = 'public' }) {
  const body =
    renderHeader({ globals, currentPath: page.path, transparent: page.transparentHeader !== false }) +
    `<main class="site-main" id="main-content" role="main">` +
    each(page.sections, (s) => renderSection(s, { mode })) +
    `</main>` +
    renderFooter({ globals });

  return renderDocument({ page, globals, theme, body });
}
```

- [ ] **Step 4: Extract index.json and write the 7 section templates, iterating against the diff**

Work the loop: run the golden test, read the "first difference at character N" context it prints, fix either the template or `index.json`, run again. Start from the top of the document and work down — the first difference is always the earliest unresolved problem.

Register each new type in `src/templates/sections/index.js` as you create it.

Section props for this page:
- `hero-aw`: `{ eyebrow, titleLines: [string], desc, image, actions: [{label, href, style}], scrollLabel }`
- `marquee`: `{ items: [string] }`
- `s-intro`: `{ label, heading, body }`
- `stats-aw`: `{ items: [{number, label}] }`
- `timeline`: `{ title, items: [{date, title, text}] }`
- `car-pinned`: `{ name, specs: [{label, value}], progress }`
- `sponsor-grid`: `{ title, intro, tiers: [{label, slots: [{name, logo} | null]}] }`

Note the preloader and `.grain` div in `index.html` sit outside `<main>` — put them in the document shell guarded by a page flag (`page.preloader === true`), not in a section.

- [ ] **Step 5: Run the golden test until it passes**

Run: `node --test tests/golden-index.test.js`
Expected: PASS, 1 test.

- [ ] **Step 6: Run the whole suite to confirm nothing regressed**

Run: `npm test`
Expected: PASS, all tests, 0 failures.

- [ ] **Step 7: Commit**

```bash
git add src/templates src/content/pages/index.json tests/golden-index.test.js
git commit -m "feat: extract index.html into content and templates with golden parity"
```

---

### Tasks 9-14: remaining page parity

Each task follows the identical shape as Task 8 for one page: create that page's remaining section templates, register them, extract the page's JSON, and iterate until its golden test passes. They are separate tasks because each is independently reviewable and each can fail on its own.

For each, create `tests/golden-<page>.test.js` with this content, substituting the page name in all three places:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../src/templates/page.js';
import { compareToGolden } from './helpers/golden.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));

test('<PAGE>.html renders identically to the current static file', () => {
  const html = renderPage({
    page: read('../src/content/pages/<PAGE>.json'),
    globals: read('../src/content/globals.json'),
    theme: read('../src/content/theme.json'),
    mode: 'public'
  });
  const result = compareToGolden('<PAGE>.html', html);
  assert.ok(result.ok, result.message);
});
```

Each task's steps are: write the golden test, run it and watch it fail, create the new section templates and page JSON, iterate until the golden test passes, run `npm test`, commit.

### Task 9: about.html

**New section types:** `dept-grid` (`{title, intro, depts: [{icon, name, text}]}`), `org-chart` (`{title, levels: [{role, names: [string]}]}`), `team-grid` (`{title, members: [{name, role, avatar}]}`).
**Reuses:** `page-header`, `about-preview`, `card-grid`, `specs-grid`, `cta-section`.
**Commit:** `feat: extract about.html into content and templates`

### Task 10: project.html

**New section types:** `table-scroll` (`{title, columns: [string], rows: [[string]]}`).
**Reuses:** `page-header`, `about-preview`, `specs-grid`, `card-grid`, `timeline`, `cta-section`.
**Commit:** `feat: extract project.html into content and templates`

### Task 11: formula-student.html

**New section types:** `fs-events` (`{title, intro, events: [{number, name, text}]}`).
**Reuses:** `page-header`, `about-preview`, `specs-grid`, `card-grid`, `cta-section`.
**Commit:** `feat: extract formula-student.html into content and templates`

### Task 12: partners.html

**New section types:** none — this page is a recombination of existing types. If the golden diff shows a structure that no existing template produces, add the template rather than bending an existing one to fit two shapes.
**Reuses:** `page-header`, `about-preview`, `specs-grid`, `card-grid`, `sponsor-grid`, `cta-section`.
**Commit:** `feat: extract partners.html into content and templates`

### Task 13: events.html and news.html

Two pages, one task: both are a page-header plus a single card-list section plus a CTA, and neither introduces shared vocabulary the other needs.
**New section types:** `events-list` (`{title, events: [{date, name, location, text}]}`), `news-grid` (`{title, posts: [{image, date, category, title, excerpt, href}]}`).
**Reuses:** `page-header`, `card-grid`, `cta-section`.
**Create:** both `tests/golden-events.test.js` and `tests/golden-news.test.js`.
**Commit:** `feat: extract events and news pages into content and templates`

### Task 14: contact.html

**New section types:** `contact-grid` (`{title, intro, info: [{icon, label, value, href}], form: {action, method, fields: [{name, label, type, required, rows}], submitLabel}}`), `map-placeholder` (`{caption}`).
**Reuses:** `page-header`, `cta-section`.

**Important:** the form posts to Formsubmit.co (commit `41099ce`). Reproduce its `action`, `method` and every hidden input exactly; a dropped hidden field silently breaks the contact form, and the golden diff is the only thing that will catch it.
**Commit:** `feat: extract contact.html into content and templates`

---

### Task 15: 404 page, full-site gate, and phase closeout

**Files:**
- Create: `src/content/pages/404.json`
- Create: `tests/golden-all.test.js`
- Modify: `package.json` (add `test:golden` script)
- Modify: `docs/superpowers/specs/2026-09-23-cnfs-admin-cms-design.md` (record what extraction revealed)

- [ ] **Step 1: Write the all-pages golden test**

Create `tests/golden-all.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../src/templates/page.js';
import { compareToGolden } from './helpers/golden.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const globals = read('../src/content/globals.json');
const theme = read('../src/content/theme.json');

const PAGES = [
  'index', 'about', 'formula-student', 'project',
  'partners', 'events', 'news', 'contact', '404'
];

for (const name of PAGES) {
  test(`${name}.html matches the static original`, () => {
    const page = read(`../src/content/pages/${name}.json`);
    const result = compareToGolden(`${name}.html`, renderPage({ page, globals, theme, mode: 'public' }));
    assert.ok(result.ok, result.message);
  });
}

test('every page is covered', () => {
  assert.equal(PAGES.length, 9);
});
```

- [ ] **Step 2: Run it and fix 404.html**

Run: `node --test tests/golden-all.test.js`
Expected: 8 pages PASS, `404` FAILS until `src/content/pages/404.json` exists.

`404.html` is small (39 lines) and has no footer and a non-transparent header. Per spec §6.1.2 it carries no nav entry, so `renderHeader` must mark nothing active — the test in Task 5 already pins that behaviour.

- [ ] **Step 3: Run it again**

Run: `node --test tests/golden-all.test.js`
Expected: PASS, 10 tests.

- [ ] **Step 4: Add the gate script**

Modify `package.json`, adding to `scripts`:

```json
"test:golden": "node --test tests/golden-all.test.js"
```

- [ ] **Step 5: Confirm the phase-1 constraint held**

Run: `git diff --stat main -- scripts/build.js package.json` and `npm run build`

Expected: `scripts/build.js` shows no changes; `package.json` shows only added `scripts` entries and still has no `dependencies` or `devDependencies`; the build still emits the 9 HTML files, so the live deploy path is untouched.

- [ ] **Step 6: Run everything**

Run: `npm test`
Expected: PASS, 0 failures, across all test files.

- [ ] **Step 7: Record what extraction taught us**

Append a short "Phase 1 outcomes" section to the spec noting: the final list of section types and their props, any markup that resisted structuring, and anything discovered that should change Phases 2-4. Phase 2's plan is written from this.

- [ ] **Step 8: Commit**

```bash
git add src/content/pages/404.json tests/golden-all.test.js package.json docs/superpowers/specs/2026-09-23-cnfs-admin-cms-design.md
git commit -m "feat: complete phase 1 content extraction with full-site parity gate"
```

---

## Definition of done

- All 9 pages render from JSON through templates with an empty normalised diff against the current static files.
- `npm test` passes with zero dependencies installed.
- `scripts/build.js` and the deploy path are unchanged; `cnfs.racing` is not touched by this phase.
- Section types and their props are documented in the spec, ready for Phase 2 to render them at the edge.
