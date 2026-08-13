import type { ModulePermission, Permission, Resource } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Data access for the permission framework:
 * - resources — registry of protectable modules and their fields (read-only)
 * - permissions — module/action/field permissions per role
 *
 * Evaluation lives in src/security.
 */
class PermissionService {
  /** Registry of modules, actions and fields (static). */
  getResources(): Promise<Resource[]> {
    return apiRequest<Resource[]>("/api/resources");
  }

  getAll(): Promise<Permission[]> {
    return apiRequest<Permission[]>("/api/permissions");
  }

  async getByRoleId(roleId: string): Promise<Permission | undefined> {
    try {
      return await apiRequest<Permission>(`/api/permissions/${roleId}`);
    } catch {
      return undefined;
    }
  }

  /** Creates or replaces the permission set of a role. */
  saveForRole(roleId: string, modules: ModulePermission[]): Promise<Permission> {
    return apiRequest<Permission>(`/api/permissions/${roleId}`, {
      method: "PUT",
      body: JSON.stringify({ modules }),
    });
  }

  async deleteForRole(roleId: string): Promise<void> {
    await apiRequest<void>(`/api/permissions/${roleId}`, { method: "DELETE" });
  }
}

export const permissionService = new PermissionService();
