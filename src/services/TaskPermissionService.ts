import type { PermissionContextValue } from "@/security";
import type { Employee, Task } from "@/types";

/**
 * Task-specific permission helpers on top of the application's permission
 * framework (src/security). A task is "own" when the user is its assignee
 * OR its reporter — both need to work with it under the "own" scope.
 *
 * No role names appear here: everything derives from module/action/scope
 * grants of the "tasks" module.
 */
class TaskPermissionService {
  isOwnTask(task: Task, employeeId: string | undefined): boolean {
    return Boolean(employeeId) && (task.assigneeId === employeeId || task.reporterId === employeeId);
  }

  /** Tasks visible to the user under the module's view scope. */
  scopeTasks(tasks: Task[], permission: PermissionContextValue, employeeId: string | undefined): Task[] {
    if (permission.getViewScope("tasks") !== "own") return tasks;
    return tasks.filter((task) => this.isOwnTask(task, employeeId));
  }

  canEditTask(task: Task, permission: PermissionContextValue, employeeId: string | undefined): boolean {
    if (!permission.canEdit("tasks")) return false;
    return permission.getEditScope("tasks") !== "own" || this.isOwnTask(task, employeeId);
  }

  canDeleteTask(task: Task, permission: PermissionContextValue, employeeId: string | undefined): boolean {
    if (!permission.canDelete("tasks")) return false;
    return permission.getEditScope("tasks") !== "own" || this.isOwnTask(task, employeeId);
  }

  canComment(permission: PermissionContextValue): boolean {
    return permission.hasPermission("tasks", "comment");
  }

  canAssignOthers(permission: PermissionContextValue): boolean {
    return permission.hasPermission("tasks", "assign");
  }

  /** Without the assign permission, users may only assign themselves. */
  assigneeOptions(
    employees: Employee[],
    permission: PermissionContextValue,
    currentUser: Employee | null
  ): Employee[] {
    if (this.canAssignOthers(permission)) return employees;
    return currentUser ? employees.filter((e) => e.id === currentUser.id) : [];
  }
}

export const taskPermissionService = new TaskPermissionService();
