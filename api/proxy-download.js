// Vercel serverless function — fetches a file from a small allow-listed set
// of hosts (Replicate output CDN, Firebase Storage) and streams it back.
// Exists because a browser-side fetch() of those URLs hits CORS (Replicate's
// API host, and Firebase Storage buckets aren't CORS-enabled by default —
// server-to-server requests have no such restriction, so proxying here
// avoids needing any bucket CORS configuration on the Firebase project).
const ALLOWED_HOST_RE = /(^|\.)replicate\.(com|delivery)$|(^|\.)googleapis\.com$/i;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const target = req.query && req.query.url;
  if (!target || typeof target !== 'string') {
    res.status(400).json({ error: 'url query param required' });
    return;
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch (e) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }
  if (parsed.protocol !== 'https:' || !ALLOWED_HOST_RE.test(parsed.hostname)) {
    res.status(403).json({ error: 'host not allowed' });
    return;
  }

  try {
    const upstream = await fetch(target);
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: 'upstream fetch failed' });
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
