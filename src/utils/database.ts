/**
 * Database Connection Utility
 * ============================
 * Centralized database initialization and connection management
 */

import { DataSource } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { logger } from "./logger";

class DatabaseConnection {
  private static instance: DataSource | null = null;
  private static isInitialized = false;

  /**
   * Initialize Database Connection
   * Handles SSL for Neon
   * Retries on connection failure
   * Validates schema
   */
  static async initialize(retries = 3): Promise<DataSource> {
    if (this.isInitialized && this.instance?.isInitialized) {
      logger.info("Using existing database connection");
      return this.instance;
    }

    let attempt = 0;

    while (attempt < retries) {
      try {
        attempt++;
        logger.info(`Attempting database connection (${attempt}/${retries})...`);

        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }

        this.instance = AppDataSource;
        this.isInitialized = true;

        logger.success("Database connected successfully");

        await this.validateSchema();
        await this.runSchemaPatches();

        return this.instance;
      } catch (error) {
        logger.error(
          `Database connection failed (attempt ${attempt}/${retries}):`,
          error instanceof Error ? error.message : String(error)
        );

        if (attempt === retries) {
          logger.error("All database connection attempts failed");
          throw error;
        }

        const waitTime = Math.pow(2, attempt) * 1000;
        logger.info(`Retrying in ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    throw new Error("Failed to initialize database connection");
  }

  /**
   * Validate Database Schema
   * Checks if all expected tables exist
   */
  private static async validateSchema(): Promise<void> {
    try {
      const queryRunner = AppDataSource.createQueryRunner();

      const requiredTables = [
        "users",
        "clients",
        "client_type_master",
        "cases",
        "case_clients",
        "case_status_master",
        "case_type_master",
        "case_category_master",
        "district_master",
        "court_complex_master",
        "court_name_master",
        "hearings",
        "hearing_logs",
        "opponents",
        "defendants",
        "case_opponents",
        "case_defendants",
        "reminders",
        "reminder_logs",
      ];

      const result: { table_name: string }[] = await queryRunner.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${requiredTables
          .map((tableName) => `'${tableName}'`)
          .join(", ")})`
      );

      const existingTables = result.map((table) => table.table_name);
      const missingTables = requiredTables.filter(
        (tableName) => !existingTables.includes(tableName)
      );

      if (missingTables.length > 0) {
        logger.warn(`Missing tables: ${missingTables.join(", ")}`);
        logger.info("Tip: Ensure database migrations have been run");
      } else {
        logger.success(`All ${requiredTables.length} schema tables validated`);
      }

      await queryRunner.release();
    } catch (error) {
      logger.warn(
        "Could not validate schema:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Idempotent Schema Patches
   * Adds new columns / constraints introduced after the initial schema.
   * Safe to run on every startup.
   */
  private static async runSchemaPatches(): Promise<void> {
    try {
      const queryRunner = AppDataSource.createQueryRunner();

      await queryRunner.query(
        `ALTER TABLE cases ADD COLUMN IF NOT EXISTS title TEXT`
      );

      await queryRunner.query(
        `ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS provider_name TEXT`
      );

      await queryRunner.query(
        `ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS provider_message_id TEXT`
      );

      await queryRunner.query(
        `ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS provider_event_type TEXT`
      );

      await queryRunner.query(
        `ALTER TABLE reminder_logs ADD COLUMN IF NOT EXISTS provider_last_event_at TIMESTAMP NULL`
      );

      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS idx_reminder_logs_provider_message_id ON reminder_logs(provider_message_id)`
      );

      // Auth: username + UUID + verification flag, OTP table, user→resource map
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

      await queryRunner.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_uuid uuid DEFAULT gen_random_uuid() NOT NULL`
      );
      await queryRunner.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS username varchar(30)`
      );
      await queryRunner.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false NOT NULL`
      );
      await queryRunner.query(
        `UPDATE users SET user_uuid = gen_random_uuid() WHERE user_uuid IS NULL`
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS users_user_uuid_uniq ON users(user_uuid)`
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS users_username_uniq ON users(username) WHERE username IS NOT NULL`
      );
      await queryRunner.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS users_email_uniq ON users(email) WHERE email IS NOT NULL`
      );

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id          serial PRIMARY KEY,
          user_uuid   uuid NOT NULL,
          purpose     text NOT NULL,
          code_hash   text NOT NULL,
          attempts    int NOT NULL DEFAULT 0,
          expires_at  timestamptz NOT NULL,
          consumed_at timestamptz,
          created_at  timestamptz NOT NULL DEFAULT now()
        )
      `);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS otp_codes_user_uuid_idx ON otp_codes(user_uuid)`
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS otp_codes_active_idx ON otp_codes(user_uuid, purpose, consumed_at)`
      );

      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS user_resource_map (
          id            serial PRIMARY KEY,
          user_uuid     uuid NOT NULL,
          resource_type text NOT NULL,
          resource_id   int  NOT NULL,
          created_at    timestamptz NOT NULL DEFAULT now(),
          CONSTRAINT uniq_user_resource UNIQUE (user_uuid, resource_type, resource_id)
        )
      `);
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS user_resource_map_user_idx ON user_resource_map(user_uuid)`
      );
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS user_resource_map_resource_idx ON user_resource_map(resource_type, resource_id)`
      );

      await queryRunner.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_number TEXT`
      );

      logger.success("Schema patches applied");
      await queryRunner.release();
    } catch (error) {
      logger.warn(
        "Schema patch failed:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get Database Connection
   */
  static getInstance(): DataSource | null {
    return this.instance;
  }

  /**
   * Check if Database is Connected
   */
  static isConnected(): boolean {
    return this.isInitialized && this.instance?.isInitialized === true;
  }

  /**
   * Disconnect Database
   */
  static async disconnect(): Promise<void> {
    if (this.instance?.isInitialized) {
      await this.instance.destroy();
      this.isInitialized = false;
      logger.info("Database connection closed");
    }
  }

  /**
   * Health Check - Verify Connection is Alive
   */
  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.instance?.isInitialized) {
        return false;
      }

      const result = await this.instance.query("SELECT 1");
      return result.length > 0;
    } catch {
      return false;
    }
  }
}

export { DatabaseConnection };
