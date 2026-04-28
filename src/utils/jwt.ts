import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface SessionPayload {
  sub: string;
  username: string;
  email: string;
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.JWT.SECRET, { expiresIn: env.JWT.SESSION_TTL as any });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, env.JWT.SECRET) as SessionPayload;
}
