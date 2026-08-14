import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper } from "./_fields.ts";
import { nextActivityId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "employeeId", db: "employee_id" },
  { js: "projectId", db: "project_id" },
  { js: "date", db: "date" },
  { js: "tool", db: "tool" },
  { js: "category", db: "category" },
  { js: "projectStage", db: "project_stage" },
  { js: "promptSummary", db: "prompt_summary" },
  { js: "outcome", db: "outcome" },
  { js: "hoursSaved", db: "hours_saved" },
  { js: "impact", db: "impact" },
  { js: "attachment", db: "attachment" },
]);

export function createActivitiesRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "activities",
    module: "activities",
    auditLabel: "Activities",
    listOrderBy: "rowid DESC", // ActivityService used to prepend new records (newest-first)
    fromRow,
    toRow,
    generateId: nextActivityId,
  });
}
