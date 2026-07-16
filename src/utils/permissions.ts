import type { UserRole } from "@/types";

/**
 * Role permissions.
 * - Super Admin and Director: full access to everything.
 * - Delivery Manager, Engineering Manager, Senior Tech Lead: full access to
 *   all modules EXCEPT Settings editing and User Management.
 * - Tech Lead: manages team data.
 * - Senior Developer, Developer, Intern: own data only.
 */

/** Full-access roles (everything except where noted). */
const ADMIN_ROLES: UserRole[] = ["Super Admin", "Director"];
const MANAGER_ROLES: UserRole[] = ["Delivery Manager", "Engineering Manager", "Senior Tech Lead"];

function isAdmin(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

function isManager(role: UserRole): boolean {
  return MANAGER_ROLES.includes(role);
}

/** Dashboard data scope. */
export type DashboardScope = "portfolio" | "team" | "personal";

export function getDashboardScope(role: UserRole): DashboardScope {
  if (isAdmin(role) || isManager(role)) return "portfolio";
  if (role === "Tech Lead") return "team";
  return "personal";
}

/** Projects: admins + managers create projects. */
export function canManageProjects(role: UserRole): boolean {
  return isAdmin(role) || isManager(role);
}

/** Edit/delete a specific project: admins + managers, any project. */
export function canEditProject(role: UserRole, _projectManager: string, _currentUserName: string | undefined): boolean {
  return isAdmin(role) || isManager(role);
}

/** People: admins + managers manage employees. */
export function canManagePeople(role: UserRole): boolean {
  return isAdmin(role) || isManager(role);
}

/** Activities/Learning: every role can log records. */
export function canAddOwnRecords(_role: UserRole): boolean {
  return true;
}

/** Roles limited to their own records (activities, learning, POCs, people, skills, reports). */
export function isOwnDataRole(role: UserRole): boolean {
  return role === "Senior Developer" || role === "Developer" || role === "Intern";
}

/** Edit/delete an activity or learning record. */
export function canEditRecord(role: UserRole, recordEmployeeId: string, currentEmployeeId: string | undefined): boolean {
  if (isAdmin(role) || isManager(role) || role === "Tech Lead") return true;
  return recordEmployeeId === currentEmployeeId;
}

/** POCs: everyone except Intern can create. */
export function canCreatePOC(role: UserRole): boolean {
  return role !== "Intern";
}

/** POCs: admins + managers edit any; creators edit their own. */
export function canEditPOC(role: UserRole, ownerId: string, currentEmployeeId: string | undefined): boolean {
  if (isAdmin(role) || isManager(role)) return true;
  if (role === "Tech Lead" || role === "Senior Developer" || role === "Developer") {
    return ownerId === currentEmployeeId;
  }
  return false;
}

/** Settings: only Super Admin + Director edit; DM/EM keep a read-only view. */
export function canEditSettings(role: UserRole): boolean {
  return isAdmin(role);
}

/** User accounts: only Super Admin + Director. */
export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role);
}
