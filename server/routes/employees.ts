import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, jsonArrayField, nullableField } from "./_fields.ts";
import { nextEmployeeId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "name", db: "name" },
  { js: "email", db: "email" },
  { js: "role", db: "role" },
  { js: "experience", db: "experience" },
  { js: "team", db: "team" },
  { js: "primarySkill", db: "primary_skill" },
  { js: "secondarySkill", db: "secondary_skill" },
  { js: "projects", db: "projects_json", ...jsonArrayField },
  { js: "profileImage", db: "profile_image" },
  { js: "status", db: "status" },
  { js: "managerId", db: "manager_id", ...nullableField },
]);

export function createEmployeesRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "employees",
    fromRow,
    toRow,
    generateId: nextEmployeeId,
  });
}
