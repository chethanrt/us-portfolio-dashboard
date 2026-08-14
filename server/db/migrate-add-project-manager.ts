/**
 * One-off, idempotent live-DB migration: adds the `project_manager` column
 * to the `projects` table. Purely additive (existing rows get '') — no data
 * loss possible, safe to re-run.
 *
 * Usage: npm run db:migrate-add-project-manager
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const columns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  const hasColumn = columns.some((c) => c.name === "project_manager");

  if (hasColumn) {
    console.log("projects.project_manager already exists — nothing to migrate.");
    return;
  }

  db.exec("ALTER TABLE projects ADD COLUMN project_manager TEXT NOT NULL DEFAULT ''");
  console.log("Added projects.project_manager.");
}

main();
