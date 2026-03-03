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
 * Centralized configuration object.
 * No other file should read process.env directly.
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 3000),

  DB: {
    HOST: requireEnv("DB_HOST"),
    PORT: Number(requireEnv("DB_PORT")),
    USER: requireEnv("DB_USER"),
    PASSWORD: requireEnv("DB_PASSWORD"),
    NAME: requireEnv("DB_NAME"),
  },

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
};
