/**
 * Database Middleware
 * ==================
 * Ensures database connection is healthy before processing requests
 */

import { Request, Response, NextFunction } from "express";
import { DatabaseConnection } from "../utils/database";
import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";

/**
 * Check Database Health
 * Middleware to ensure DB is connected before processing requests
 */
export const dbHealthCheck = async (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const isConnected = await DatabaseConnection.healthCheck();

    if (!isConnected) {
      logger.warn("⚠️  Database health check failed");
      throw new AppError("Database connection unavailable", 503);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.error("Database health check error:", error);
      next(new AppError("Database service unavailable", 503));
    }
  }
};

/**
 * Attach Database Instance to Request
 * Optional: Allows access to database in controllers
 */
export const attachDatabase = (_req: Request, _res: Response, next: NextFunction) => {
  try {
    const db = DatabaseConnection.getInstance();
    if (db) {
      (_req as any).db = db;
    }
    next();
  } catch (error) {
    logger.error("Error attaching database:", error);
    next(error);
  }
};
