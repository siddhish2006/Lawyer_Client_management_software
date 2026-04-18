import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

/**
 * Global Error Middleware
 *
 * Catches ALL errors thrown in the app.
 */
export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {

  //----------------------------------
  // Known Errors (Operational)
  //----------------------------------

  if (err instanceof AppError) {

    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });

  }

  //----------------------------------
  // Unknown Errors (Programming bugs)
  //----------------------------------

  logger.error("UNEXPECTED ERROR", err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
};
