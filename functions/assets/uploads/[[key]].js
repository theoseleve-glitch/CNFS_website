// Serves uploaded images from KV. Public: these appear on the public site.
//
// Keys are content-addressed (the SHA-256 of the bytes), so a given URL can
// never point at different content. That makes an immutable, year-long cache
// header safe — editors replacing an image get a new URL rather than fighting
// a stale cache.

const TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

export async function onRequestGet({ params, env }) {
  if (!env.IMAGES) return new Response('Not found', { status: 404 });

  const parts = Array.isArray(params.key) ? params.key : [params.key];
  const key = parts.filter(Boolean).join('/');

  // Only ever read keys we generated. Nothing here interpolates user input into
  // a wider namespace.
  if (!/^img\/[a-f0-9]{64}\.(jpg|png|webp|gif)$/.test(key)) {
    return new Response('Not found', { status: 404 });
  }

  const object = await env.IMAGES.getWithMetadata(key, { type: 'arrayBuffer' });
  if (!object || !object.value) return new Response('Not found', { status: 404 });

  const ext = key.split('.').pop();
  const type = (object.metadata && object.metadata.type) || TYPES[ext] || 'application/octet-stream';

  return new Response(object.value, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
