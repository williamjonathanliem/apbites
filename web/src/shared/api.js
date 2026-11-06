// Calls our server functions (/api/*: Vercel in production, Vite middleware in dev).
// Throws ApiCallError with the server's code and plain-English message.

export class ApiCallError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    this.extra = extra;
  }
}

export async function callApi(name, body) {
  let res;
  try {
    res = await fetch(`/api/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  } catch {
    throw new ApiCallError('offline', 'No connection. Check your internet and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const { code = 'internal', message = 'Something went wrong. Try again.', ...extra } = data.error || {};
    throw new ApiCallError(code, message, extra);
  }
  return data;
}
