-- Eseguire su un database dedicato all'ambiente; non condividere produzione e preview.
CREATE TABLE IF NOT EXISTS cms_content (
  id smallint PRIMARY KEY CHECK (id = 1),
  content jsonb NOT NULL,
  revision text NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_sessions (
  token_hash text PRIMARY KEY,
  csrf text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS cms_login_limit (
  id smallint PRIMARY KEY CHECK (id = 1),
  attempts integer NOT NULL,
  reset_at timestamptz NOT NULL
);
