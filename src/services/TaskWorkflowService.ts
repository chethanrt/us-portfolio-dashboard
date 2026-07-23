import taskCategoriesData from "@/data/taskCategories.json";
import taskWorkflowData from "@/data/taskWorkflow.json";
import type { TaskCategory, TaskWorkflowStatus } from "@/types";
import { simulateRequest } from "./BaseService";

const workflow = (taskWorkflowData as TaskWorkflowStatus[]).slice().sort((a, b) => a.order - b.order);
const categories = taskCategoriesData as TaskCategory[];

/**
 * Task Board configuration (docs/11): workflow columns and categories are
 * loaded from JSON, never hardcoded. Also owns status-transition helpers.
 */
class TaskWorkflowService {
  getWorkflow(): Promise<TaskWorkflowStatus[]> {
    return simulateRequest(workflow);
  }

  getCategories(): Promise<TaskCategory[]> {
    return simulateRequest(categories);
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
