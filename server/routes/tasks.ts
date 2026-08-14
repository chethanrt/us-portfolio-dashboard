import { Router } from "express";
import type Database from "better-sqlite3";
import { buildRowMapper, jsonArrayField, boolField, nullableField } from "./_fields.ts";
import { nextTaskIds } from "../db/ids.ts";
import { requirePermission } from "../security/permissions.ts";

const { fromRow: fromRowBase, toRow } = buildRowMapper([
  { js: "title", db: "title" },
  { js: "description", db: "description" },
  { js: "type", db: "type" },
  { js: "category", db: "category" },
  { js: "projectId", db: "project_id", ...nullableField },
  { js: "assigneeId", db: "assignee_id" },
  { js: "reporterId", db: "reporter_id" },
  { js: "createdBy", db: "created_by" },
  { js: "lastModifiedBy", db: "last_modified_by" },
  { js: "priority", db: "priority" },
  { js: "status", db: "status" },
  { js: "estimateHours", db: "estimate_hours" },
  { js: "actualHours", db: "actual_hours" },
  { js: "percentComplete", db: "percent_complete" },
  { js: "startDate", db: "start_date" },
  { js: "dueDate", db: "due_date" },
  { js: "completedDate", db: "completed_date" },
  { js: "displayOrder", db: "display_order" },
  { js: "labels", db: "labels_json", ...jsonArrayField },
  { js: "aiTool", db: "ai_tool" },
  { js: "linkedActivityId", db: "linked_activity_id" },
  { js: "linkedPocId", db: "linked_poc_id" },
  { js: "linkedCalendarEventId", db: "linked_calendar_event_id", ...nullableField },
  { js: "comments", db: "comments_json", ...jsonArrayField },
  { js: "attachments", db: "attachments_json", ...jsonArrayField },
  { js: "archived", db: "archived", ...boolField },
]);

function fromRow(row: Record<string, any>) {
  return {
    ...fromRowBase(row),
    taskNumber: row.task_number,
    createdDate: row.created_date,
    updatedDate: row.updated_date,
  };
}

/**
 * Bespoke (not the generic CRUD factory) because Task has two ids minted
 * together from one counter (id + taskNumber, see db/ids.ts#nextTaskIds)
 * and server-stamped createdDate/updatedDate — everything else about it is
 * a plain CRUD entity. TaskService's higher-level operations (duplicate,
 * setArchived, addComment) stay client-side exactly as before: they build
 * the payload from data already fetched via GET, then PUT it back — no
 * dedicated endpoints needed for them.
 */
export function createTasksRouter(db: Database.Database) {
  const router = Router();

  router.get("/", requirePermission(db, "tasks", "view"), (_req, res) => {
    res.json(db.prepare("SELECT * FROM tasks").all().map(fromRow));
  });

  router.get("/:id", requirePermission(db, "tasks", "view"), (req, res) => {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(fromRow(row));
  });

  router.post("/", requirePermission(db, "tasks", "create"), (req, res) => {
    try {
      const { id, taskNumber } = nextTaskIds(db);
      const now = new Date().toISOString().slice(0, 10); // date-only, matching TaskService's old today()
      const columns = toRow(req.body);
      const keys = Object.keys(columns);
      const columnList = ["id", "task_number", "created_date", "updated_date", ...keys].join(", ");
      const valueList = ["@id", "@taskNumber", "@createdDate", "@updatedDate", ...keys.map((k) => `@${k}`)].join(", ");
      db.prepare(`INSERT INTO tasks (${columnList}) VALUES (${valueList})`).run({
        id,
        taskNumber,
        createdDate: now,
        updatedDate: now,
        ...columns,
      });
      res.status(201).json(fromRow(db.prepare("SELECT * FROM tasks WHERE id = ?").get(id)));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.put("/:id", requirePermission(db, "tasks", "edit"), (req, res) => {
    try {
      const columns = toRow(req.body);
      const keys = Object.keys(columns);
      const now = new Date().toISOString().slice(0, 10); // date-only, matching TaskService's old today()
      const setList = ["updated_date = @updatedDate", ...keys.map((k) => `${k} = @${k}`)].join(", ");
      db.prepare(`UPDATE tasks SET ${setList} WHERE id = @id`).run({
        id: req.params.id,
        updatedDate: now,
        ...columns,
      });
      const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
      if (!row) {
        res.status(404).json({ error: "NOT_FOUND" });
        return;
      }
      res.json(fromRow(row));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete("/:id", requirePermission(db, "tasks", "delete"), (req, res) => {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.status(204).end();
  });

  return router;
}
