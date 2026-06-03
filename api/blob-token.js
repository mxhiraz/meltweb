import { handleUpload } from '@vercel/blob/client';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req, res) {
  if (req.headers['x-admin-pw'] !== (process.env.ADMIN_PW || 'sex')) return res.status(401).json({ error: 'unauth' });
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => ({
        allowedContentTypes: ['*/*'],
        maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
        addRandomSuffix: false,
        tokenPayload: JSON.stringify({ pathname }),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log('blob uploaded:', blob.url);
      },
    });
    res.status(200).json(json);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
