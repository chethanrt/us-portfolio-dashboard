import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, jsonArrayField, nullableField } from "./_fields.ts";
import { nextEmployeeId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "name", db: "name" },
  { js: "email", db: "email" },
  { js: "role", db: "role" },
  { js: "designation", db: "designation" },
  { js: "experience", db: "experience" },
  { js: "team", db: "team" },
  { js: "skills", db: "skills_json", ...jsonArrayField },
  { js: "projects", db: "projects_json", ...jsonArrayField },
  { js: "profileImage", db: "profile_image" },
  { js: "status", db: "status" },
  { js: "managerId", db: "manager_id", ...nullableField },
  { js: "leaderId", db: "leader_id", ...nullableField },
  { js: "businessUnit", db: "business_unit" },
  { js: "techNonTech", db: "tech_non_tech" },
]);

export function createEmployeesRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "employees",
    module: "people",
    auditLabel: "People",
    fromRow,
    toRow,
    generateId: nextEmployeeId,
  });
}
