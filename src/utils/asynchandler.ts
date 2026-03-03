import { Request, Response, NextFunction } from "express";

/**
 * asyncHandler
 *
 * Wraps async route handlers and forwards
 * any thrown error to Express error middleware.
 *
 * Eliminates the need for try/catch blocks
 * inside controllers.
 */
export const asyncHandler = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<any>
) => {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    Promise
      .resolve(fn(req, res, next))
      .catch(next);

  };
};
