/**
 * One-off, idempotent live-DB migration: replaces employees.primary_skill /
 * employees.secondary_skill with a single employees.skills_json column,
 * preserving every existing value (each becomes an entry in the new array).
 * Safe to re-run — no-ops if primary_skill is already gone.
 *
 * Usage: npm run db:migrate-skills-field
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const columns = db.prepare("PRAGMA table_info(employees)").all() as { name: string }[];
  const hasLegacyColumns = columns.some((c) => c.name === "primary_skill");

  if (!hasLegacyColumns) {
    console.log("employees.primary_skill already gone — nothing to migrate.");
    return;
  }

  const run = db.transaction(() => {
    db.exec("ALTER TABLE employees ADD COLUMN skills_json TEXT NOT NULL DEFAULT '[]'");

    const rows = db.prepare("SELECT id, primary_skill, secondary_skill FROM employees").all() as {
      id: string;
      primary_skill: string;
      secondary_skill: string;
    }[];

    const update = db.prepare("UPDATE employees SET skills_json = @skillsJson WHERE id = @id");
    for (const row of rows) {
      const skills = [row.primary_skill, row.secondary_skill].filter((s) => s && s.trim().length > 0);
      update.run({ id: row.id, skillsJson: JSON.stringify(skills) });
    }

    db.exec("ALTER TABLE employees DROP COLUMN primary_skill");
    db.exec("ALTER TABLE employees DROP COLUMN secondary_skill");

    return rows.length;
  });

  const migrated = run();
  console.log(`Migrated ${migrated} employees: primary_skill/secondary_skill -> skills_json.`);
}

main();
