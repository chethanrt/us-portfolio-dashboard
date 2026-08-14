import { Router } from "express";
import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, jsonArrayField, nullableField } from "./_fields.ts";
import { nextCalendarEventId } from "../db/ids.ts";
import { requirePermission } from "../security/permissions.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "employeeId", db: "employee_id" },
  { js: "title", db: "title" },
  { js: "description", db: "description" },
  { js: "eventType", db: "event_type" },
  { js: "start", db: "start" },
  { js: "end", db: "end" },
  { js: "timeZone", db: "time_zone" },
  { js: "organizer", db: "organizer" },
  { js: "attendees", db: "attendees_json", ...jsonArrayField },
  { js: "location", db: "location" },
  { js: "outlookEventId", db: "outlook_event_id", ...nullableField },
  { js: "createdBy", db: "created_by" },
  { js: "linkedTaskId", db: "linked_task_id", ...nullableField },
  { js: "linkedPocId", db: "linked_poc_id", ...nullableField },
  { js: "blockGroupId", db: "block_group_id", ...nullableField },
]);

export function createCalendarEventsRouter(db: Database.Database) {
  const router = Router();

  // Registered before the generic "/:id" route so "by-group" isn't parsed as an id.
  // Mirrors CalendarService.deleteByGroup — deletes every sibling event sharing a blockGroupId.
  router.delete("/by-group/:groupId", requirePermission(db, "people", "delete"), (req, res) => {
    db.prepare("DELETE FROM calendar_events WHERE block_group_id = ?").run(req.params.groupId);
    res.status(204).end();
  });

  router.use(
    createCrudRouter({
      db,
      table: "calendar_events",
      module: "people",
      fromRow,
      toRow,
      generateId: nextCalendarEventId,
    })
  );

  return router;
}
