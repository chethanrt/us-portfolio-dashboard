import type { Employee, EmployeeRole } from "@/types";
import { apiRequest } from "./BaseService";
import { roleService } from "./RoleService";
import { userService } from "./UserService";

const DEFAULT_PASSWORD = "Welcome@123";

/** firstname.lastname, deduplicated against existing usernames (e.g. "jane.doe", "jane.doe2"). */
async function generateUsername(name: string): Promise<string> {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(".") || "user";
  const existing = new Set((await userService.getAll()).map((u) => u.username.toLowerCase()));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

/**
 * Employees support full CRUD, plus offboarding. Employees are never
 * hard-deleted — removing one sets `status: "Ex-Employee"` instead, so
 * their historical activities/POCs/learning records stay valid and their
 * profile is still visible; `offboard()` also reassigns anyone who reported
 * to them so the manager hierarchy never points at a departed employee.
 */
class EmployeeService {
  getAll(): Promise<Employee[]> {
    return apiRequest<Employee[]>("/api/employees");
  }

  async getById(id: string): Promise<Employee | undefined> {
    const all = await this.getAll();
    return all.find((employee) => employee.id === id);
  }

  async getByRole(role: EmployeeRole): Promise<Employee[]> {
    const all = await this.getAll();
    return all.filter((employee) => employee.role === role);
  }

  /**
   * Creates the employee, then a matching login account (People + User
   * Management should never drift apart) with a generated username and the
   * default password, in whatever role shares the employee's role name.
   */
  async create(input: Omit<Employee, "id">): Promise<Employee> {
    const created = await apiRequest<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(input),
    });

    const [username, roles] = await Promise.all([generateUsername(created.name), roleService.getAll()]);
    const roleId = roles.find((r) => r.name === created.role)?.id ?? "developer";
    await userService.create({
      username,
      password: DEFAULT_PASSWORD,
      roleId,
      employeeId: created.id,
      status: "Active",
    });

    return created;
  }

  update(id: string, input: Omit<Employee, "id">): Promise<Employee> {
    return apiRequest<Employee>(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  /**
   * Marks an employee as an Ex-Employee instead of deleting their record, and
   * reassigns each direct report to the manager chosen for them in
   * `reassignments` (map of reportId -> newManagerId). Throws if a direct
   * report was left without a replacement manager.
   */
  async offboard(id: string, reassignments: Record<string, string>): Promise<Employee> {
    const all = await this.getAll();
    const target = all.find((employee) => employee.id === id);
    if (!target) throw new Error(`Employee ${id} not found`);

    const directReports = all.filter((employee) => employee.managerId === id && employee.status !== "Ex-Employee");
    const missing = directReports.find((report) => !reassignments[report.id]);
    if (missing) throw new Error("REPORTS_UNASSIGNED");

    await Promise.all(
      Object.entries(reassignments).map(([reportId, newManagerId]) => {
        const report = all.find((employee) => employee.id === reportId);
        if (!report) return Promise.resolve();
        return this.update(reportId, { ...report, managerId: newManagerId });
      })
    );

    const updatedTarget = await this.update(id, { ...target, status: "Ex-Employee" });

    // A departed employee shouldn't keep an active login; no-op if there wasn't one.
    const account = (await userService.getAll()).find((u) => u.employeeId === id);
    if (account && account.status === "Active") {
      await userService.update(account.id, { ...account, status: "Inactive" });
    }

    return updatedTarget;
  }

  /**
   * Keeps each employee's `projects` list in sync with one project's team
   * membership: adds the project name for newly added members, removes it
   * for members dropped from the team. Employees who were never part of
   * `previousMemberIds` (e.g. tagged manually from the People form without
   * formal team membership) are left untouched. Called by ProjectService on
   * create/update.
   */
  async syncProjectMembership(projectName: string, memberIds: string[], previousMemberIds: string[] = []): Promise<void> {
    const all = await this.getAll();
    const memberSet = new Set(memberIds);
    const previousSet = new Set(previousMemberIds);
    const updates: Employee[] = [];
    for (const employee of all) {
      const isMember = memberSet.has(employee.id);
      const wasMember = previousSet.has(employee.id);
      const hasProject = employee.projects.includes(projectName);
      if (isMember && !hasProject) {
        updates.push({ ...employee, projects: [...employee.projects, projectName] });
      } else if (!isMember && wasMember && hasProject) {
        updates.push({ ...employee, projects: employee.projects.filter((name) => name !== projectName) });
      }
    }
    await Promise.all(updates.map((employee) => this.update(employee.id, employee)));
  }

  /** Removes a project name from every employee's `projects` list (project deleted or renamed). */
  async removeProjectEverywhere(projectName: string): Promise<void> {
    const all = await this.getAll();
    const updates = all
      .filter((employee) => employee.projects.includes(projectName))
      .map((employee) => ({ ...employee, projects: employee.projects.filter((name) => name !== projectName) }));
    await Promise.all(updates.map((employee) => this.update(employee.id, employee)));
  }
}

export const employeeService = new EmployeeService();
