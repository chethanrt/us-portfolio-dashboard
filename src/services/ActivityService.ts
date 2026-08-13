import type { Activity } from "@/types";
import { apiRequest } from "./BaseService";

/** Activities support full CRUD. */
class ActivityService {
  getAll(): Promise<Activity[]> {
    return apiRequest<Activity[]>("/api/activities");
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

  create(input: Omit<Activity, "id">): Promise<Activity> {
    return apiRequest<Activity>("/api/activities", { method: "POST", body: JSON.stringify(input) });
  }

  update(id: string, input: Omit<Activity, "id">): Promise<Activity> {
    return apiRequest<Activity>(`/api/activities/${id}`, { method: "PUT", body: JSON.stringify(input) });
  }

  delete(id: string): Promise<void> {
    return apiRequest<void>(`/api/activities/${id}`, { method: "DELETE" });
  }
}

export const activityService = new ActivityService();
