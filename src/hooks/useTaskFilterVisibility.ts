import { useVisibilityPreference } from "./useVisibilityPreference";

/** Keys for the Task Board's dropdown filters (Archived stays a fixed checkbox). */
export type TaskFilterKey =
  | "project"
  | "type"
  | "category"
  | "status"
  | "priority"
  | "assignee"
  | "reporter"
  | "aiTool"
  | "label"
  | "due";

export const TASK_FILTER_KEYS: TaskFilterKey[] = [
  "project",
  "type",
  "category",
  "status",
  "priority",
  "assignee",
  "reporter",
  "aiTool",
  "label",
  "due",
];

export const TASK_FILTER_LABELS: Record<TaskFilterKey, string> = {
  project: "Projects",
  type: "Types",
  category: "Categories",
  status: "Statuses",
  priority: "Priorities",
  assignee: "Assignees",
  reporter: "Reporters",
  aiTool: "AI Tools",
  label: "Labels",
  due: "Due Dates",
};

const STORAGE_KEY = "ai-portfolio-dashboard.taskboard.visibleFilters";

/**
 * Personal, per-browser preference for which Task Board filter dropdowns are
 * shown. Defaults to all filters visible; users opt out via Customize.
 */
export function useTaskFilterVisibility() {
  return useVisibilityPreference(STORAGE_KEY, TASK_FILTER_KEYS, TASK_FILTER_KEYS);
}
