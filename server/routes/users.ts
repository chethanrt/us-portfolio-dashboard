import { Router } from "express";
import type Database from "better-sqlite3";
import { recordAuditEvent } from "../db/audit.ts";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, nullableField } from "./_fields.ts";
import { nextUserId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "username", db: "username" },
  { js: "password", db: "password" },
  { js: "roleId", db: "role_id" },
  { js: "employeeId", db: "employee_id", ...nullableField },
  { js: "status", db: "status" },
]);

export function createUsersRouter(db: Database.Database) {
  const router = Router();

  // The one deliberate exception to "business logic stays frontend": doing the
  // credential match server-side means a failed/successful login attempt
  // never ships the full plaintext-password user list to the browser network
  // tab. (This is demo-only auth either way — see PROJECT_DOCUMENTATION.md §22 —
  // hardening it is explicitly out of scope for this migration.)
  router.post("/authenticate", (req, res) => {
    const { username, password } = req.body ?? {};
    const row = db
      .prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND password = ? AND status = 'Active'")
      .get(username, password) as { id: string; username: string } | undefined;
    if (row) {
      recordAuditEvent(db, {
        actorUserId: row.id,
        eventType: "login",
        module: "Auth",
        recordId: row.id,
        summary: `Login: ${row.username}`,
      });
    }
    res.json(row ? fromRow(row) : null);
  });

  router.use(
    createCrudRouter({
      db,
      table: "users",
      module: "Users",
      fromRow,
      toRow,
      generateId: nextUserId,
    })
  );

  return router;
}
