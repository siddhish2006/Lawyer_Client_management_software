BEGIN;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS is_processing boolean DEFAULT false;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS processing_started_at timestamp NULL;

COMMIT;
