// cnfs.racing apex handler.
//
// This Worker owns the apex domain (it holds the Cloudflare-managed
// `AAAA @ 100::` record, which is why that record is read-only in the
// dashboard). It previously served a build pinned in September 2026, so every
// deploy since then landed on Pages without ever reaching visitors.
//
// It is now a transparent pass-through to the live Pages project, so the apex
// always serves the current deployment — including /admin and /api, which the
// pinned version had no knowledge of.
//
// The clean long-term shape is to remove this Worker and attach cnfs.racing to
// the Pages project as a custom domain. That swap needs the dashboard (there is
// no CLI for it, and Pages custom domains cannot be created with a wrangler
// OAuth token), and doing it in the wrong order takes the apex offline in the
// gap. This keeps the domain live in the meantime with no downtime.

const ORIGIN = 'cnfs-website.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const upstream = new URL(url.toString());
    upstream.protocol = 'https:';
    upstream.hostname = ORIGIN;
    upstream.port = '';

    // Preserve method, body, and headers. The Request constructor sets Host
    // from the URL, so the origin sees its own hostname and Pages routes
    // normally.
    const proxied = new Request(upstream.toString(), request);
    proxied.headers.set('X-Forwarded-Host', url.hostname);
    proxied.headers.set('X-Forwarded-Proto', 'https');

    // `manual` so 3xx responses reach the browser unchanged. Following them
    // here would rewrite admin redirects to the origin hostname and drop the
    // visitor onto *.pages.dev mid-session.
    const response = await fetch(proxied, { redirect: 'manual' });

    // Rewrite Location headers that point at the origin back to the apex, so a
    // redirect never moves the visitor off cnfs.racing.
    const location = response.headers.get('Location');
    if (location && location.includes(ORIGIN)) {
      const fixed = new Headers(response.headers);
      fixed.set('Location', location.split(ORIGIN).join(url.hostname));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers: fixed });
    }

    return response;
  }
};
