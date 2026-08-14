import bcrypt from "bcryptjs";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, nullableField } from "./_fields.ts";
import { nextUserId } from "../db/ids.ts";
import { createSession, deleteSession, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "../security/sessions.ts";
import { requireAuth } from "../security/requireAuth.ts";

/** Throttles brute-force password guessing — 10 attempts per 15 minutes per IP. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "TOO_MANY_ATTEMPTS" },
});

const { fromRow, toRow: toRowBase } = buildRowMapper([
  { js: "username", db: "username" },
  { js: "password", db: "password" },
  { js: "roleId", db: "role_id" },
  { js: "employeeId", db: "employee_id", ...nullableField },
  { js: "status", db: "status" },
]);

/** Hashes `password` before it reaches the generic CRUD insert/update, so every path that can set one — the Add/Edit User form, and EmployeeService's auto-account creation — ends up hashed, not just /authenticate. */
function toRow(payload: any): Record<string, unknown> {
  const row = toRowBase(payload);
  if (typeof row.password === "string" && row.password.length > 0) {
    row.password = bcrypt.hashSync(row.password, 10);
  }
  return row;
}

export function createUsersRouter(db: Database.Database) {
  const router = Router();

  // The one deliberate exception to "business logic stays frontend": doing the
  // credential match and session issuance server-side means a failed/
  // successful login attempt never ships the full password-hash user list to
  // the browser network tab, and means the "session" is a real, unforgeable
  // token instead of something the client makes up itself.
  router.post("/authenticate", loginLimiter, (req, res) => {
    const { username, password } = req.body ?? {};
    const row = db
      .prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND status = 'Active'")
      .get(username) as Record<string, unknown> | undefined;

    if (!row || typeof row.password !== "string" || !bcrypt.compareSync(password ?? "", row.password)) {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }

    const token = createSession(db, row.id as string);
    res.cookie(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    res.json(fromRow(row));
  });

  // Everything below this line requires a valid session — /authenticate is
  // the only route in this router (or any router) that doesn't.
  router.use(requireAuth(db));

  router.post("/logout", (req, res) => {
    deleteSession(db, req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });

  // Who am I? — used by the frontend to restore a session on page load
  // instead of reading a localStorage key (there's nothing there to read
  // anymore — the cookie is the session).
  router.get("/me", (req, res) => {
    res.json(req.user);
  });

  router.use(
    createCrudRouter({
      db,
      table: "users",
      module: "users",
      fromRow,
      toRow,
      generateId: nextUserId,
    })
  );

  return router;
}
