import employeesData from "@/data/employees.json";
import type { Employee, Role } from "@/types";
import { simulateRequest } from "./BaseService";

const seedEmployees = employeesData as Employee[];

const STORAGE_KEY = "ai-portfolio-dashboard.employees";

/**
 * Employees support full CRUD, plus offboarding. Mutations persist to Local
 * Storage (JSON file remains the seed). Employees are never hard-deleted —
 * removing one sets `status: "Ex-Employee"` instead, so their historical
 * activities/POCs/learning records stay valid and their profile is still
 * visible (per docs/01 §7); `offboard()` also reassigns anyone who reported
 * to them so the manager hierarchy never points at a departed employee.
 */
class EmployeeService {
  private load(): Employee[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Employee[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedEmployees;
  }

  private persist(employees: Employee[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }

  private nextId(employees: Employee[]): string {
    const maxNumber = employees.reduce((max, employee) => {
      const number = Number(employee.id.replace("EMP", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `EMP${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<Employee[]> {
    return simulateRequest(this.load());
  }

  async getById(id: string): Promise<Employee | undefined> {
    const all = await this.getAll();
    return all.find((employee) => employee.id === id);
  }

  async getByRole(role: Role): Promise<Employee[]> {
    const all = await this.getAll();
    return all.filter((employee) => employee.role === role);
  }

  async create(input: Omit<Employee, "id">): Promise<Employee> {
    const all = this.load();
    const created: Employee = { ...input, id: this.nextId(all) };
    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<Employee, "id">): Promise<Employee> {
    const all = this.load();
    const index = all.findIndex((employee) => employee.id === id);
    if (index === -1) throw new Error(`Employee ${id} not found`);
    const updated: Employee = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  /**
   * Marks an employee as an Ex-Employee instead of deleting their record, and
   * reassigns each direct report to the manager chosen for them in
   * `reassignments` (map of reportId -> newManagerId). Throws if a direct
   * report was left without a replacement manager.
   */
  async offboard(id: string, reassignments: Record<string, string>): Promise<Employee> {
    const all = this.load();
    if (!all.some((employee) => employee.id === id)) {
      throw new Error(`Employee ${id} not found`);
    }
    const directReports = all.filter((employee) => employee.managerId === id && employee.status !== "Ex-Employee");
    const missing = directReports.find((report) => !reassignments[report.id]);
    if (missing) {
      throw new Error("REPORTS_UNASSIGNED");
    }

    const updated = all.map((employee) => {
      if (employee.id === id) return { ...employee, status: "Ex-Employee" as const };
      const newManagerId = reassignments[employee.id];
      return newManagerId ? { ...employee, managerId: newManagerId } : employee;
    });
    this.persist(updated);
    return simulateRequest(updated.find((employee) => employee.id === id)!);
  }
}

export const employeeService = new EmployeeService();
