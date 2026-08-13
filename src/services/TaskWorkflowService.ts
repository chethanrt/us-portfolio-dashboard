import type { TaskCategory, TaskWorkflowStatus } from "@/types";
import { apiRequest } from "./BaseService";

/**
 * Task Board configuration: workflow columns and categories, seeded from
 * the original JSON files into the task_workflow_statuses/task_categories
 * tables. Also owns status-transition helpers.
 */
class TaskWorkflowService {
  async getWorkflow(): Promise<TaskWorkflowStatus[]> {
    const statuses = await apiRequest<TaskWorkflowStatus[]>("/api/task-workflow");
    return statuses.slice().sort((a, b) => a.order - b.order);
  }

  getCategories(): Promise<TaskCategory[]> {
    return apiRequest<TaskCategory[]>("/api/task-categories");
  }

  /** The status new tasks enter (Quick Task, duplicates): "To Do" by config order. */
  getDefaultStatus(statuses: TaskWorkflowStatus[]): TaskWorkflowStatus {
    return statuses.find((s) => !s.isFinalState && s.order > 1) ?? statuses[0];
  }

  /** Values a task gains when it moves to a status (completion mapping). */
  getTransitionChanges(
    statuses: TaskWorkflowStatus[],
    statusName: string
  ): { status: string; percentComplete: number; completedDate: string } {
    const target = statuses.find((s) => s.name === statusName);
    return {
      status: statusName,
      percentComplete: target?.percentComplete ?? 0,
      completedDate: target?.isFinalState ? new Date().toISOString().slice(0, 10) : "",
    };
  }
}

export const taskWorkflowService = new TaskWorkflowService();
