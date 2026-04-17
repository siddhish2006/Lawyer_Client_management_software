ALTER TABLE reminder_logs
  ADD COLUMN IF NOT EXISTS provider_name TEXT NULL;

ALTER TABLE reminder_logs
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT NULL;

ALTER TABLE reminder_logs
  ADD COLUMN IF NOT EXISTS provider_event_type TEXT NULL;

ALTER TABLE reminder_logs
  ADD COLUMN IF NOT EXISTS provider_last_event_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_reminder_logs_provider_message_id
  ON reminder_logs(provider_message_id);
