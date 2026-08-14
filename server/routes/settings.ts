import { Router } from "express";
import type Database from "better-sqlite3";
import { requirePermission } from "../security/permissions.ts";

const EDITABLE_KEYS = [
  "roles",
  "technicalSkills",
  "aiSkills",
  "aiTools",
  "projectStages",
  "activityTypes",
  "pocCategories",
  "learningPlatforms",
  "eventTypes",
];

function sortIfEditableList(key: string, value: unknown): unknown {
  if (EDITABLE_KEYS.includes(key) && Array.isArray(value)) {
    return [...value].sort((a, b) => String(a).localeCompare(String(b)));
  }
  return value;
}

function readAll(db: Database.Database): Record<string, unknown> {
  const rows = db.prepare("SELECT key, value_json FROM settings").all() as { key: string; value_json: string }[];
  const settings: Record<string, unknown> = {};
  for (const row of rows) settings[row.key] = sortIfEditableList(row.key, JSON.parse(row.value_json));
  return settings;
}

/**
 * Bespoke — AppSettings is one document keyed by top-level field, mirroring
 * SettingsService.getSettings()/updateList(key, values) exactly. Re-sorts
 * editable lists on every read/write, matching SettingsService.withSortedLists.
 */
export function createSettingsRouter(db: Database.Database) {
  const router = Router();

  // Not gated by requirePermission beyond requireAuth — every signed-in user
  // needs to read Settings master data (role lists, technical skills, etc.)
  // for dropdowns app-wide, not just users with "settings" access.
  router.get("/", (_req, res) => {
    res.json(readAll(db));
  });

  router.put("/:key", requirePermission(db, "settings", "edit"), (req, res) => {
    const key = req.params.key;
    const values = sortIfEditableList(key, req.body?.values ?? []);
    db.prepare(
      `INSERT INTO settings (key, value_json) VALUES (@key, @valueJson)
       ON CONFLICT(key) DO UPDATE SET value_json = @valueJson`
    ).run({ key, valueJson: JSON.stringify(values) });
    res.json(readAll(db));
  });

  return router;
}
