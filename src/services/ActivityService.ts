import activitiesData from "@/data/activities.json";
import type { Activity } from "@/types";
import { simulateRequest } from "./BaseService";

const seedActivities = activitiesData as Activity[];

const STORAGE_KEY = "ai-portfolio-dashboard.activities";

/**
 * Activities support full CRUD. Mutations persist to Local Storage
 * (per docs/04 + PROJECT_RULES) so changes survive a refresh; the JSON
 * file remains the seed data. Swapping this for a REST API later only
 * touches this class.
 */
class ActivityService {
  private load(): Activity[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Activity[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedActivities;
  }

  private persist(activities: Activity[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }

  private nextId(activities: Activity[]): string {
    const maxNumber = activities.reduce((max, activity) => {
      const number = Number(activity.id.replace("ACT", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `ACT${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<Activity[]> {
    return simulateRequest(this.load());
  }

  async getById(id: string): Promise<Activity | undefined> {
    const all = await this.getAll();
    return all.find((activity) => activity.id === id);
  }

  async getByEmployee(employeeId: string): Promise<Activity[]> {
    const all = await this.getAll();
    return all.filter((activity) => activity.employeeId === employeeId);
  }

  async getByProject(projectId: string): Promise<Activity[]> {
    const all = await this.getAll();
    return all.filter((activity) => activity.projectId === projectId);
  }

  async create(input: Omit<Activity, "id">): Promise<Activity> {
    const all = this.load();
    const created: Activity = { ...input, id: this.nextId(all) };
    this.persist([created, ...all]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<Activity, "id">): Promise<Activity> {
    const all = this.load();
    const index = all.findIndex((activity) => activity.id === id);
    if (index === -1) throw new Error(`Activity ${id} not found`);
    const updated: Activity = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  async delete(id: string): Promise<void> {
    const all = this.load();
    this.persist(all.filter((activity) => activity.id !== id));
    await simulateRequest(undefined);
  }
}

export const activityService = new ActivityService();
