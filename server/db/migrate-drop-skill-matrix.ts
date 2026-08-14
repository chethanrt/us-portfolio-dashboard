/**
 * One-off, idempotent live-DB migration: drops the old proficiency-level
 * `skills` table (SkillRecord — Beginner/Intermediate/Advanced/Expert per
 * hardcoded skill column), now replaced by the Employee.skills_json column
 * and the Settings-managed `skills` list. The table is always empty (no
 * write path ever existed for it), so dropping it loses no data.
 *
 * Usage: npm run db:migrate-drop-skill-matrix
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='skills'").get();
  if (!table) {
    console.log("skills table already gone — nothing to migrate.");
    return;
  }

  db.exec("DROP TABLE skills");
  console.log("Dropped the old skills (proficiency-level) table.");
}

main();
