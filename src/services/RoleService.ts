import rolesData from "@/data/roles.json";
import type { Role } from "@/types";
import { simulateRequest } from "./BaseService";

const seedRoles = rolesData as Role[];

const STORAGE_KEY = "ai-portfolio-dashboard.roles";

/**
 * Assignable application roles (roles.json). Mutations persist to Local
 * Storage; the JSON file remains the seed data. Permissions attached to a
 * role live in PermissionService.
 */
class RoleService {
  private load(): Role[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Role[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedRoles;
  }

  private persist(roles: Role[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
  }

  /** Kebab-case id from the role name, made unique against existing roles. */
  private buildId(name: string, roles: Role[]): string {
    const base =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "role";
    let id = base;
    let counter = 2;
    while (roles.some((role) => role.id === id)) {
      id = `${base}-${counter}`;
      counter += 1;
    }
    return id;
  }

  getAll(): Promise<Role[]> {
    return simulateRequest(this.load());
  }

  async getById(id: string): Promise<Role | undefined> {
    return simulateRequest(this.load().find((role) => role.id === id));
  }

  async create(input: Pick<Role, "name" | "description">): Promise<Role> {
    const all = this.load();
    if (all.some((r) => r.name.trim().toLowerCase() === input.name.trim().toLowerCase())) {
      throw new Error("DUPLICATE_NAME");
    }
    const created: Role = {
      id: this.buildId(input.name, all),
      name: input.name.trim(),
      description: input.description.trim(),
      isSystem: false,
    };
    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, input: Pick<Role, "name" | "description">): Promise<Role> {
    const all = this.load();
    const index = all.findIndex((role) => role.id === id);
    if (index === -1) throw new Error(`Role ${id} not found`);
    const current = all[index];
    // System role names are stable — permission checks and seed users rely on them.
    const updated: Role = {
      ...current,
      name: current.isSystem ? current.name : input.name.trim(),
      description: input.description.trim(),
    };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    const all = this.load();
    const role = all.find((r) => r.id === id);
    if (role?.isSystem) throw new Error("SYSTEM_ROLE");
    this.persist(all.filter((r) => r.id !== id));
    await simulateRequest(undefined);
  }
}

export const roleService = new RoleService();
