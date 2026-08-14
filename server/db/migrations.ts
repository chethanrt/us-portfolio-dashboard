import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Applies incremental schema changes (`server/db/migrations/*.sql`) that
 * haven't run against this specific database file yet, in filename order.
 *
 * This is separate from `schema.sql` (which only creates tables the first
 * time they're missing — `CREATE TABLE IF NOT EXISTS` is a no-op on a
 * database that already has the table) and separate from `migrate.ts`
 * (which is the one-time JSON → database seed, not a schema tool).
 *
 * Each migration file only ever runs once per database — a `schema_migrations`
 * table tracks which ones already applied. Safe to call on every server
 * startup: with nothing new to apply, it's a no-op.
 */
export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const applied = new Set(
    (db.prepare("SELECT name FROM schema_migrations").all() as { name: string }[]).map((row) => row.name)
  );

  const pending = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .filter((file) => !applied.has(file));

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const applyOne = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
    });
    applyOne();
    console.log(`[migrations] applied ${file}`);
  }
}
