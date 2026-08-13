import type { Project } from "@/types";
import { apiRequest } from "./BaseService";
import { activityService } from "./ActivityService";
import { employeeService } from "./EmployeeService";
import { pocService } from "./POCService";

/**
 * Projects support full CRUD. Deletion is blocked while the project is
 * referenced by activities or POCs to keep the data relations valid.
 */
class ProjectService {
  getAll(): Promise<Project[]> {
    return apiRequest<Project[]>("/api/projects");
  }

  async getById(id: string): Promise<Project | undefined> {
    const all = await this.getAll();
    return all.find((project) => project.id === id);
  }

  async getByMember(employeeId: string): Promise<Project[]> {
    const all = await this.getAll();
    return all.filter((project) => project.members.includes(employeeId));
  }

  async create(input: Omit<Project, "id">): Promise<Project> {
    const created = await apiRequest<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await employeeService.syncProjectMembership(created.name, created.members);
    return created;
  }

  /** Keeps each member's People profile in sync with the team, and cleans up the old name on rename. */
  async update(id: string, input: Omit<Project, "id">): Promise<Project> {
    const previous = await this.getById(id);
    if (!previous) throw new Error(`Project ${id} not found`);

    const updated = await apiRequest<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });

    if (previous.name !== updated.name) {
      await employeeService.removeProjectEverywhere(previous.name);
    }
    await employeeService.syncProjectMembership(updated.name, updated.members, previous.members);

    return updated;
  }

  /** Throws if the project is still referenced by activities or POCs. */
  async delete(id: string): Promise<void> {
    const target = await this.getById(id);
    if (!target) throw new Error(`Project ${id} not found`);

    const [activities, pocs] = await Promise.all([activityService.getByProject(id), pocService.getAll()]);
    if (activities.length > 0 || pocs.some((poc) => poc.projectId === id)) {
      throw new Error("REFERENCED");
    }
    await apiRequest<void>(`/api/projects/${id}`, { method: "DELETE" });
    await employeeService.removeProjectEverywhere(target.name);
  }
}

export const projectService = new ProjectService();
