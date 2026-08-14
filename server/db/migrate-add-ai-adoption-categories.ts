/**
 * One-off, idempotent live-DB migration: adds the `ai_adoption_categories_json`
 * column to the `projects` table. Purely additive (existing rows get '[]') —
 * no data loss possible, safe to re-run.
 *
 * Usage: npm run db:migrate-add-ai-adoption-categories
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const columns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  const hasColumn = columns.some((c) => c.name === "ai_adoption_categories_json");

  if (hasColumn) {
    console.log("projects.ai_adoption_categories_json already exists — nothing to migrate.");
    return;
  }

  db.exec("ALTER TABLE projects ADD COLUMN ai_adoption_categories_json TEXT NOT NULL DEFAULT '[]'");
  console.log("Added projects.ai_adoption_categories_json.");
}

main();
