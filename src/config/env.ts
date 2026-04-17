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

  EMAIL: {
    API_KEY: process.env.EMAIL_API_KEY || "",
    FROM: process.env.EMAIL_FROM || "noreply@lawoffice.com",
  },

  SMS: {
    API_KEY: process.env.SMS_API_KEY || "",
  },

  WHATSAPP: {
    API_KEY: process.env.WHATSAPP_API_KEY || "",
  },

  GUPSHUP: {
    API_KEY: process.env.GUPSHUP_API_KEY || "",
    APP_NAME: process.env.GUPSHUP_APP_NAME || "",
    SOURCE_NUMBER: process.env.GUPSHUP_SOURCE_NUMBER || "",
    API_BASE_URL: process.env.GUPSHUP_API_BASE_URL || "https://api.gupshup.io",
    WEBHOOK_TOKEN: process.env.GUPSHUP_WEBHOOK_TOKEN || "",
  },
};
