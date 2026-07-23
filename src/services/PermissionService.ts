import permissionsData from "@/data/permissions.json";
import resourcesData from "@/data/resources.json";
import type { ModulePermission, Permission, Resource } from "@/types";
import { simulateRequest } from "./BaseService";

const seedPermissions = permissionsData as Permission[];
const resources = resourcesData as Resource[];

const STORAGE_KEY = "ai-portfolio-dashboard.permissions";

/**
 * Data access for the permission framework:
 * - resources.json — static registry of protectable modules and their fields
 * - permissions.json — module/action/field permissions per role
 *
 * Permission edits (Roles admin page) persist to Local Storage; the JSON
 * files remain the seed data. Evaluation lives in src/security.
 */
class PermissionService {
  private load(): Permission[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return this.mergeWithSeed(JSON.parse(stored) as Permission[]);
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedPermissions;
  }

  /**
   * Modules shipped after a Local Storage snapshot was saved (e.g. the Task
   * Board) would otherwise be missing and silently denied. Merge in seed
   * roles and modules the stored copy does not know about, without touching
   * any grants the user has edited.
   */
  private mergeWithSeed(stored: Permission[]): Permission[] {
    const byRole = new Map(stored.map((permission) => [permission.roleId, permission]));
    for (const seed of seedPermissions) {
      const existing = byRole.get(seed.roleId);
      if (!existing) {
        byRole.set(seed.roleId, seed);
        continue;
      }
      const known = new Set(existing.modules.map((m) => m.module));
      const missing = seed.modules.filter((m) => !known.has(m.module));
      if (missing.length > 0) {
        byRole.set(seed.roleId, { ...existing, modules: [...existing.modules, ...missing] });
      }
    }
    return [...byRole.values()];
  }

  private persist(permissions: Permission[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissions));
  }

  /** Registry of modules, actions and fields (static). */
  getResources(): Promise<Resource[]> {
    return simulateRequest(resources);
  }

  getAll(): Promise<Permission[]> {
    return simulateRequest(this.load());
  }

  async getByRoleId(roleId: string): Promise<Permission | undefined> {
    return simulateRequest(this.load().find((permission) => permission.roleId === roleId));
  }

  /** Creates or replaces the permission set of a role. */
  async saveForRole(roleId: string, modules: ModulePermission[]): Promise<Permission> {
    const all = this.load();
    const next: Permission = { roleId, modules };
    const index = all.findIndex((permission) => permission.roleId === roleId);
    if (index === -1) all.push(next);
    else all[index] = next;
    this.persist(all);
    return simulateRequest(next);
  }

  async deleteForRole(roleId: string): Promise<void> {
    this.persist(this.load().filter((permission) => permission.roleId !== roleId));
    await simulateRequest(undefined);
  }
}

export const permissionService = new PermissionService();
