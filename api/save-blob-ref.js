export default async function handler(req, res) {
  if (req.headers['x-admin-pw'] !== (process.env.ADMIN_PW || 'sex')) return res.status(401).json({ error: 'unauth' });
  if (req.method !== 'POST') return res.status(405).end();
  const { path, blobUrl } = req.body || {};
  if (!path || !blobUrl) return res.status(400).json({ error: 'path + blobUrl required' });
  const REPO = process.env.GH_REPO || 'mxhiraz/meltweb';
  const TOKEN = process.env.GH_TOKEN;
  // tiny HTML stub that redirects to actual blob content
  const stub = `<!doctype html><meta http-equiv="refresh" content="0;url=${blobUrl}"><script>location.replace("${blobUrl}")</script><a href="${blobUrl}">View content</a>`;
  // also save side-car .blob.json so admin knows the actual URL
  const sidecar = path + '.blob.json';
  const sidecarBody = JSON.stringify({ blob_url: blobUrl, original_path: path }, null, 2);
  // get sha if exists
  async function getSha(p) {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${p}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!r.ok) return undefined;
    return (await r.json()).sha;
  }
  const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
  // write stub
  const sha1 = await getSha(path);
  const r1 = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT', headers: H,
    body: JSON.stringify({ message: `admin: upload large file ${path} (via Vercel Blob)`, content: Buffer.from(stub).toString('base64'), sha: sha1, branch: 'main' })
  });
  if (!r1.ok) return res.status(500).json({ error: 'stub commit failed', detail: await r1.text() });
  // write sidecar
  const sha2 = await getSha(sidecar);
  await fetch(`https://api.github.com/repos/${REPO}/contents/${sidecar}`, {
    method: 'PUT', headers: H,
    body: JSON.stringify({ message: `admin: blob ref for ${path}`, content: Buffer.from(sidecarBody).toString('base64'), sha: sha2, branch: 'main' })
  });
  res.json({ ok: true });
}
