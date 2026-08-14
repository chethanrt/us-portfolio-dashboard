import type { User } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * `password` is optional here on purpose: the server hashes whatever
 * plaintext password it's given (see server/routes/users.ts), and only
 * touches the `password` column at all when the key is present in the
 * request body (server/routes/_fields.ts's toRow skips absent keys) — so
 * omitting it entirely on an update leaves the stored hash untouched
 * instead of re-hashing an already-hashed value back onto itself.
 */
export type UserInput = Omit<User, "id" | "password"> & { password?: string };

/**
 * Login accounts with full CRUD (permission-gated in the UI). Real
 * server-side authentication: passwords are bcrypt-hashed, and a session is
 * a random token in an HTTP-only cookie the server issues and verifies —
 * see server/routes/users.ts and AUTHENTICATION_IMPLEMENTATION_PLAN.md.
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
  async authenticate(username: string, password: string): Promise<User | null> {
    try {
      return await apiRequest<User>("/api/users/authenticate", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
    } catch {
      return null;
    }
  }

  /** Who's currently signed in, per the session cookie — null if not signed in. */
  async me(): Promise<User | null> {
    try {
      return await apiRequest<User>("/api/users/me");
    } catch {
      return null;
    }
  }

  /** Invalidates the session server-side and clears the cookie. */
  async logout(): Promise<void> {
    await apiRequest<void>("/api/users/logout", { method: "POST" });
  }

  create(input: UserInput): Promise<User> {
    return apiRequest<User>("/api/users", { method: "POST", body: JSON.stringify(input) });
  }

  update(id: string, input: UserInput): Promise<User> {
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
