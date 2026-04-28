import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { verifySession, SessionPayload } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: SessionPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }
  const token = header.slice(7).trim();
  try {
    req.auth = verifySession(token);
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
