import employeesData from "@/data/employees.json";
import type { Employee, Role } from "@/types";
import { simulateRequest } from "./BaseService";
import { activityService } from "./ActivityService";
import { pocService } from "./POCService";

const seedEmployees = employeesData as Employee[];

const STORAGE_KEY = "ai-portfolio-dashboard.employees";

/**
 * Employees support full CRUD. Mutations persist to Local Storage
 * (JSON file remains the seed). Deletion is blocked while the employee
 * is referenced by activities or POCs to keep the JSON relations valid.
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

  /** Throws if the employee is still referenced by activities or POCs. */
  async delete(id: string): Promise<void> {
    const [activities, pocs] = await Promise.all([
      activityService.getByEmployee(id),
      pocService.getByOwner(id),
    ]);
    if (activities.length > 0 || pocs.length > 0) {
      throw new Error("REFERENCED");
    }
    this.persist(this.load().filter((employee) => employee.id !== id));
    await simulateRequest(undefined);
  }
}

export const employeeService = new EmployeeService();
