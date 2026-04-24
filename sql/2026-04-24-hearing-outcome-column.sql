-- Add outcome column to hearings table
-- Lawyers can optionally record what happened after a past hearing.

ALTER TABLE hearings ADD COLUMN IF NOT EXISTS outcome TEXT;
