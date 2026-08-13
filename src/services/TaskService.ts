import type { Task, TaskComment } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Task Board CRUD. Board ordering, filtering and statistics live in the
 * dedicated Task* services. createdDate/updatedDate and the id/taskNumber
 * pair are stamped server-side (server/routes/tasks.ts).
 */
class TaskService {
  getAll(): Promise<Task[]> {
    return apiRequest<Task[]>("/api/tasks");
  }

  async getById(id: string): Promise<Task | undefined> {
    try {
      return await apiRequest<Task>(`/api/tasks/${id}`);
    } catch {
      return undefined;
    }
  }

  create(input: Omit<Task, "id" | "taskNumber" | "createdDate" | "updatedDate">): Promise<Task> {
    return apiRequest<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) });
  }

  update(id: string, changes: Partial<Omit<Task, "id" | "taskNumber">>, modifiedBy: string): Promise<Task> {
    return apiRequest<Task>(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ ...changes, lastModifiedBy: modifiedBy }),
    });
  }

  /** Batch update used by drag-and-drop (status + displayOrder changes). */
  async updateMany(changes: Map<string, Partial<Task>>, modifiedBy: string): Promise<Task[]> {
    await Promise.all([...changes.entries()].map(([id, change]) => this.update(id, change, modifiedBy)));
    return this.getAll();
  }

  delete(id: string): Promise<void> {
    return apiRequest<void>(`/api/tasks/${id}`, { method: "DELETE" });
  }

  /** Copies title/description/category/labels/estimate into a new To Do task. */
  async duplicate(id: string, reporterId: string, defaultStatus: string): Promise<Task> {
    const source = await this.getById(id);
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

  setArchived(id: string, archived: boolean, modifiedBy: string): Promise<Task> {
    return this.update(id, { archived }, modifiedBy);
  }

  async addComment(id: string, comment: Omit<TaskComment, "id">, modifiedBy: string): Promise<Task> {
    const task = await this.getById(id);
    if (!task) throw new Error(`Task ${id} not found`);
    const created: TaskComment = { ...comment, id: `cmt-${id}-${task.comments.length + 1}-${Date.now()}` };
    return this.update(id, { comments: [...task.comments, created] }, modifiedBy);
  }
}

export const taskService = new TaskService();
