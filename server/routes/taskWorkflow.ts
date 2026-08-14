import { Router } from "express";
import type Database from "better-sqlite3";
import { requirePermission } from "../security/permissions.ts";

/** Read-only, matching TaskWorkflowService today — "no CRUD UI yet (direct JSON edit only)". */
export function createTaskWorkflowRouter(db: Database.Database) {
  const router = Router();

  router.get("/", requirePermission(db, "tasks", "view"), (_req, res) => {
    const rows = db.prepare('SELECT * FROM task_workflow_statuses ORDER BY "order"').all() as any[];
    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        order: r.order,
        description: r.description,
        isFinalState: Boolean(r.is_final_state),
        percentComplete: r.percent_complete,
      }))
    );
  });

  return router;
}
