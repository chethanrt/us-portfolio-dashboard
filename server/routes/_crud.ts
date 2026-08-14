import { Router } from "express";
import type Database from "better-sqlite3";
import { recordAuditEvent } from "../db/audit.ts";
import { requirePermission } from "../security/permissions.ts";
import type { ModuleId } from "../security/permissions.ts";

/** Best-effort human label for an audit summary — tries the common "name" columns in order. */
function describeRow(row: any, idColumn: string): string {
  return row?.name ?? row?.title ?? row?.username ?? row?.course ?? row?.[idColumn] ?? "";
}

/**
 * Generic CRUD plumbing shared by every entity. All business logic
 * (cross-service orchestration, delete guards, sync side effects) stays in
 * the frontend service classes exactly as before migration — this router
 * adds two things that aren't business logic: a module+action permission
 * check per verb (requireAuth already ran globally in server/index.ts
 * before this router is ever reached), and audit logging, which every
 * entity needs identically.
 */
export function createCrudRouter(opts: {
  db: Database.Database;
  table: string;
  /** Which permission-framework module this table maps to (see docs/05, src/types/permissions.ts). */
  module: ModuleId;
  /** Human-readable module label for the audit log, e.g. "People", "POCs" — defaults to `module` capitalized. */
  auditLabel?: string;
  idColumn?: string;
  /** e.g. "rowid DESC" to replicate a service that used to prepend new records (newest-first lists). */
  listOrderBy?: string;
  fromRow: (row: any) => any;
  toRow: (payload: any) => Record<string, unknown>;
  generateId: (db: Database.Database, payload: any) => string;
}) {
  const { db, table, module, fromRow, toRow, generateId } = opts;
  const idColumn = opts.idColumn ?? "id";
  const auditLabel = opts.auditLabel ?? module.charAt(0).toUpperCase() + module.slice(1);
  const router = Router();
  const permission = (action: Parameters<typeof requirePermission>[2]) => requirePermission(db, module, action);

  // actorUserId comes from the verified session (req.user, set by requireAuth)
  // — never a client-supplied header — so the audit trail can't be spoofed.
  const audit = (req: any, eventType: "create" | "update" | "delete", recordId: string, row: any) =>
    recordAuditEvent(db, {
      actorUserId: req.user?.id ?? "",
      eventType,
      module: auditLabel,
      recordId,
      summary: describeRow(row, idColumn),
    });

  router.get("/", permission("view"), (_req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table}${opts.listOrderBy ? ` ORDER BY ${opts.listOrderBy}` : ""}`).all();
    res.json(rows.map(fromRow));
  });

  router.get("/:id", permission("view"), (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(fromRow(row));
  });

  router.post("/", permission("create"), (req, res) => {
    try {
      const id = generateId(db, req.body);
      const columns = toRow(req.body);
      const keys = Object.keys(columns);
      const columnList = [idColumn, ...keys].join(", ");
      const valueList = [`@${idColumn}`, ...keys.map((k) => `@${k}`)].join(", ");
      db.prepare(`INSERT INTO ${table} (${columnList}) VALUES (${valueList})`).run({
        [idColumn]: id,
        ...columns,
      });
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(id);
      audit(req, "create", id, row);
      res.status(201).json(fromRow(row));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.put("/:id", permission("edit"), (req, res) => {
    try {
      const columns = toRow(req.body);
      const keys = Object.keys(columns);
      if (keys.length > 0) {
        db.prepare(`UPDATE ${table} SET ${keys.map((k) => `${k} = @${k}`).join(", ")} WHERE ${idColumn} = @${idColumn}`).run({
          [idColumn]: req.params.id,
          ...columns,
        });
      }
      const row = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
      }
      audit(req, "update", req.params.id, row);
      res.json(fromRow(row));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/:id", permission("delete"), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE ${idColumn} = ?`).get(req.params.id);
    const result = db.prepare(`DELETE FROM ${table} WHERE ${idColumn} = ?`).run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    audit(req, "delete", req.params.id, existing);
    res.status(204).end();
  });

  return router;
}
