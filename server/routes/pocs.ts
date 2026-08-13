import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, jsonArrayField, nullableField } from "./_fields.ts";
import { nextPocId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "title", db: "title" },
  { js: "ownerId", db: "owner_id" },
  { js: "team", db: "team_json", ...jsonArrayField },
  { js: "projectId", db: "project_id" },
  { js: "category", db: "category" },
  { js: "description", db: "description" },
  { js: "status", db: "status" },
  { js: "businessValue", db: "business_value" },
  { js: "hoursSaved", db: "hours_saved" },
  { js: "repo", db: "repo" },
  { js: "demo", db: "demo" },
  { js: "startDate", db: "start_date" },
  { js: "endDate", db: "end_date" },
  { js: "startTime", db: "start_time" },
  { js: "hoursPerDay", db: "hours_per_day" },
  { js: "blockGroupId", db: "block_group_id", ...nullableField },
]);

export function createPocsRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "pocs",
    listOrderBy: "rowid DESC", // POCService used to prepend new records (newest-first)
    fromRow,
    toRow,
    generateId: nextPocId,
  });
}
