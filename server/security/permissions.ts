import type { NextFunction, Request, Response } from "express";
import type Database from "better-sqlite3";

export type ModuleId =
  | "dashboard"
  | "projects"
  | "tasks"
  | "activities"
  | "people"
  | "skills"
  | "learning"
  | "pocs"
  | "reports"
  | "settings"
  | "users"
  | "roles";

export type PermissionAction = "view" | "create" | "edit" | "delete" | "export" | "assign" | "comment";

interface ModulePermission {
  module: ModuleId;
  actions: Partial<Record<PermissionAction, boolean>>;
}

/**
 * Server-side mirror of src/security/PermissionService.ts's `hasPermission()`
 * — same data (permissions.modules_json, one row per role, same shape as
 * the frontend's ModulePermission[]), same "missing module = deny" default.
 * This is the first-pass module+action check only; field-level and
 * data-scope ("own"/"team"/"all") enforcement is not yet ported — see
 * AUTHENTICATION_IMPLEMENTATION_PLAN.md Step 5.
 */
function hasServerPermission(db: Database.Database, roleId: string, module: ModuleId, action: PermissionAction): boolean {
  const row = db.prepare("SELECT modules_json FROM permissions WHERE role_id = ?").get(roleId) as
    | { modules_json: string }
    | undefined;
  if (!row) return false;

  const modules = JSON.parse(row.modules_json) as ModulePermission[];
  const entry = modules.find((m) => m.module === module);
  return Boolean(entry?.actions?.[action]);
}

/**
 * Rejects the request with 403 unless req.user's role has `action` on
 * `module`. Must run after requireAuth (needs req.user to already be set).
 */
export function requirePermission(db: Database.Database, module: ModuleId, action: PermissionAction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHENTICATED" });
      return;
    }
    if (!hasServerPermission(db, req.user.roleId, module, action)) {
      res.status(403).json({ error: "FORBIDDEN" });
      return;
    }
    next();
  };
}
