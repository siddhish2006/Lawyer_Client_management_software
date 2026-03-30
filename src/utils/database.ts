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
   * ✅ Handles SSL for Neon
   * ✅ Retries on connection failure
   * ✅ Validates schema
   */
  static async initialize(retries = 3): Promise<DataSource> {
    if (this.isInitialized && this.instance?.isInitialized) {
      logger.info("📊 Using existing database connection");
      return this.instance;
    }

    let attempt = 0;

    while (attempt < retries) {
      try {
        attempt++;
        logger.info(`📊 Attempting database connection (${attempt}/${retries})...`);

        // Initialize AppDataSource
        if (!AppDataSource.isInitialized) {
          await AppDataSource.initialize();
        }

        this.instance = AppDataSource;
        this.isInitialized = true;

        logger.success("✓ Database connected successfully");

        // Validate essential tables exist
        await this.validateSchema();

        return this.instance;
      } catch (error) {
        logger.error(
          `❌ Database connection failed (attempt ${attempt}/${retries}):`,
          error instanceof Error ? error.message : String(error)
        );

        if (attempt === retries) {
          logger.error("❌ All database connection attempts failed");
          throw error;
        }

        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        logger.info(`⏳ Retrying in ${waitTime}ms...`);
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
      ];

      const result: { table_name: string }[] = await queryRunner.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (${requiredTables.map(t => `'${t}'`).join(', ')})`
      );

      const existingTables = result.map(t => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));


      if (missingTables.length > 0) {
        logger.warn(`⚠️  Missing tables: ${missingTables.join(", ")}`);
        logger.info("💡 Tip: Ensure database migrations have been run");
      } else {
        logger.success(`✓ All ${requiredTables.length} schema tables validated`);
      }

      await queryRunner.release();
    } catch (error) {
      logger.warn("⚠️  Could not validate schema:", error instanceof Error ? error.message : String(error));
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
      logger.info("📊 Database connection closed");
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
