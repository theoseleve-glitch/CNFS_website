-- CNFS CMS schema. Single-row `content` holds current state; `versions` is
-- append-only history so every save is reversible (the site publishes instantly
-- with no review step, so revert is the safety net).

CREATE TABLE IF NOT EXISTS content (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  doc        TEXT NOT NULL,
  theme      TEXT NOT NULL,
  globals    TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS versions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  doc        TEXT NOT NULL,
  theme      TEXT NOT NULL,
  globals    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  author     TEXT NOT NULL,
  note       TEXT
);

CREATE TABLE IF NOT EXISTS users (
  email             TEXT PRIMARY KEY,
  pw_hash           TEXT NOT NULL,
  pw_salt           TEXT NOT NULL,
  iterations        INTEGER NOT NULL,
  tokens_valid_from INTEGER NOT NULL,
  disabled          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (ip, ts);
