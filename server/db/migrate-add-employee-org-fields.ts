/**
 * One-off, idempotent live-DB migration: adds `leader_id`, `business_unit`,
 * and `tech_non_tech` columns to the `employees` table. Purely additive
 * (existing rows get '' / 'Tech' / null) — no data loss possible, safe to
 * re-run.
 *
 * Usage: npm run db:migrate-add-employee-org-fields
 */
import { getDb } from "./client.ts";

function main(): void {
  const db = getDb();

  const columns = db.prepare("PRAGMA table_info(employees)").all() as { name: string }[];
  const existing = new Set(columns.map((c) => c.name));

  if (!existing.has("leader_id")) {
    db.exec("ALTER TABLE employees ADD COLUMN leader_id TEXT REFERENCES employees(id)");
    console.log("Added employees.leader_id.");
  } else {
    console.log("employees.leader_id already exists — skipping.");
  }

  if (!existing.has("business_unit")) {
    db.exec("ALTER TABLE employees ADD COLUMN business_unit TEXT NOT NULL DEFAULT ''");
    console.log("Added employees.business_unit.");
  } else {
    console.log("employees.business_unit already exists — skipping.");
  }

  if (!existing.has("tech_non_tech")) {
    db.exec("ALTER TABLE employees ADD COLUMN tech_non_tech TEXT NOT NULL DEFAULT 'Tech'");
    console.log("Added employees.tech_non_tech.");
  } else {
    console.log("employees.tech_non_tech already exists — skipping.");
  }
}

main();
