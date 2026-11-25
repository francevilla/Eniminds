import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import { defaults, revision, validateContent } from './content-store.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
export function neonStore(url, query) {
  if (!url && !query) throw new Error('DATABASE_URL mancante');
  const sql = query || neon(url);
  const initial = JSON.stringify(defaults);
  async function initialize() {
    await sql`INSERT INTO cms_content (id, content, revision) VALUES (1, ${initial}::jsonb, ${revision(defaults)}) ON CONFLICT (id) DO NOTHING`;
  }
  return {
    async read() {
      let rows = await sql`SELECT content FROM cms_content WHERE id = 1`;
      if (!rows.length) { await initialize(); rows = await sql`SELECT content FROM cms_content WHERE id = 1`; }
      return validateContent(rows[0].content);
    },
    async write(content, expectedRevision) {
      validateContent(content);
      await initialize();
      const value=JSON.stringify(content), next=revision(content);
      const rows=await sql`UPDATE cms_content SET content=${value}::jsonb, revision=${next} WHERE id=1 AND revision=${expectedRevision} RETURNING revision`;
      return rows.length ? next : null;
    },
    async getSession(token) {
      if (!/^[0-9a-f]{64}$/.test(token || '')) return null;
      const rows=await sql`SELECT csrf FROM cms_sessions WHERE token_hash=${digest(token)} AND expires_at > now()`;
      return rows[0] || null;
    },
    async createSession(token, csrf) {
      await sql`DELETE FROM cms_sessions WHERE expires_at <= now()`;
      await sql`INSERT INTO cms_sessions (token_hash, csrf, expires_at) VALUES (${digest(token)}, ${csrf}, now() + interval '8 hours')`;
    },
    async deleteSession(token) {
      if (/^[0-9a-f]{64}$/.test(token || '')) await sql`DELETE FROM cms_sessions WHERE token_hash=${digest(token)}`;
    },
    async consumeAttempt() {
      const rows=await sql`INSERT INTO cms_login_limit (id, attempts, reset_at) VALUES (1, 1, now() + interval '15 minutes')
        ON CONFLICT (id) DO UPDATE SET attempts=CASE WHEN cms_login_limit.reset_at <= now() THEN 1 ELSE cms_login_limit.attempts+1 END,
        reset_at=CASE WHEN cms_login_limit.reset_at <= now() THEN now() + interval '15 minutes' ELSE cms_login_limit.reset_at END
        WHERE cms_login_limit.reset_at <= now() OR cms_login_limit.attempts < 15 RETURNING attempts`;
      return rows.length > 0;
    },
    async resetAttempts() { await sql`DELETE FROM cms_login_limit WHERE id=1`; }
  };
}
