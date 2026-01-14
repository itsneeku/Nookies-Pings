CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store TEXT NOT NULL,
  method TEXT NOT NULL,
  sku TEXT NOT NULL,
  cron TEXT NOT NULL,
  maxPrice REAL,
  channelId TEXT NOT NULL,
  roleId TEXT NOT NULL,
  previousResult TEXT,
  
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE UNIQUE INDEX idx_job_key ON jobs (store, method, sku);

CREATE UNIQUE INDEX idx_jobs_updated_at ON jobs (updated_at);

