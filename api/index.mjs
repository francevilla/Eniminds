import app from '../server/index.mjs';
import { rewrittenUrl } from '../server/rewrite.mjs';

export default function handler(req, res) {
  const url = rewrittenUrl(req.url);
  if (!url) return res.status(404).end();
  req.url = url;
  return app(req, res);
}
