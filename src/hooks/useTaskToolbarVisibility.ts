import { useVisibilityPreference } from "./useVisibilityPreference";

/** Secondary Task Board toolbar controls — hidden by default to keep the toolbar lean. */
export type TaskToolbarKey = "savedView" | "grouping" | "viewToggle" | "export" | "quickTask";

export const TASK_TOOLBAR_KEYS: TaskToolbarKey[] = [
  "savedView",
  "grouping",
  "viewToggle",
  "export",
  "quickTask",
];

export const TASK_TOOLBAR_LABELS: Record<TaskToolbarKey, string> = {
  savedView: "Saved views",
  grouping: "Group by",
  viewToggle: "Board / List toggle",
  export: "Export",
  quickTask: "Quick task",
};

const STORAGE_KEY = "ai-portfolio-dashboard.taskboard.visibleToolbarControls";

/**
 * Personal, per-browser preference for which secondary toolbar controls are
 * shown. Defaults to none visible — search and New Task stay, everything
 * else is opt-in via Customize.
 */
export function useTaskToolbarVisibility() {
  return useVisibilityPreference(STORAGE_KEY, TASK_TOOLBAR_KEYS, []);
}
