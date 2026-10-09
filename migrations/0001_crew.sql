-- Apply this migration to your Cloudflare D1 database before enabling /api/crew.
CREATE TABLE IF NOT EXISTS crew_users (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL, display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','cleaner')),
 pin_salt TEXT NOT NULL, pin_hash TEXT NOT NULL,
 failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS crew_sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES crew_users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS crew_jobs (
 id TEXT PRIMARY KEY, company_id TEXT NOT NULL, worker_id TEXT NOT NULL REFERENCES crew_users(id),
 day TEXT NOT NULL, building TEXT NOT NULL, car_plate TEXT NOT NULL,
 parking TEXT NOT NULL, customer_name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','done','delayed','skipped')),
 reason TEXT, updated_at TEXT, updated_by TEXT,
 UNIQUE(company_id,day,car_plate)
);
CREATE INDEX IF NOT EXISTS idx_crew_job_worker_day ON crew_jobs(worker_id,day);
CREATE INDEX IF NOT EXISTS idx_crew_job_company_day ON crew_jobs(company_id,day);
CREATE INDEX IF NOT EXISTS idx_crew_sessions_expiry ON crew_sessions(expires_at);