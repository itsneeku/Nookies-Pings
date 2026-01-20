CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store TEXT NOT NULL,
  method TEXT NOT NULL,
  channel TEXT NOT NULL,
  role TEXT NOT NULL,
  cron TEXT NOT NULL,
  custom TEXT NOT NULL,
  previousResult TEXT, -- for search/new products, stores a set of found SKUs
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE UNIQUE INDEX idx_job_key ON jobs (store, method, custom);

CREATE UNIQUE INDEX idx_jobs_updated_at ON jobs (updated_at);
