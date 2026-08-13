import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper } from "./_fields.ts";
import { nextLearningId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "employeeId", db: "employee_id" },
  { js: "course", db: "course" },
  { js: "platform", db: "platform" },
  { js: "status", db: "status" },
  { js: "progress", db: "progress" },
  { js: "hours", db: "hours" },
  { js: "certificate", db: "certificate" },
  { js: "completionDate", db: "completion_date" },
]);

export function createLearningRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "learning",
    listOrderBy: "rowid DESC", // LearningService used to prepend new records (newest-first)
    fromRow,
    toRow,
    generateId: nextLearningId,
  });
}
