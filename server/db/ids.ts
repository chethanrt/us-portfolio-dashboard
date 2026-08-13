import type Database from "better-sqlite3";

/**
 * Ported verbatim from each frontend service's existing max-existing+1 ID
 * generator, just re-homed server-side so concurrent requests can't collide
 * (the localStorage version was safe only because each browser had its own
 * storage; a shared DB needs this computed inside the same transaction as
 * the insert).
 */
function nextPrefixedId(db: Database.Database, table: string, prefix: string, pad: number): string {
  const rows = db.prepare(`SELECT id FROM ${table}`).all() as { id: string }[];
  const max = rows.reduce((acc, row) => {
    const numeric = Number(row.id.slice(prefix.length));
    return Number.isFinite(numeric) && numeric > acc ? numeric : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, "0")}`;
}

export const nextEmployeeId = (db: Database.Database) => nextPrefixedId(db, "employees", "EMP", 3);
export const nextProjectId = (db: Database.Database) => nextPrefixedId(db, "projects", "P", 3);
export const nextActivityId = (db: Database.Database) => nextPrefixedId(db, "activities", "ACT", 3);
export const nextCalendarEventId = (db: Database.Database) => nextPrefixedId(db, "calendar_events", "CAL", 3);
export const nextPocId = (db: Database.Database) => nextPrefixedId(db, "pocs", "POC", 3);
export const nextLearningId = (db: Database.Database) => nextPrefixedId(db, "learning", "LRN", 3);
export const nextUserId = (db: Database.Database) => nextPrefixedId(db, "users", "USR", 3);

/** Both ids are derived from the same counter, parsed from the max existing taskNumber. */
export function nextTaskIds(db: Database.Database): { id: string; taskNumber: string } {
  const rows = db.prepare("SELECT task_number FROM tasks").all() as { task_number: string }[];
  const max = rows.reduce((acc, row) => {
    const numeric = Number(row.task_number.replace("TASK-", ""));
    return Number.isFinite(numeric) && numeric > acc ? numeric : acc;
  }, 0);
  const next = max + 1;
  return {
    id: `task-${String(next).padStart(3, "0")}`,
    taskNumber: `TASK-${String(next).padStart(4, "0")}`,
  };
}

export function nextCommentId(taskId: string, existingCommentCount: number): string {
  return `cmt-${taskId}-${existingCommentCount + 1}-${Date.now()}`;
}

/** Ported from RoleService.buildId — kebab-case slug of the name, deduped with -2, -3, ... */
export function nextRoleId(db: Database.Database, name: string): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "role";
  const exists = (candidate: string) => Boolean(db.prepare("SELECT 1 FROM roles WHERE id = ?").get(candidate));
  let id = base;
  let counter = 2;
  while (exists(id)) {
    id = `${base}-${counter}`;
    counter += 1;
  }
  return id;
}
