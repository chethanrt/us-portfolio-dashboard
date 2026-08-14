import type { NextFunction, Request, Response } from "express";
import type Database from "better-sqlite3";
import { getSessionUser, SESSION_COOKIE } from "./sessions.ts";
import type { SessionUser } from "./sessions.ts";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

/**
 * Rejects any request without a valid, unexpired session cookie. On
 * success, attaches the session's user (and role) to `req.user` for
 * downstream handlers/middleware (see requirePermission.ts) to use.
 * Applied to every router in server/index.ts except the login route itself.
 */
export function requireAuth(db: Database.Database) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = getSessionUser(db, req.cookies?.[SESSION_COOKIE]);
    if (!user || user.status !== "Active") {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    req.user = user;
    next();
  };
}
