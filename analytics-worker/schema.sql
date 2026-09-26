CREATE TABLE IF NOT EXISTS visits (
  origin TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  ip TEXT NOT NULL,
  path TEXT NOT NULL,
  first_seen_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  PRIMARY KEY (origin, visit_id)
);

CREATE INDEX IF NOT EXISTS visits_last_seen ON visits(last_seen_at);
