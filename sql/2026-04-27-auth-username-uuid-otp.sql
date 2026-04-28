-- 2026-04-27 — Auth: username + UUID + OTP + user_resource_map
-- Idempotent migration.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────────────
-- USERS: add username, user_uuid, is_verified
-- ────────────────────────────────────────────────────────────────────

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS user_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
  ADD COLUMN IF NOT EXISTS username varchar(30),
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL;

-- Backfill UUIDs for any existing rows that were inserted before the default existed
UPDATE users SET user_uuid = gen_random_uuid() WHERE user_uuid IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_user_uuid_uniq ON users(user_uuid);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uniq ON users(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uniq ON users(email) WHERE email IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────
-- OTP_CODES
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS otp_codes (
  id          serial PRIMARY KEY,
  user_uuid   uuid NOT NULL,
  purpose     text NOT NULL,
  code_hash   text NOT NULL,
  attempts    int NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_codes_user_uuid_idx ON otp_codes(user_uuid);
CREATE INDEX IF NOT EXISTS otp_codes_active_idx ON otp_codes(user_uuid, purpose, consumed_at);

-- ────────────────────────────────────────────────────────────────────
-- USER_RESOURCE_MAP
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_resource_map (
  id            serial PRIMARY KEY,
  user_uuid     uuid NOT NULL,
  resource_type text NOT NULL,
  resource_id   int  NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uniq_user_resource UNIQUE (user_uuid, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS user_resource_map_user_idx ON user_resource_map(user_uuid);
CREATE INDEX IF NOT EXISTS user_resource_map_resource_idx ON user_resource_map(resource_type, resource_id);
