import { format, subDays } from "date-fns";
import type { Employee, Project, Task } from "@/types";

/** Shared lookup maps used by filtering, search and export. */
export interface TaskLookups {
  employeesById: Map<string, Employee>;
  projectsById: Map<string, Project>;
}

/** Matches ALL_FILTER used by the shared FilterSelect component. */
export const ALL = "all";

export interface TaskFilters {
  project: string; // ALL, a project id, or "standalone"
  type: string; // ALL, "Project", "Standalone"
  category: string;
  status: string;
  priority: string;
  assignee: string; // ALL or employee id
  reporter: string; // ALL or employee id
  aiTool: string;
  label: string;
  due: string; // ALL, "Overdue", "Due Today", "Due This Week"
  showArchived: boolean;
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  project: ALL,
  type: ALL,
  category: ALL,
  status: ALL,
  priority: ALL,
  assignee: ALL,
  reporter: ALL,
  aiTool: ALL,
  label: ALL,
  due: ALL,
  showArchived: false,
};

/** Predefined one-click views (docs/11 Saved Views). */
export const SAVED_VIEWS = [
  "All Tasks",
  "My Tasks",
  "Project Tasks",
  "Standalone Tasks",
  "Overdue",
  "Due Today",
  "Completed",
  "AI Tasks",
] as const;

export type SavedView = (typeof SAVED_VIEWS)[number];

function isDone(task: Task): boolean {
  return task.percentComplete >= 100 || Boolean(task.completedDate);
}

function isOverdue(task: Task, today: string): boolean {
  return Boolean(task.dueDate) && task.dueDate < today && !isDone(task);
}

/**
 * Task filtering (docs/11): all filters combine with AND. Archived tasks
 * are excluded unless showArchived is on.
 */
class TaskFilterService {
  apply(tasks: Task[], filters: TaskFilters): Task[] {
    const today = format(new Date(), "yyyy-MM-dd");
    const weekAhead = format(subDays(new Date(), -7), "yyyy-MM-dd");

    return tasks.filter((task) => {
      if (!filters.showArchived && task.archived) return false;
      if (filters.project !== ALL) {
        if (filters.project === "standalone" && task.projectId !== null) return false;
        if (filters.project !== "standalone" && task.projectId !== filters.project) return false;
      }
      if (filters.type !== ALL && task.type !== filters.type) return false;
      if (filters.category !== ALL && task.category !== filters.category) return false;
      if (filters.status !== ALL && task.status !== filters.status) return false;
      if (filters.priority !== ALL && task.priority !== filters.priority) return false;
      if (filters.assignee !== ALL && task.assigneeId !== filters.assignee) return false;
      if (filters.reporter !== ALL && task.reporterId !== filters.reporter) return false;
      if (filters.aiTool !== ALL && task.aiTool !== filters.aiTool) return false;
      if (filters.label !== ALL && !task.labels.includes(filters.label)) return false;
      if (filters.due === "Overdue" && !isOverdue(task, today)) return false;
      if (filters.due === "Due Today" && !(task.dueDate === today && !isDone(task))) return false;
      if (
        filters.due === "Due This Week" &&
        !(task.dueDate && task.dueDate >= today && task.dueDate <= weekAhead && !isDone(task))
      ) {
        return false;
      }
      return true;
    });
  }

  /** Applies a predefined view on top of the current filters. */
  applySavedView(tasks: Task[], view: SavedView, currentEmployeeId: string | undefined): Task[] {
    const today = format(new Date(), "yyyy-MM-dd");
    switch (view) {
      case "All Tasks":
        return tasks;
      case "My Tasks":
        return tasks.filter((t) => t.assigneeId === currentEmployeeId || t.reporterId === currentEmployeeId);
      case "Project Tasks":
        return tasks.filter((t) => t.type === "Project");
      case "Standalone Tasks":
        return tasks.filter((t) => t.type === "Standalone");
      case "Overdue":
        return tasks.filter((t) => isOverdue(t, today));
      case "Due Today":
        return tasks.filter((t) => t.dueDate === today && !isDone(t));
      case "Completed":
        return tasks.filter((t) => isDone(t));
      case "AI Tasks":
        return tasks.filter((t) => Boolean(t.aiTool) || t.category === "AI");
    }
  }
}

export const taskFilterService = new TaskFilterService();
