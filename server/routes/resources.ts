import { Router } from "express";
import type Database from "better-sqlite3";

function fromRow(row: any) {
  return {
    id: row.id,
    label: row.label,
    path: row.path,
    description: row.description,
    actions: JSON.parse(row.actions_json),
    fields: JSON.parse(row.fields_json),
    scopable: Boolean(row.scopable),
  };
}

/** Read-only — PermissionService.getResources() never mutates this list. */
export function createResourcesRouter(db: Database.Database) {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(db.prepare("SELECT * FROM resources").all().map(fromRow));
  });

  router.get("/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM resources WHERE id = ?").get(req.params.id);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(fromRow(row));
  });

  return router;
}
