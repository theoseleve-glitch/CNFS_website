# CNFS Admin CMS — Design

**Date:** 2026-09-23
**Status:** Approved for planning
**Scope:** A visual admin at `cnfs.racing/admin` that lets a non-developer edit every
piece of site content and the global design tokens, publishing instantly.

---

## 1. Problem

`cnfs.racing` is a static site: 9 HTML pages, ~2,800 lines, with every headline,
paragraph, button label and image path hardcoded inline. `scripts/build.js` copies
`src/` to `dist/` and minifies. There is no data layer, so nothing is editable without
a developer and a deploy.

A teammate needs to edit the site. They are not a developer.

## 2. Goals

1. Edit all site copy, images, links and SEO metadata without touching code.
2. Control the global design: brand colours, fonts, text scale, corner radius,
   shadow depth, spacing scale.
3. Add, remove, reorder, show and hide sections; add and remove pages.
4. Changes go live immediately, with no review step.
5. Authentication that is free, safe, and served from the `cnfs.racing` domain.
6. Every change is reversible.

## 3. Non-goals

Explicitly out of scope. These were considered and declined:

- **Per-element freeform styling** (making one button purple while others stay gold).
  Rejected: an order of magnitude more work, and it lets the site's visual coherence
  be broken permanently by a non-designer.
- **Draft / preview / approval workflow.** Rejected by the user: publishing is instant.
- **Editing structural animation markup.** The split-text hero, the marquee and the
  GSAP scroll sections are presentation mechanics, not content. Their text is
  editable; their DOM structure is not.
- Multi-language content, image resizing/CDN transforms, scheduled publishing.

## 4. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Editing model | Structured content + global design tokens | Real colour/size/shape control without a Webflow-scale build |
| Publishing | Instant, edge-rendered from a database | User requirement; a git-build-deploy cycle is ~90s |
| Auth | Password accounts built into the site | User choice; no dashboard setup required |
| Content store | Cloudflare D1 | Free tier allows ~100k row-writes/day; autosave needs write headroom |
| Image store | Cloudflare KV | Free tier allows 25MB values / 1GB; uploads are write-rare |

Neither store requires a credit card. That is what makes this solution genuinely free.

## 5. Architecture

```
                         cnfs.racing
  +-------------------------------------------------------+
  |                                                       |
  |  visitor ---> functions/[[path]].js                   |
  |                 |-- reads content + theme from D1      |
  |                 |-- renders src/templates/*.js         |
  |                 |-- injects :root token override block |
  |                 +-- edge cache (purged on save)        |
  |                                                       |
  |  editor  ---> /admin  (gated by functions/_middleware) |
  |                 +----------------+------------------+  |
  |                 | iframe:        | design panel     |  |
  |                 | the real page  | colours / fonts  |  |
  |                 | ?edit=1        | radius / shadow  |  |
  |                 | click to type  | spacing / scale  |  |
  |                 +----------------+------------------+  |
  |                 +--> PUT /api/content                  |
  |                        |-- sanitize                    |
  |                        |-- write D1 + snapshot row     |
  |                        +-- purge cache  ---> LIVE      |
  +-------------------------------------------------------+

  D1  : content, theme, versions, users, login_attempts
  KV  : uploaded image blobs (content-addressed)
```

### 5.1 Why the site stops being purely static

Pages currently serves prerendered HTML. To publish instantly without a rebuild, page
HTML must be produced at request time from the database. `scripts/build.js` will
therefore stop emitting `.html` into `dist/` — it emits only `css/`, `js/` and
`assets/`. With no static HTML to shadow it, the `[[path]]` Function handles all page
routes.

Consequence: each uncached page view is a Function invocation. The free tier is
100,000/day; the site's traffic is far below that, and edge caching absorbs most of it.

## 6. Data model

### 6.1 Content document

```json
{
  "schemaVersion": 1,
  "pages": {
    "index": {
      "path": "index.html",
      "title": "CNFS - Centrale Nantes Formula Student",
      "meta": { "description": "...", "ogImage": "assets/images/..." },
      "nav":  { "label": "Home", "order": 1, "visible": true },
      "sections": [
        {
          "id": "hero-1",
          "type": "hero",
          "visible": true,
          "props": {
            "eyebrow": "Season 2025 / 2026",
            "titleLines": ["Centrale Nantes", "Formula Student"],
            "desc": "20 engineering students...",
            "image": "assets/images/event-formula-student-france.jpg",
            "actions": [
              { "label": "The Project", "href": "project.html", "style": "primary" }
            ]
          }
        }
      ]
    }
  }
}
```

Section `type` values are drawn from the section kinds already present in the design
(`hero`, `marquee`, `stats`, `feature-split`, `card-grid`, `cta`, `contact-form`, and
so on). Each type has exactly one template module and one editor field definition.

### 6.1.1 Globals

The header, footer, contact details and social links appear on all 9 pages. They live
once, in a sibling `globals` object, not per page:

```json
{
  "globals": {
    "brand":   { "name": "CNFS", "logo": "assets/images/logo-cnfs.png" },
    "nav":     [ { "label": "The Project", "href": "project.html" } ],
    "footer":  { "tagline": "...", "columns": [ ... ], "legal": "..." },
    "contact": { "email": "contact@cnfs.racing", "phone": "+33783990278",
                 "address": "1 Rue de la Noe, 44300 Nantes" },
    "social":  [ { "platform": "instagram", "href": "..." } ]
  }
}
```

The nav is derived from this list, not from scanning pages, so adding a page and
showing it in the menu remain separate deliberate acts. Deleting a page whose `href`
is still referenced in `globals.nav` is rejected by the API with a message naming the
reference — a dangling nav link is the most likely way a non-developer breaks the site.

The contact block feeds both the contact page and the JSON-LD `SportsTeam` block, so
the structured data cannot drift from the visible details.

### 6.1.2 The 404 page

`404.html` is a page in the document like any other, but it is not listed in `nav` and
cannot be deleted. The renderer serves it with HTTP status 404 for unmatched routes.

### 6.2 Theme document

```json
{
  "colors": { "primary": "#1B2141", "secondary": "#E8A733", "accent": "#2D5BA9" },
  "fonts":  { "heading": "Bebas Neue", "body": "Space Grotesk" },
  "scale":  { "baseSize": "16px", "radius": "8px", "radiusLg": "16px",
              "shadowDepth": "md", "spaceScale": 1.0 }
}
```

**Rendering strategy:** the theme is emitted as a `:root { ... }` override block in a
`<style>` tag placed after the stylesheets. It sets only the tokens the editor has
changed. Every unedited token falls back to the existing `:root` in `style.css`.

This is the single most important implementation decision in the design. It means
adding design control requires no rewrite of the 2,393-line stylesheet, cannot
desynchronise from it, and degrades safely: if the theme row were empty, the site
renders exactly as it does today.

### 6.3 D1 schema

```sql
CREATE TABLE content (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  doc        TEXT NOT NULL,
  theme      TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE versions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  doc        TEXT NOT NULL,
  theme      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  author     TEXT NOT NULL,
  note       TEXT
);

CREATE TABLE users (
  email             TEXT PRIMARY KEY,
  pw_hash           TEXT NOT NULL,
  pw_salt           TEXT NOT NULL,
  iterations        INTEGER NOT NULL,
  tokens_valid_from INTEGER NOT NULL,
  disabled          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);

CREATE TABLE login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX idx_login_attempts ON login_attempts (ip, ts);
```

`content` is a single row holding current state. `versions` is append-only history.

### 6.4 Image storage

Uploads are content-addressed: key `img/<sha256>.<ext>` in the `IMAGES` KV namespace,
served by a Function at `/assets/uploads/<key>` with `immutable` caching — safe,
because the key is the hash of the bytes.

Constraints: 5MB maximum, and only `image/jpeg`, `image/png`, `image/webp`,
`image/gif` are accepted. **SVG upload is rejected**: SVG is an executable document
format and would be a stored XSS vector on our own origin.

## 7. Authentication

Per-person accounts, not one shared password, so an individual can be revoked without
changing everyone else's credentials.

- **Hashing:** PBKDF2-HMAC-SHA256 via Web Crypto, at least 210,000 iterations, 16-byte
  random salt per user. Verification uses constant-time comparison.
- **Session:** stateless signed cookie. Payload `{email, iat, exp}` signed HMAC-SHA256
  with `SESSION_SECRET`. Flags `HttpOnly; Secure; SameSite=Strict; Path=/`. 12h expiry.
- **Revocation:** `users.tokens_valid_from` — sessions issued before that timestamp are
  rejected, giving a working "sign out everywhere" and instant user disable.
- **Rate limiting:** at most 10 failed attempts per IP per 15 minutes, tracked in
  `login_attempts`, enforced before any hashing work is done.
- **CSRF:** `SameSite=Strict` plus a required `X-CNFS-Admin: 1` header on every
  mutating request, which a cross-origin form post cannot set.
- **Gate:** `functions/_middleware.js` protects `/admin/*` and `/api/*`, exempting only
  `/api/auth/login`. Because Pages middleware runs ahead of static asset serving, the
  admin's own HTML, JS and CSS are protected too — not just the API.
- **Secrets:** `SESSION_SECRET` set via `wrangler secret put`. Never committed.

## 8. Content safety

Editable fields are plain text by default and HTML-escaped on render. Fields flagged
as rich text permit a whitelist only: `b`, `i`, `em`, `strong`, `br`, `a[href]`.

Sanitisation happens on write, server side in the API, and escaping happens on render.
Both, not either. `contenteditable` output from a browser cannot be trusted even from
an authenticated user, because that user may paste arbitrary markup.

## 9. Editor UX

`/admin` renders the real page inside an iframe with `?edit=1`. In that mode the
renderer adds `data-edit-id` attributes to editable nodes and includes a small editing
script that:

1. makes those nodes `contenteditable`,
2. shows a hover outline and an image-replace affordance,
3. posts changes to the parent admin window via `postMessage`.

The parent holds the working document, autosaves (debounced) to `PUT /api/content`,
and drives the right-hand panel: colour pickers, font selects, radius, shadow and
spacing sliders. Each applies instantly to the iframe by setting CSS variables on its
document element, so the preview is the real rendering path rather than a mock.

Below the design controls sits a section list for the current page, with
drag-to-reorder, a visibility toggle, delete, "add section" (choosing from existing
section types) and "add page".

A **History** panel lists snapshots with timestamp and author, and restores any of them
in one click. A restore is itself a save, so it too is reversible. With the review step
declined, this panel is the safety net and is not optional.

## 10. File layout

```
src/content/site.json          seed content (extracted from current HTML)
src/content/theme.json         seed tokens (mirrors current :root)
src/templates/*.js             one dependency-free ESM module per section type
src/admin/                     admin SPA (vanilla JS, no build step)
functions/_middleware.js       auth gate
functions/[[path]].js          public page renderer
functions/api/auth/login.js    login / logout
functions/api/content.js       GET / PUT content + theme
functions/api/images.js        upload + serve
functions/api/versions.js      list + restore
migrations/0001_init.sql       D1 schema
scripts/extract.js             one-off HTML to JSON extraction
scripts/seed.js                push seed JSON into D1
scripts/build.js               updated: assets only, no .html
tests/*.test.js                node:test, zero dependencies
wrangler.toml                  D1 + KV bindings
```

Templates are dependency-free ESM so the same modules are imported by both the Node
test harness and the Workers runtime. One renderer, not two — there is no way for the
tested output and the served output to drift.

## 11. Testing

- **Golden-file parity (phase 1, the critical one):** rendering `site.json` through the
  templates must reproduce today's HTML. A normalising, whitespace-insensitive diff
  gates the refactor. If it is not clean, the extraction is wrong.
- **Unit:** PBKDF2 hash and verify; session sign and verify including expiry and
  `tokens_valid_from` revocation; the HTML sanitiser, including hostile input; the
  rate limiter.
- **Integration:** the auth gate returns 401 or a redirect for `/admin` and every
  `/api` route while signed out; content round-trips through D1; a restore reproduces
  a prior document exactly.
- Runner: `node:test`, built in, no new dependencies — matching the project's existing
  zero-dependency posture.

## 12. Build order

Each phase ends deployed and working. The live site never sits broken.

| Phase | Deliverable | Exit criterion |
|---|---|---|
| 1 | Content extracted to JSON; HTML becomes templates | Golden-file diff clean |
| 2 | D1 + KV + Function renderer; build emits assets only | cnfs.racing renders from D1, visually identical |
| 3 | Login, sessions, middleware, rate limiting | `/admin` and `/api` unreachable when signed out |
| 4 | Editor: inline edit, design panel, images, sections, pages, history | Teammate can run the site unaided |

This design is too large for one implementation plan. Each phase gets its own plan,
written when the previous phase has met its exit criterion — so later plans are
informed by what the earlier phases actually turned up rather than by guesses made
now. Planning begins with Phase 1.

## 13. Risks

1. **Phase 1 carries the uncertainty.** Extracting 2,800 lines of bespoke markup is the
   bulk of the work. Mitigated by the golden-file gate, which converts "did I break it?"
   into a mechanical check.
2. **Animation-heavy sections resist structuring.** The hero's per-line span nesting and
   the marquee exist to drive GSAP. These expose their text as fields while keeping
   their DOM fixed, rather than pretending the structure is editable.
3. **Cache staleness versus "instant".** Saves purge the edge cache for affected URLs,
   but Cache API purges are per-datacenter. A short `s-maxage` bounds worst-case
   staleness to seconds. Honest framing: near-instant, not transactionally instant.
4. **Shared publish rights.** Anyone holding a password changes the public site with no
   review. Per-user accounts plus history and revert are the mitigations available
   given the chosen auth model.

## 14. Phase 1 outcomes

Phase 1 is complete: all 9 source pages (`index`, `about`, `formula-student`, `project`,
`partners`, `events`, `news`, `contact`, `404`) render from `src/content/pages/*.json`
through `src/templates/**` with a byte-identical (whitespace-normalised) golden-file
match, gated by `npm run test:golden` (`tests/golden-all.test.js`, one test per page plus
a coverage assertion pinning the list at 9) and the full `npm test` (102 tests, zero
dependencies). This section records what extraction turned up, for Phase 2 to plan from.

### 14.1 Section types and their prop shapes

28 section render functions, registered in `src/templates/sections/index.js` and
dispatched by `renderSection(section, ctx)` on `section.type`. Every prop not listed as
internal (§14.2) is ordinary CMS content.

| Type | Source page(s) | Prop shape (non-internal) |
|---|---|---|
| `about-parallax` | index | `label`, `heading` (string\|string[]), `lead`, `body[]` (raw), `image{src,alt}`, `accent`, `actions[]{href,label}` |
| `about-preview` | about, index, partners | `background`, `label`, `title`, `lead`, `body[]` (raw), `reversed`, `image{src,alt}`, `accent`, `actions[]`, `list{icon,items[]}` (items raw) |
| `car-pinned` | index | `specs[]{value,unit,label}`, `activeIndex` |
| `card-grid` | about, events, formula-student, news, project | `background`, `label`, `title`, `intro`, `cards[]{icon(raw),title,subtitle,text,link{href,label}}`, `cardsCentered`, `iconLarge` |
| `cards-section` | index | `label`, `heading`, `lead`, `cards[]{icon(raw),title,text}`, `cta{href,label}` |
| `contact-grid` | contact | `form{label,title,intro,rows[][]{id,name,type,label,required,placeholder,autocomplete,options[],placeholderOption},submitLabel}`, `info{label,title,items[]{icon,label,value},socialHeading,social[]{platform,href,glyph},map{caption}}` |
| `content-card-split` | partners | `label`, `title`, `body[]`, `cards[]{title,text}` |
| `cta-banner` | index | `heading` (string\|string[]), `text`, `actions[]{href,label,style}` |
| `cta-section` | about, contact, project | `title`, `text`, `threeD`, `actions[]{href,label,style}` (no `href` renders the `aria-disabled` placeholder) |
| `dept-grid` | about | `eyebrow`, `title`, `intro`, `depts[]{title,text}` (no `icon` field — no source instance has one) |
| `error-404` | 404 | `title`, `text`, `actions[]{href,label,style}` |
| `events-list` | events | `label`, `title`, `intro`, `events[]{date{month,day,year},badge{type,label},title,location,text}` |
| `fs-events` | formula-student | `label`, `title`, `intro`, `events[]{number,title,text}` |
| `hero-aw` | index | `titleLines[]{text,emphasis}`, `subtitle`, `actions[]` |
| `map-placeholder` | contact | `caption` |
| `marquee` | index | `items[]` (strings; loop-doubling and the `&bull;` separator are hardcoded) |
| `news-grid` | news | `posts[]{image{src,alt},category,date,title,text}` |
| `org-chart` | about | `eyebrow`, `title`, `intro`, `levels[][]{name,role}`, `advisor` (president badge is derived from position — first member of first level — not stored) |
| `page-header` | all inner pages | `breadcrumb[]{href,label}`, `title` |
| `s-intro` | index (helper, also standalone-registered) | `label`, `heading` (string\|string[]), `lead` |
| `specs-grid` | about, project, formula-student | `background`, `label`, `intro`, `title`, `specs[]{value,unit,label}`, `outro` |
| `sponsor-grid` | index, partners (helper, also standalone-registered) | `label`, `threeD`, `slots[]` (falsy = placeholder; placeholder icon via `placeholderGlyph` raw) |
| `sponsors-section` | index, partners | `label`, `heading`, `lead`, `tiers[]{label,slots[]}`, `cta` |
| `stats-aw` | index | `items[]{count,prefix,suffix,label}` |
| `table-scroll` | project | `background`, `label`, `title`, `intro`, `rows[][]`, `total[]` (first column always `<strong>`, last column always `text-right`) |
| `timeline` | index, project (helper, also standalone-registered) | `threeD`, `items[]{date,title,text}` |
| `timeline-roadmap` | project | `label`, `title`, `timelineItems[]`, `cards[]{icon(raw),stacked,title,text}` |
| `timeline-split` | index | `label`, `heading`, `lead`, `timelineItems[]`, `cards[]{icon(raw),stacked,title,text}` |

Outside the section registry, `src/templates/document.js` (page shell: head, meta, favicon,
theme vars) and `src/templates/globals/{header,footer}.js` (nav/footer chrome, driven by
`globals.json`, with per-page override via `page.globalsOverride`, merged one level deep)
round out the template surface. `page.js` composes skip-link + header + `<main>` of
sections + footer + back-to-top from page-level flags (`skipLink`, `footer`, `backToTop`,
`headerVariant`, `mainStyle`, `transparentHeader`, `magneticCta`, `preloader` — all
default to the 8-page behaviour when omitted, so 404 is the only page setting them).

### 14.2 Internal vs content props

A prop name prefixed with `_` (Ruling 29) is internal bug-compatibility or structural
plumbing, not content, and MUST be skipped by Phase 4's field-definition generator when
building an editor form. Full list at end of Phase 1:

- `card-grid` / `events-list`: `_brokenHeader` — carries the `data-scroll-3d` value for
  the malformed wrapper tag (§14.3).
- `contact-grid`: `_formScroll3d`, `_infoScroll3d` — the two-column version of the same
  malformed wrapper; `form._action`, `form._method`, `form._hidden[]{name,value}`,
  `form._honeypot{name}` — the Formsubmit.co endpoint wiring.

The distinction exists because these values are either (a) reproducing a typo in the
immutable source markup that a non-developer must never be invited to "fix" by hand
(doing so would just change which typo ships), or (b) wiring for the site's only working
inbound contact channel, where a well-meaning content edit (renaming the honeypot field,
dropping a hidden input, editing the action URL) would silently break form delivery with
no visible symptom on the rendered page. Every underscore-prefixed value is still escaped
exactly like ordinary content (`attrEsc`/`esc`, Ruling 28) — "internal" describes who is
allowed to edit it, not how much the render path trusts it.

### 14.3 Markup that resisted structuring

- **The malformed `<div " data-scroll-3d="...">` wrapper.** 10 occurrences across 5 pages
  (contact ×2, events ×3 — one via `card-grid`'s `_brokenHeader`, two via `events-list`'s
  `_brokenHeader`, formula-student ×1 via `card-grid`, partners ×2 hardcoded in
  `content-card-split`, project ×2 hardcoded in `timeline-roadmap`) share one root cause:
  a stray `"` immediately after `<div`, with no class attribute — evidently a leftover
  from a removed class binding, never a real quoted attribute. Phase 1 treats it as
  bug-compatibility (reproduce, don't repair): where the value varies per instance
  (card-grid, events-list, contact-grid) it is an underscore-prefixed internal prop;
  where it never varies within a component (timeline-roadmap, content-card-split, both
  always `rotate-left`/`rotate-right`) it is hardcoded, not even a prop. **Phase 2 should
  fix the typo at the source** (repair the malformed tag into a normal
  `<div data-scroll-3d="...">`, or `<div class="..." data-scroll-3d="...">` if a class
  was in fact intended) — once fixed, `_brokenHeader`, `_formScroll3d`, and
  `_infoScroll3d` can be deleted and the golden tests updated to match the corrected
  markup instead of the current byte-for-byte reproduction of the bug.
- **GSAP-driven structural markup.** `hero-aw`'s per-line `<span class="line"><span
  class="line-inner">` nesting, `marquee`'s doubled item list plus literal `&bull;`
  separator, and `car-pinned`'s pinned-scroll wrapper/progress-dot markup all exist to
  give GSAP ScrollTrigger something to animate. These are kept as fixed template
  structure (hardcoded, not props) with only the underlying text/values exposed as
  content — an editor can change the words but not restructure the animation DOM.
- **The contact form's Formsubmit.co wiring** (§14.2) resisted structuring in the
  opposite direction: it isn't presentation, it's the site's only live inbound channel,
  so it had to become data (for the golden diff to reproduce it) while being fenced off
  from the content surface entirely via the `_`-prefix convention.

### 14.4 Fields rendered with `raw()` — write-side sanitisation required before Phase 3

`raw()` performs no escaping; Ruling 3 caps it at exactly 14 call sites, all pre-existing
(Phase 1 added none — `error-404` and `contact-grid` reproduce their instances without a
new raw() exemption). Any of these fields that become CMS-editable in Phase 3/4 MUST be
sanitised on write against an allowlist (spec §8) before that happens — today they are
safe only because they are dev-authored, not user-submitted:

| Site | Field |
|---|---|
| `document.js` | `head.fontHref` (Google Fonts URL, inside a `<link href>` attribute) |
| `document.js` | `head.jsonLd` (verbatim JSON-LD script body) |
| `globals/footer.js` (×2) | `social[].glyph` (linked and disabled-placeholder branches) |
| `globals/footer.js` (×2) | `footer.bottom.copyright`, `footer.bottom.credit` |
| `about-parallax.js` | `body[]` (rich-text paragraphs, carries inline `<strong>`) |
| `about-preview.js` (×2) | `body[]` (rich-text paragraphs); `list.items[]` (rich-text list entries) |
| `card-grid.js` | `cards[].icon` |
| `cards-section.js` | `cards[].icon` |
| `sponsor-grid.js` | placeholder-slot icon glyph |
| `timeline-split.js` | `cards[].icon` |

The two footer `bottom` fields and the icon/glyph fields are raw() because they carry
complete HTML character references (`&copy;`, `&#9737;`) or (for `credit`) a literal
inline `<a>` tag, not because they need arbitrary markup support — a narrower
purpose-built escaper (decode-known-entities-only, or a single-anchor template) could
replace `raw()` for those without loosening the surface. `about-parallax.body[]` and
`about-preview.body[]`/`list.items[]` are the genuine rich-text fields and are the ones
spec §8's write-side HTML sanitiser whitelist is actually for.
