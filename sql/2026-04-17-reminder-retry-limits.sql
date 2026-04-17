BEGIN;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS retry_count integer DEFAULT 0;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS is_failed boolean DEFAULT false;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS last_retry_at timestamp NULL;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS failed_at timestamp NULL;

COMMIT;
