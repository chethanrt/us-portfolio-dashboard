import { Router } from "express";
import type Database from "better-sqlite3";
import { requirePermission } from "../security/permissions.ts";

/** Read-only, matching TaskWorkflowService today — "no CRUD UI yet (direct JSON edit only)". */
export function createTaskCategoriesRouter(db: Database.Database) {
  const router = Router();

  router.get("/", requirePermission(db, "tasks", "view"), (_req, res) => {
    const rows = db.prepare("SELECT * FROM task_categories").all() as any[];
    res.json(rows.map((r) => ({ id: r.id, name: r.name, description: r.description })));
  });

  return router;
}
