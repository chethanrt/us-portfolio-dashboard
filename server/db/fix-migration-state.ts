/**
 * One-off repair script: your local portfolio.sqlite3 already has the
 * columns from migrations 0001-0003 (added earlier via the now-removed
 * ad-hoc migrate-add-*.ts scripts, before the numbered migrations/ system
 * was restored), but schema_migrations has no record of them — so
 * runMigrations() tries to re-run the ALTER TABLE statements and crashes
 * with "duplicate column name".
 *
 * This opens the database directly (NOT via getDb(), since that would hit
 * the same crash), and for each of the 3 migrations, marks it as already
 * applied ONLY if every column it would add already exists — so it's safe
 * to run even if some (but not all) of the 3 already applied. Doesn't
 * touch any table data.
 *
 * Usage: npx tsx server/db/fix-migration-state.ts
 * Delete this file afterward — it's a one-time repair, not a real migration.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "portfolio.sqlite3");

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function hasColumn(table: string, column: string): boolean {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return columns.some((c) => c.name === column);
}

const CHECKS: { file: string; table: string; columns: string[] }[] = [
  { file: "0001_add_employee_org_fields.sql", table: "employees", columns: ["leader_id", "business_unit", "tech_non_tech"] },
  { file: "0002_add_learning_import_fields.sql", table: "learning", columns: ["program_coordinator", "minutes_completed"] },
  { file: "0003_add_project_ai_adoption_categories.sql", table: "projects", columns: ["ai_adoption_categories_json"] },
];

const alreadyApplied = new Set(
  (db.prepare("SELECT name FROM schema_migrations").all() as { name: string }[]).map((r) => r.name)
);

const markApplied = db.prepare("INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)");

for (const check of CHECKS) {
  if (alreadyApplied.has(check.file)) {
    console.log(`${check.file}: already recorded — skipping.`);
    continue;
  }
  const allColumnsExist = check.columns.every((c) => hasColumn(check.table, c));
  if (allColumnsExist) {
    markApplied.run(check.file);
    console.log(`${check.file}: columns already present on ${check.table} — marked as applied.`);
  } else {
    console.log(`${check.file}: columns missing on ${check.table} — left unmarked, will apply normally.`);
  }
}

console.log("Done. You can now delete this file and run `npm run dev` normally.");
