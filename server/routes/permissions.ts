import { Router } from "express";
import type Database from "better-sqlite3";
import { recordAuditEvent } from "../db/audit.ts";

function fromRow(row: { role_id: string; modules_json: string }) {
  return { roleId: row.role_id, modules: JSON.parse(row.modules_json) };
}

/**
 * Bespoke: Permission's natural key IS the roleId (no separate generated
 * id), and PermissionService only ever reads or upserts a whole row per
 * role (getAll/getByRoleId/saveForRole/deleteForRole) — the generic CRUD
 * factory doesn't fit a resource with no independent id.
 */
export function createPermissionsRouter(db: Database.Database) {
  const router = Router();

  router.get("/", (_req, res) => {
    const rows = db.prepare("SELECT * FROM permissions").all() as any[];
    res.json(rows.map(fromRow));
  });

  router.get("/:roleId", (req, res) => {
    const row = db.prepare("SELECT * FROM permissions WHERE role_id = ?").get(req.params.roleId);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(fromRow(row as any));
  });

  // Mirrors PermissionService.saveForRole — upsert, since a role may not have a row yet.
  router.put("/:roleId", (req, res) => {
    const modulesJson = JSON.stringify(req.body?.modules ?? []);
    db.prepare(
      `INSERT INTO permissions (role_id, modules_json) VALUES (@roleId, @modulesJson)
       ON CONFLICT(role_id) DO UPDATE SET modules_json = @modulesJson`
    ).run({ roleId: req.params.roleId, modulesJson });
    recordAuditEvent(db, {
      actorUserId: req.header("x-actor-id") ?? "",
      eventType: "update",
      module: "Roles",
      recordId: req.params.roleId,
      summary: `Updated permissions for role ${req.params.roleId}`,
    });
    res.json(fromRow(db.prepare("SELECT * FROM permissions WHERE role_id = ?").get(req.params.roleId) as any));
  });

  router.delete("/:roleId", (req, res) => {
    db.prepare("DELETE FROM permissions WHERE role_id = ?").run(req.params.roleId);
    res.status(204).end();
  });

  return router;
}
