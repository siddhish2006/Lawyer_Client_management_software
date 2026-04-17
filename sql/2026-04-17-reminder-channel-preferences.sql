BEGIN;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS notification_channels text[] NULL;

COMMIT;
