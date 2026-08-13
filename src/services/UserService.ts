import type { User } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Login accounts with full CRUD (permission-gated in the UI).
 * Client-side demo authentication — no backend, no hashing.
 */
class UserService {
  getAll(): Promise<User[]> {
    return apiRequest<User[]>("/api/users");
  }

  async getById(id: string): Promise<User | undefined> {
    const all = await this.getAll();
    return all.find((user) => user.id === id);
  }

  /** Returns the user on success, null on bad credentials or inactive account. */
  authenticate(username: string, password: string): Promise<User | null> {
    return apiRequest<User | null>("/api/users/authenticate", {
      method: "POST",
      body: JSON.stringify({ username: username.trim(), password }),
    });
  }

  create(input: Omit<User, "id">): Promise<User> {
    return apiRequest<User>("/api/users", { method: "POST", body: JSON.stringify(input) });
  }

  update(id: string, input: Omit<User, "id">): Promise<User> {
    return apiRequest<User>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(input) });
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll();
    const user = all.find((u) => u.id === id);
    // Never delete the last active Super Admin — that would lock everyone out.
    if (user?.roleId === "super-admin") {
      const remainingAdmins = all.filter((u) => u.id !== id && u.roleId === "super-admin" && u.status === "Active");
      if (remainingAdmins.length === 0) throw new Error("LAST_ADMIN");
    }
    await apiRequest<void>(`/api/users/${id}`, { method: "DELETE" });
  }

  /** Number of accounts assigned to a role (used before deleting a role). */
  async countByRole(roleId: string): Promise<number> {
    const all = await this.getAll();
    return all.filter((user) => user.roleId === roleId).length;
  }
}

export const userService = new UserService();
