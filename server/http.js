// Small wrapper for Vercel-style handlers: POST + JSON in, JSON out.
// Errors the student should see are ApiError (code + plain message).

export class ApiError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

export function handler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: { code: 'method-not-allowed', message: 'Use POST' } });
      return;
    }
    try {
      const body = await readBody(req);
      const result = await fn(body);
      res.status(200).json(result ?? {});
    } catch (e) {
      if (e instanceof ApiError) {
        res.status(e.status).json({ error: { code: e.code, message: e.message, ...e.extra } });
      } else if (e instanceof SyntaxError) {
        res.status(400).json({ error: { code: 'bad-json', message: 'Request body is not valid JSON' } });
      } else {
        console.error(e);
        res.status(500).json({ error: { code: 'internal', message: 'Something went wrong. Try again.' } });
      }
    }
  };
}
