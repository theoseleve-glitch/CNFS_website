// Image upload. Auth-gated by the middleware (every /api/* route is).
//
// Uploads are content-addressed: the key is the SHA-256 of the bytes, so the
// same file uploaded twice costs one copy, and a stored URL can be cached
// forever without a cache-busting query.
//
// SVG is deliberately rejected. It is an executable document format, so an
// uploaded SVG would be a stored XSS vector served from our own origin.

import { json } from '../_lib/store.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif'
};

export async function onRequestPost({ request, env }) {
  if (request.headers.get('X-CNFS-Admin') !== '1') return json({ error: 'Bad request' }, 400);
  if (!env.IMAGES) return json({ error: 'Image storage not configured' }, 500);

  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = ALLOWED[type];
  if (!ext) {
    return json(
      { error: `Unsupported image type "${type || 'unknown'}". Use JPEG, PNG, WebP or GIF — SVG is not accepted because it can carry scripts.` },
      415
    );
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return json({ error: 'Empty upload' }, 400);
  if (bytes.length > MAX_BYTES) {
    return json({ error: `Image is ${(bytes.length / 1048576).toFixed(1)}MB. The limit is 5MB.` }, 413);
  }

  // Verify the bytes really are the type the header claims, so a script cannot
  // be stored under an image content-type and served back.
  if (!looksLike(type, bytes)) {
    return json({ error: 'File contents do not match the declared image type.' }, 415);
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `img/${hash}.${ext}`;

  await env.IMAGES.put(key, bytes, { metadata: { type, size: bytes.length } });

  return json({ ok: true, key, url: `/assets/uploads/${key}`, bytes: bytes.length, type });
}

// Magic-number check. Cheap, and it closes the gap between "the client said
// this is a PNG" and "this is a PNG".
function looksLike(type, b) {
  const starts = (...sig) => sig.every((v, i) => b[i] === v);
  if (type === 'image/png') return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (type === 'image/jpeg') return starts(0xff, 0xd8, 0xff);
  if (type === 'image/gif') return starts(0x47, 0x49, 0x46, 0x38);
  if (type === 'image/webp') return starts(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return false;
}

// Listing, so the admin can offer a picker of what has already been uploaded.
export async function onRequestGet({ env }) {
  if (!env.IMAGES) return json({ images: [] });
  const list = await env.IMAGES.list({ prefix: 'img/', limit: 200 });
  return json({
    images: (list.keys || []).map((k) => ({
      key: k.name,
      url: `/assets/uploads/${k.name}`,
      size: (k.metadata && k.metadata.size) || null,
      type: (k.metadata && k.metadata.type) || null
    }))
  });
}
