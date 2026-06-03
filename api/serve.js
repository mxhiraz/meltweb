export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('u');
  if (!url) return new Response('missing u', { status: 400 });
  if (!/\.public\.blob\.vercel-storage\.com\//.test(url)) return new Response('bad url', { status: 400 });
  const r = await fetch(url);
  const ct = r.headers.get('content-type') || 'application/octet-stream';
  return new Response(r.body, {
    status: r.status,
    headers: {
      'content-type': ct,
      'cache-control': 'public, max-age=300',
      'x-frame-options': 'SAMEORIGIN',
    },
  });
}
