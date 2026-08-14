/**
 * One-off, idempotent live-DB migration: adds the `linked_project_id`
 * column to `calendar_events`, used by Project team-assignment auto-blocks
 * to find/remove their own calendar event when a member is dropped from a
 * project. Purely additive (existing rows get NULL) — no data loss
 * possible, safe to re-run.
 *
 * The index is created here rather than in schema.sql: schema.sql runs
 * unconditionally on every server startup (via getDb()), so an index
 * referencing this column there would break every *existing* database
 * (column not added yet) until this script has run — this script is the
 * only place it's safe to reference the column unconditionally, since by
 * this point it's guaranteed to exist (either just ALTERed in, or already
 * present from a fresh schema.sql-created table).
 *
 * Usage: npm run db:migrate-add-linked-project
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const columns = db.prepare("PRAGMA table_info(calendar_events)").all() as { name: string }[];
  const hasColumn = columns.some((c) => c.name === "linked_project_id");

  if (!hasColumn) {
    db.exec("ALTER TABLE calendar_events ADD COLUMN linked_project_id TEXT");
    console.log("Added calendar_events.linked_project_id.");
  } else {
    console.log("calendar_events.linked_project_id already exists.");
  }

  db.exec("CREATE INDEX IF NOT EXISTS idx_calendar_linked_project ON calendar_events(linked_project_id)");
  console.log("Ensured idx_calendar_linked_project exists.");
}

main();
