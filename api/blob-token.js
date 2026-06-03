import { handleUpload } from '@vercel/blob/client';

export const config = { api: { bodyParser: { sizeLimit: '1mb' } } };

export default async function handler(req, res) {
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryPw = url.searchParams.get('pw');
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Auth: pw via query param (SDK won't forward custom headers, but query+body both reach here)
        let payload = {};
        try { payload = clientPayload ? JSON.parse(clientPayload) : {}; } catch {}
        const pw = queryPw || payload.pw;
        if (pw !== (process.env.ADMIN_PW || 'sex')) throw new Error('unauth');
        if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN env var missing — add it in Vercel project Settings → Environment Variables');
        return {
          // omit allowedContentTypes — SDK rejects '*/*'; absence = allow all
          maximumSizeInBytes: 100 * 1024 * 1024,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('blob upload completed:', blob.url);
      },
    });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}
