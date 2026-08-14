import type { ModulePermission, UserPermissionOverride } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Data access for per-user permission overrides — additions/removals a
 * specific user holds on top of their role's defaults. Evaluation
 * (merging with the role) lives in src/security/PermissionService.
 */
class PermissionOverrideService {
  getAll(): Promise<UserPermissionOverride[]> {
    return apiRequest<UserPermissionOverride[]>("/api/permission-overrides");
  }

  /** Always resolves — returns `{ userId, modules: [] }` when the user has no overrides yet. */
  getByUserId(userId: string): Promise<UserPermissionOverride> {
    return apiRequest<UserPermissionOverride>(`/api/permission-overrides/${userId}`);
  }

  /** Creates or replaces the override set of a user. */
  saveForUser(userId: string, modules: ModulePermission[]): Promise<UserPermissionOverride> {
    return apiRequest<UserPermissionOverride>(`/api/permission-overrides/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ modules }),
    });
  }

  async deleteForUser(userId: string): Promise<void> {
    await apiRequest<void>(`/api/permission-overrides/${userId}`, { method: "DELETE" });
  }
}

export const permissionOverrideService = new PermissionOverrideService();
