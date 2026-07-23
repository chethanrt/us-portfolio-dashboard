import usersData from "@/data/users.json";
import type { User } from "@/types";
import { simulateRequest } from "./BaseService";

const seedUsers = usersData as User[];

const STORAGE_KEY = "ai-portfolio-dashboard.users";

/** Maps pre-framework role names to role ids (legacy Local Storage data). */
const LEGACY_ROLE_IDS: Record<string, string> = {
  "Super Admin": "super-admin",
  Director: "director",
  "Delivery Manager": "delivery-manager",
  "Engineering Manager": "engineering-manager",
  "Senior Tech Lead": "senior-tech-lead",
  "Tech Lead": "tech-lead",
  "Senior Developer": "senior-developer",
  Developer: "developer",
  Intern: "intern",
};

/**
 * Login accounts with full CRUD (permission-gated in the UI).
 * Client-side demo authentication — no backend, no hashing. Mutations
 * persist to Local Storage; users.json remains the seed data.
 */
class UserService {
  private load(): User[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as (User & { role?: string })[];
        // Migrate accounts stored before the permission framework existed.
        return parsed.map(({ role, ...user }) => ({
          ...user,
          roleId: user.roleId ?? LEGACY_ROLE_IDS[role ?? ""] ?? "intern",
        }));
      }
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedUsers;
  }

  private persist(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  private nextId(users: User[]): string {
    const maxNumber = users.reduce((max, user) => {
      const number = Number(user.id.replace("USR", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `USR${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<User[]> {
    return simulateRequest(this.load());
  }

  async getById(id: string): Promise<User | undefined> {
    const all = await this.getAll();
    return all.find((user) => user.id === id);
  }

  /** Returns the user on success, null on bad credentials or inactive account. */
  async authenticate(username: string, password: string): Promise<User | null> {
    const all = this.load();
    const user = all.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (!user || user.status !== "Active") return simulateRequest(null);
    return simulateRequest(user);
  }

  async create(input: Omit<User, "id">): Promise<User> {
    const all = this.load();
    const created: User = { ...input, id: this.nextId(all) };
    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<User, "id">): Promise<User> {
    const all = this.load();
    const index = all.findIndex((user) => user.id === id);
    if (index === -1) throw new Error(`User ${id} not found`);
    const updated: User = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    const all = this.load();
    const user = all.find((u) => u.id === id);
    // Never delete the last active Super Admin — that would lock everyone out.
    if (user?.roleId === "super-admin") {
      const remainingAdmins = all.filter(
        (u) => u.id !== id && u.roleId === "super-admin" && u.status === "Active"
      );
      if (remainingAdmins.length === 0) throw new Error("LAST_ADMIN");
    }
    this.persist(all.filter((u) => u.id !== id));
    await simulateRequest(undefined);
  }

  /** Number of accounts assigned to a role (used before deleting a role). */
  async countByRole(roleId: string): Promise<number> {
    return simulateRequest(this.load().filter((user) => user.roleId === roleId).length);
  }
}

export const userService = new UserService();
