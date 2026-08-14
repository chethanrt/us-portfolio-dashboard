import type Database from "better-sqlite3";
import { createCrudRouter } from "./_crud.ts";
import { buildRowMapper, jsonArrayField } from "./_fields.ts";
import { nextProjectId } from "../db/ids.ts";

const { fromRow, toRow } = buildRowMapper([
  { js: "name", db: "name" },
  { js: "client", db: "client" },
  { js: "program", db: "program" },
  { js: "manager", db: "manager" },
  { js: "techLead", db: "tech_lead" },
  { js: "projectManager", db: "project_manager" },
  { js: "technology", db: "technology_json", ...jsonArrayField },
  { js: "stage", db: "stage" },
  { js: "status", db: "status" },
  { js: "aiAdoption", db: "ai_adoption" },
  { js: "aiAdoptionCategories", db: "ai_adoption_categories_json", ...jsonArrayField },
  { js: "members", db: "members_json", ...jsonArrayField },
  { js: "startDate", db: "start_date" },
  { js: "endDate", db: "end_date" },
]);

export function createProjectsRouter(db: Database.Database) {
  return createCrudRouter({
    db,
    table: "projects",
    module: "Projects",
    fromRow,
    toRow,
    generateId: nextProjectId,
  });
}
