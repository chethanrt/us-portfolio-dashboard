/**
 * @deprecated Most hardcoded role checks that used to live here were replaced
 * by the permission framework in src/security. Use usePermission() —
 * hasPermission / canView / canCreate / canEdit / canDelete / canExport /
 * canViewField / canEditField / canEditRow / canDeleteRow — instead of role
 * comparisons.
 *
 * The calendar helpers below are the one exception: they stay here because
 * the calendar feature isn't a registered module in resources.json yet, and
 * its dual-owner semantics (whose calendar it is vs. who authored the block)
 * don't fit the framework's single-scope ("all"/"own") model. They key off
 * the signed-in user's role id (usePermission().role?.id) instead of the old
 * closed UserRole union, which no longer exists.
 */
export type { DashboardScope } from "@/security";

const ADMIN_ROLE_IDS = new Set(["super-admin", "director"]);
const MANAGER_ROLE_IDS = new Set(["delivery-manager", "engineering-manager", "senior-tech-lead"]);

function isAdminRole(roleId: string | undefined): boolean {
  return Boolean(roleId && ADMIN_ROLE_IDS.has(roleId));
}

function isManagerRole(roleId: string | undefined): boolean {
  return Boolean(roleId && MANAGER_ROLE_IDS.has(roleId));
}

/**
 * Calendar: view a given employee's calendar.
 * Admins/Managers/Tech Lead see any calendar; own-data roles see only their own.
 */
export function canViewCalendar(
  roleId: string | undefined,
  targetEmployeeId: string,
  currentEmployeeId: string | undefined
): boolean {
  if (isAdminRole(roleId) || isManagerRole(roleId) || roleId === "tech-lead") return true;
  return targetEmployeeId === currentEmployeeId;
}

/**
 * Calendar: create an event on a given employee's calendar.
 * Admins/Managers/Tech Lead can block time on anyone's calendar; Senior
 * Developer/Developer only on their own; Intern is view-only.
 */
export function canCreateCalendarEvent(
  roleId: string | undefined,
  targetEmployeeId: string,
  currentEmployeeId: string | undefined
): boolean {
  if (isAdminRole(roleId) || isManagerRole(roleId) || roleId === "tech-lead") return true;
  if (roleId === "senior-developer" || roleId === "developer") return targetEmployeeId === currentEmployeeId;
  return false;
}

/**
 * Calendar: edit a specific event.
 * Admins/Managers edit any event; Tech Lead only events they created;
 * Senior Developer/Developer only their own created events; Intern never.
 */
export function canEditCalendarEvent(
  roleId: string | undefined,
  event: { createdBy: string },
  currentEmployeeId: string | undefined
): boolean {
  if (isAdminRole(roleId) || isManagerRole(roleId)) return true;
  if (roleId === "tech-lead" || roleId === "senior-developer" || roleId === "developer") {
    return event.createdBy === currentEmployeeId;
  }
  return false;
}

/**
 * Calendar: delete a specific event. Same shape as edit — a Lead cannot
 * delete an event created by someone else.
 */
export function canDeleteCalendarEvent(
  roleId: string | undefined,
  event: { createdBy: string },
  currentEmployeeId: string | undefined
): boolean {
  return canEditCalendarEvent(roleId, event, currentEmployeeId);
}
