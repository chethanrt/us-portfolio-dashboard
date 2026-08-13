import type { Role } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Assignable application roles. Permissions attached to a role live in
 * PermissionService. Id generation (kebab-case slug) and system-role
 * protections now live server-side (server/db/ids.ts, server/routes/roles.ts);
 * the pre-flight checks below just avoid an unnecessary round trip.
 */
class RoleService {
  getAll(): Promise<Role[]> {
    return apiRequest<Role[]>("/api/roles");
  }

  async getById(id: string): Promise<Role | undefined> {
    try {
      return await apiRequest<Role>(`/api/roles/${id}`);
    } catch {
      return undefined;
    }
  }

  async create(input: Pick<Role, "name" | "description">): Promise<Role> {
    const all = await this.getAll();
    if (all.some((r) => r.name.trim().toLowerCase() === input.name.trim().toLowerCase())) {
      throw new Error("DUPLICATE_NAME");
    }
    return apiRequest<Role>("/api/roles", {
      method: "POST",
      body: JSON.stringify({ name: input.name.trim(), description: input.description.trim() }),
    });
  }

  async update(id: string, input: Pick<Role, "name" | "description">): Promise<Role> {
    const all = await this.getAll();
    const current = all.find((role) => role.id === id);
    if (!current) throw new Error(`Role ${id} not found`);
    // System role names are stable — permission checks and seed users rely on them.
    return apiRequest<Role>(`/api/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: current.isSystem ? current.name : input.name.trim(),
        description: input.description.trim(),
      }),
    });
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const role = all.find((r) => r.id === id);
    if (role?.isSystem) throw new Error("SYSTEM_ROLE");
    await apiRequest<void>(`/api/roles/${id}`, { method: "DELETE" });
  }
}

export const roleService = new RoleService();
