import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pw = url.searchParams.get('pw');
  const filename = url.searchParams.get('filename');
  if (pw !== (process.env.ADMIN_PW || 'sex')) return res.status(401).json({ error: 'unauth' });
  if (!filename) return res.status(400).json({ error: 'filename required' });
  try {
    const blob = await put(filename, req, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    res.status(200).json(blob);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
