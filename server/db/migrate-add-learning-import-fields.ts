/**
 * One-off, idempotent live-DB migration: adds `program_coordinator` and
 * `minutes_completed` columns to the `learning` table. Purely additive
 * (existing rows get '' / 0) — no data loss possible, safe to re-run.
 *
 * Usage: npm run db:migrate-add-learning-import-fields
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const columns = db.prepare("PRAGMA table_info(learning)").all() as { name: string }[];
  const existing = new Set(columns.map((c) => c.name));

  if (!existing.has("program_coordinator")) {
    db.exec("ALTER TABLE learning ADD COLUMN program_coordinator TEXT NOT NULL DEFAULT ''");
    console.log("Added learning.program_coordinator.");
  } else {
    console.log("learning.program_coordinator already exists — skipping.");
  }

  if (!existing.has("minutes_completed")) {
    db.exec("ALTER TABLE learning ADD COLUMN minutes_completed REAL NOT NULL DEFAULT 0");
    console.log("Added learning.minutes_completed.");
  } else {
    console.log("learning.minutes_completed already exists — skipping.");
  }
}

main();
