import crypto from "node:crypto";
import type Database from "better-sqlite3";

export const SESSION_COOKIE = "session";
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
  id: string;
  username: string;
  roleId: string;
  employeeId: string | null;
  status: string;
}

/** Creates a new session row for a user and returns the random token. */
export function createSession(db: Database.Database, userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS).toISOString();
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
  return token;
}

/** Returns the user for a valid, unexpired session token — or null if missing/expired/unknown. */
export function getSessionUser(db: Database.Database, token: string | undefined): SessionUser | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT users.id, users.username, users.role_id AS roleId, users.employee_id AS employeeId, users.status
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token = ? AND sessions.expires_at > datetime('now')`
    )
    .get(token) as SessionUser | undefined;
  return row ?? null;
}

/** Deletes a session row (logout). No-op if the token doesn't exist. */
export function deleteSession(db: Database.Database, token: string | undefined): void {
  if (!token) return;
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_LIFETIME_MS,
};
