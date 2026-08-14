import { Router } from "express";
import type Database from "better-sqlite3";
import { requirePermission } from "../security/permissions.ts";

const SKILL_COLUMNS = [
  "Magento",
  "PHP",
  "React",
  "JavaScript",
  "GraphQL",
  "MySQL",
  "Docker",
  "Git",
  "Claude",
  "ChatGPT",
  "GitHubCopilot",
  "Cursor",
  "PromptEngineering",
];

function fromRow(row: Record<string, any>) {
  const obj: Record<string, any> = { employeeId: row.employee_id };
  for (const col of SKILL_COLUMNS) obj[col] = row[col];
  return obj;
}

/**
 * Read-only, matching SkillService today — it has no create/update/delete
 * (no edit UI exists anywhere in the app), so no write routes are exposed.
 */
export function createSkillsRouter(db: Database.Database) {
  const router = Router();

  router.get("/", requirePermission(db, "skills", "view"), (_req, res) => {
    const rows = db.prepare("SELECT * FROM skills").all();
    res.json(rows.map(fromRow));
  });

  router.get("/:employeeId", requirePermission(db, "skills", "view"), (req, res) => {
    const row = db.prepare("SELECT * FROM skills WHERE employee_id = ?").get(req.params.employeeId);
    if (!row) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(fromRow(row));
  });

  return router;
}
