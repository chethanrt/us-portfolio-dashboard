import tasksData from "@/data/tasks.json";
import type { Task, TaskComment } from "@/types";
import { simulateRequest } from "./BaseService";

const seedTasks = tasksData as Task[];

const STORAGE_KEY = "ai-portfolio-dashboard.tasks";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Task Board CRUD (docs/11). Mutations persist to Local Storage;
 * tasks.json remains the seed data. Board ordering, filtering and
 * statistics live in the dedicated Task* services.
 */
class TaskService {
  private load(): Task[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Task[];
    } catch {
      // fall through to seed data on corrupt storage
    }
    return seedTasks;
  }

  private persist(tasks: Task[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  private nextIds(tasks: Task[]): { id: string; taskNumber: string } {
    const max = tasks.reduce((acc, task) => {
      const number = Number(task.taskNumber.replace("TASK-", ""));
      return Number.isFinite(number) && number > acc ? number : acc;
    }, 0);
    const next = max + 1;
    return { id: `task-${String(next).padStart(3, "0")}`, taskNumber: `TASK-${String(next).padStart(4, "0")}` };
  }

  getAll(): Promise<Task[]> {
    return simulateRequest(this.load());
  }

  async getById(id: string): Promise<Task | undefined> {
    return simulateRequest(this.load().find((task) => task.id === id));
  }

  async create(input: Omit<Task, "id" | "taskNumber" | "createdDate" | "updatedDate">): Promise<Task> {
    const all = this.load();
    const created: Task = {
      ...input,
      ...this.nextIds(all),
      createdDate: today(),
      updatedDate: today(),
    };
    this.persist([...all, created]);
    return simulateRequest(created);
  }

  async update(id: string, changes: Partial<Omit<Task, "id" | "taskNumber">>, modifiedBy: string): Promise<Task> {
    const all = this.load();
    const index = all.findIndex((task) => task.id === id);
    if (index === -1) throw new Error(`Task ${id} not found`);
    const updated: Task = { ...all[index], ...changes, lastModifiedBy: modifiedBy, updatedDate: today() };
    all[index] = updated;
    this.persist(all);
    return simulateRequest(updated);
  }

  /** Batch update used by drag-and-drop (status + displayOrder changes). */
  async updateMany(changes: Map<string, Partial<Task>>, modifiedBy: string): Promise<Task[]> {
    const all = this.load().map((task) => {
      const change = changes.get(task.id);
      return change ? { ...task, ...change, lastModifiedBy: modifiedBy, updatedDate: today() } : task;
    });
    this.persist(all);
    return simulateRequest(all);
  }

  async delete(id: string): Promise<void> {
    this.persist(this.load().filter((task) => task.id !== id));
    await simulateRequest(undefined);
  }

  /** Copies title/description/category/labels/estimate into a new To Do task. */
  async duplicate(id: string, reporterId: string, defaultStatus: string): Promise<Task> {
    const source = this.load().find((task) => task.id === id);
    if (!source) throw new Error(`Task ${id} not found`);
    return this.create({
      title: `${source.title} (Copy)`,
      description: source.description,
      type: source.type,
      category: source.category,
      projectId: source.projectId,
      assigneeId: source.assigneeId,
      reporterId,
      createdBy: reporterId,
      lastModifiedBy: reporterId,
      priority: source.priority,
      status: defaultStatus,
      estimateHours: source.estimateHours,
      actualHours: 0,
      percentComplete: 0,
      startDate: "",
      dueDate: "",
      completedDate: "",
      displayOrder: 0,
      labels: [...source.labels],
      aiTool: source.aiTool,
      linkedActivityId: "",
      linkedPocId: "",
      comments: [],
      attachments: [],
      archived: false,
    });
  }

  async setArchived(id: string, archived: boolean, modifiedBy: string): Promise<Task> {
    return this.update(id, { archived }, modifiedBy);
  }

  async addComment(id: string, comment: Omit<TaskComment, "id">, modifiedBy: string): Promise<Task> {
    const task = this.load().find((t) => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    const created: TaskComment = { ...comment, id: `cmt-${id}-${task.comments.length + 1}-${Date.now()}` };
    return this.update(id, { comments: [...task.comments, created] }, modifiedBy);
  }
}

export const taskService = new TaskService();
