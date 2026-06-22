-- Shared fixed-window counters for Cloudflare Workers. Unlike module memory,
-- D1 counters are visible to every isolate serving the application.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_started_at INTEGER NOT NULL,
  count INTEGER NOT NULL
);

CREATE INDEX idx_rate_limits_window ON rate_limits(window_started_at);
