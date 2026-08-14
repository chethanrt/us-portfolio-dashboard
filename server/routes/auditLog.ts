import { Router } from "express";
import type Database from "better-sqlite3";
import { recordAuditEvent } from "../db/audit.ts";
import { requirePermission } from "../security/permissions.ts";

function fromRow(row: any) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    actorUserId: row.actor_user_id,
    actorUsername: row.actor_username,
    eventType: row.event_type,
    module: row.module,
    recordId: row.record_id,
    summary: row.summary,
  };
}

/**
 * Read/write for the audit trail. GET powers the live admin log (polled,
 * not pushed — no WebSocket/SSE layer exists anywhere else in this app, and
 * a few seconds of staleness is fine for this scale). POST is for events
 * with no corresponding CRUD record — today, just logout (login is stamped
 * directly inside users.ts#authenticate, and every create/update/delete is
 * stamped inside _crud.ts / the bespoke routers that write to the DB).
 */
export function createAuditLogRouter(db: Database.Database) {
  const router = Router();

  router.get("/", requirePermission(db, "auditLog", "view"), (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const rows = db.prepare("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?").all(limit);
    res.json(rows.map(fromRow));
  });

  router.post("/", (req, res) => {
    const { eventType, module, recordId, summary } = req.body ?? {};
    recordAuditEvent(db, {
      actorUserId: req.user?.id ?? "",
      eventType: eventType ?? "update",
      module: module ?? "",
      recordId,
      summary,
    });
    res.status(201).json({ ok: true });
  });

  return router;
}
