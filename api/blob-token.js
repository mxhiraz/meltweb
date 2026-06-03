import { handleUpload } from '@vercel/blob/client';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req, res) {
  // Auth via query param — Vercel Blob client SDK doesn't forward custom headers
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pw = url.searchParams.get('pw');
  if (pw !== (process.env.ADMIN_PW || 'sex')) return res.status(401).json({ error: 'unauth' });
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => ({
        allowedContentTypes: ['*/*'],
        maximumSizeInBytes: 100 * 1024 * 1024,
        addRandomSuffix: false,
        tokenPayload: clientPayload || JSON.stringify({ pathname }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('blob uploaded:', blob.url);
      },
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
