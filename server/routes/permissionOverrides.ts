import { Router } from "express";
import type Database from "better-sqlite3";
import { recordAuditEvent } from "../db/audit.ts";

function fromRow(row: { user_id: string; overrides_json: string }) {
  return { userId: row.user_id, modules: JSON.parse(row.overrides_json) };
}

/**
 * Bespoke, mirroring permissions.ts: an override's natural key IS the
 * userId (no separate generated id), and most users have no row at all —
 * GET returns an empty-modules default instead of 404 so the client never
 * needs special-case handling for "no overrides yet".
 */
export function createPermissionOverridesRouter(db: Database.Database) {
  const router = Router();

  router.get("/", (_req, res) => {
    const rows = db.prepare("SELECT * FROM user_permission_overrides").all() as any[];
    res.json(rows.map(fromRow));
  });

  router.get("/:userId", (req, res) => {
    const row = db.prepare("SELECT * FROM user_permission_overrides WHERE user_id = ?").get(req.params.userId);
    res.json(row ? fromRow(row as any) : { userId: req.params.userId, modules: [] });
  });

  // Mirrors PermissionOverrideService.saveForUser — upsert, since a user may not have a row yet.
  router.put("/:userId", (req, res) => {
    const overridesJson = JSON.stringify(req.body?.modules ?? []);
    db.prepare(
      `INSERT INTO user_permission_overrides (user_id, overrides_json) VALUES (@userId, @overridesJson)
       ON CONFLICT(user_id) DO UPDATE SET overrides_json = @overridesJson`
    ).run({ userId: req.params.userId, overridesJson });
    recordAuditEvent(db, {
      actorUserId: req.header("x-actor-id") ?? "",
      eventType: "update",
      module: "Users",
      recordId: req.params.userId,
      summary: `Updated permission overrides for user ${req.params.userId}`,
    });
    res.json(
      fromRow(db.prepare("SELECT * FROM user_permission_overrides WHERE user_id = ?").get(req.params.userId) as any)
    );
  });

  router.delete("/:userId", (req, res) => {
    db.prepare("DELETE FROM user_permission_overrides WHERE user_id = ?").run(req.params.userId);
    res.status(204).end();
  });

  return router;
}
