import projectsData from "@/data/projects.json";
import type { Project } from "@/types";
import { simulateRequest } from "./BaseService";
import { activityService } from "./ActivityService";
import { pocService } from "./POCService";

const seedProjects = projectsData as Project[];

const STORAGE_KEY = "ai-portfolio-dashboard.projects";

/**
 * Projects support full CRUD. Mutations persist to Local Storage
 * (JSON file remains the seed). Deletion is blocked while the project
 * is referenced by activities or POCs to keep the JSON relations valid.
 */
class ProjectService {
  private load(): Project[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Project[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedProjects;
  }

  private persist(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  private nextId(projects: Project[]): string {
    const maxNumber = projects.reduce((max, project) => {
      const number = Number(project.id.replace("P", ""));
      return Number.isFinite(number) && number > max ? number : max;
    }, 0);
    return `P${String(maxNumber + 1).padStart(3, "0")}`;
  }

  getAll(): Promise<Project[]> {
    return simulateRequest(this.load());
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
    const all = this.load();
    const created: Project = { ...input, id: this.nextId(all) };
    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, input: Omit<Project, "id">): Promise<Project> {
    const all = this.load();
    const index = all.findIndex((project) => project.id === id);
    if (index === -1) throw new Error(`Project ${id} not found`);
    const updated: Project = { ...input, id };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  /** Throws if the project is still referenced by activities or POCs. */
  async delete(id: string): Promise<void> {
    const [activities, pocs] = await Promise.all([
      activityService.getByProject(id),
      pocService.getAll(),
    ]);
    if (activities.length > 0 || pocs.some((poc) => poc.projectId === id)) {
      throw new Error("REFERENCED");
    }
    this.persist(this.load().filter((project) => project.id !== id));
    await simulateRequest(undefined);
  }
}

export const projectService = new ProjectService();
