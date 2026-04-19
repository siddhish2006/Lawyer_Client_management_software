-- Align hearing_logs with the HearingLog entity without dropping the 294
-- legacy rows. The original rows only know their case_id, so hearing_id is
-- left nullable for them; new rows written through the entity will populate
-- it via the FK. case_id is kept as-is so the orphan data remains linkable
-- back to its case.

BEGIN;

ALTER TABLE hearing_logs
  ADD COLUMN IF NOT EXISTS hearing_id integer NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hearing_logs_hearing_id_fkey'
  ) THEN
    ALTER TABLE hearing_logs
      ADD CONSTRAINT hearing_logs_hearing_id_fkey
      FOREIGN KEY (hearing_id) REFERENCES hearings(hearing_id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE hearing_logs
  ALTER COLUMN logged_on TYPE timestamp USING logged_on::timestamp;

ALTER TABLE hearing_logs
  ALTER COLUMN logged_on SET DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_hearing_logs_hearing_id
  ON hearing_logs (hearing_id);

COMMIT;
