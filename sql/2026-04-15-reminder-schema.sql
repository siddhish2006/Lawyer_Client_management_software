BEGIN;

-- --------------------------------------------
-- reminders: reshape the existing scheduler table
-- --------------------------------------------
ALTER TABLE reminders
  RENAME COLUMN id TO reminder_id;

ALTER TABLE reminders
  ALTER COLUMN reminder_date TYPE timestamp
  USING reminder_date::timestamp;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS is_sent boolean DEFAULT false;

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE reminders
  DROP COLUMN IF EXISTS type;

ALTER TABLE reminders
  DROP COLUMN IF EXISTS sent;

ALTER TABLE reminders
  ALTER COLUMN hearing_id SET NOT NULL,
  ALTER COLUMN reminder_date SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reminders_hearing_id_key'
  ) THEN
    ALTER TABLE reminders
      ADD CONSTRAINT reminders_hearing_id_key UNIQUE (hearing_id);
  END IF;
END $$;

ALTER TABLE reminders
  DROP CONSTRAINT IF EXISTS reminders_hearing_fkey;

ALTER TABLE reminders
  ADD CONSTRAINT reminders_hearing_fkey
  FOREIGN KEY (hearing_id)
  REFERENCES hearings(hearing_id)
  ON DELETE CASCADE;

-- --------------------------------------------
-- reminder_logs: create delivery audit table
-- --------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'reminder_logs_channel_enum'
  ) THEN
    CREATE TYPE reminder_logs_channel_enum AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'reminder_logs_status_enum'
  ) THEN
    CREATE TYPE reminder_logs_status_enum AS ENUM ('PENDING', 'SENT', 'FAILED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS reminder_logs (
  log_id serial PRIMARY KEY,
  hearing_id int NOT NULL,
  client_id int NOT NULL,
  channel reminder_logs_channel_enum NOT NULL,
  status reminder_logs_status_enum NOT NULL,
  error_message text NULL,
  sent_at timestamp NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reminder_logs_hearing_fkey
    FOREIGN KEY (hearing_id)
    REFERENCES hearings(hearing_id)
    ON DELETE CASCADE,
  CONSTRAINT reminder_logs_client_fkey
    FOREIGN KEY (client_id)
    REFERENCES clients(client_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_hearing_id
  ON reminder_logs (hearing_id);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_client_id
  ON reminder_logs (client_id);

-- --------------------------------------------
-- hearing_logs: align to hearing-based history
-- --------------------------------------------
ALTER TABLE hearing_logs
  DROP CONSTRAINT IF EXISTS hearing_logs_case_id_fkey;

ALTER TABLE hearing_logs
  DROP COLUMN IF EXISTS case_id;

ALTER TABLE hearing_logs
  ADD COLUMN IF NOT EXISTS hearing_id int;

ALTER TABLE hearing_logs
  ALTER COLUMN hearing_date SET NOT NULL;

ALTER TABLE hearing_logs
  ALTER COLUMN logged_on TYPE timestamp
  USING logged_on::timestamp;

ALTER TABLE hearing_logs
  ALTER COLUMN logged_on SET DEFAULT CURRENT_TIMESTAMP;

UPDATE hearing_logs
SET logged_on = CURRENT_TIMESTAMP
WHERE logged_on IS NULL;

ALTER TABLE hearing_logs
  ALTER COLUMN hearing_id SET NOT NULL;

ALTER TABLE hearing_logs
  DROP CONSTRAINT IF EXISTS hearing_logs_hearing_id_fkey;

ALTER TABLE hearing_logs
  ADD CONSTRAINT hearing_logs_hearing_id_fkey
  FOREIGN KEY (hearing_id)
  REFERENCES hearings(hearing_id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_hearing_logs_hearing_id
  ON hearing_logs (hearing_id);

COMMIT;
