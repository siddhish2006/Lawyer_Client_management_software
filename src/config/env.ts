import dotenv from "dotenv";

// Load variables from .env into process.env
dotenv.config();

/**
 * Ensures a required environment variable exists.
 * Fails fast at boot time if missing.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Parse DATABASE_URL into components
 * Format: postgresql://user:password@host:port/database
 */
function parseDatabaseUrl(url: string) {
  // Supports with or without port, with optional query params
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+)(?::(\d+))?\/([^?]+)/);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format. Expected: postgresql://user:password@host[:port]/database");
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4] ? Number(match[4]) : 5432,
    database: match[5],
  };
}

/**
 * Get database configuration
 * Supports both DATABASE_URL and individual env vars
 */
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const parsed = parseDatabaseUrl(databaseUrl);
    return {
      HOST: parsed.host,
      PORT: parsed.port,
      USER: parsed.user,
      PASSWORD: parsed.password,
      NAME: parsed.database,
    };
  }

  // Fallback to individual vars
  return {
    HOST: requireEnv("DB_HOST"),
    PORT: Number(requireEnv("DB_PORT")),
    USER: requireEnv("DB_USER"),
    PASSWORD: requireEnv("DB_PASSWORD"),
    NAME: requireEnv("DB_NAME"),
  };
}

/**
 * Centralized configuration object.
 * No other file should read process.env directly.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),

  DB: getDatabaseConfig(),

  JWT: {
    SECRET: process.env.JWT_SECRET || "chut_ki_train",
    SESSION_TTL: process.env.JWT_SESSION_TTL || "7d",
  },

  OTP: {
    TTL_MINUTES: Number(process.env.OTP_TTL_MINUTES || 10),
    MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS || 5),
    RESEND_COOLDOWN_SECONDS: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 30),
  },

  RESEND: {
    API_KEY: process.env.RESEND_API_KEY || "",
    FROM: process.env.EMAIL_FROM || "noreply@lawoffice.com",
  },

  SMTP: {
    HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    PORT: Number(process.env.SMTP_PORT || 465),
    SECURE: (process.env.SMTP_SECURE || "true") === "true",
    USER: process.env.SMTP_USER || "",
    PASS: process.env.SMTP_PASS || "",
    FROM: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  },

  GUPSHUP: {
    API_KEY: process.env.GUPSHUP_API_KEY || "",
    APP_NAME: process.env.GUPSHUP_APP_NAME || "",
    SOURCE_NUMBER: process.env.GUPSHUP_SOURCE_NUMBER || "",
    API_BASE_URL: process.env.GUPSHUP_API_BASE_URL || "https://api.gupshup.io",
    WEBHOOK_TOKEN: process.env.GUPSHUP_WEBHOOK_TOKEN || "",
  },

  GUPSHUP_SMS: {
    USERID: process.env.GUPSHUP_SMS_USERID || "",
    PASSWORD: process.env.GUPSHUP_SMS_PASSWORD || "",
    SOURCE_MASK: process.env.GUPSHUP_SMS_SOURCE_MASK || "",
    API_BASE_URL:
      process.env.GUPSHUP_SMS_API_BASE_URL ||
      "https://enterprise.smsgupshup.com",
  },
};
