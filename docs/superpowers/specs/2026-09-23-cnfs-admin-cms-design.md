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
