import type { Task, TaskPriority, TaskWorkflowStatus } from "@/types";
import type { TaskLookups } from "./TaskFilterService";

export type TaskGrouping = "Status" | "Project" | "Assignee" | "Category" | "Priority";

export const TASK_GROUPINGS: TaskGrouping[] = ["Status", "Project", "Assignee", "Category", "Priority"];

export interface TaskGroup {
  key: string;
  label: string;
  tasks: Task[];
}

const PRIORITY_ORDER: Record<TaskPriority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

function byDisplayOrder(a: Task, b: Task): number {
  return a.displayOrder - b.displayOrder || a.taskNumber.localeCompare(b.taskNumber);
}

/**
 * Board composition (docs/11): grouping tasks into columns/sections and
 * computing status + displayOrder changes after a drag-and-drop.
 */
class TaskBoardService {
  /** One column per workflow status, tasks sorted by displayOrder. */
  groupByStatus(tasks: Task[], workflow: TaskWorkflowStatus[]): TaskGroup[] {
    return workflow.map((status) => ({
      key: status.name,
      label: status.name,
      tasks: tasks.filter((task) => task.status === status.name).sort(byDisplayOrder),
    }));
  }

  /** Sections for the non-status groupings (no drag-and-drop). */
  group(tasks: Task[], grouping: TaskGrouping, workflow: TaskWorkflowStatus[], lookups: TaskLookups): TaskGroup[] {
    if (grouping === "Status") return this.groupByStatus(tasks, workflow);

    const keyOf = (task: Task): { key: string; label: string } => {
      switch (grouping) {
        case "Project":
          return task.projectId
            ? { key: task.projectId, label: lookups.projectsById.get(task.projectId)?.name ?? task.projectId }
            : { key: "standalone", label: "Standalone Tasks" };
        case "Assignee": {
          const name = lookups.employeesById.get(task.assigneeId)?.name ?? "Unassigned";
          return { key: task.assigneeId, label: name };
        }
        case "Category":
          return { key: task.category, label: task.category };
        case "Priority":
          return { key: task.priority, label: task.priority };
        default:
          return { key: "all", label: "Tasks" };
      }
    };

    const groups = new Map<string, TaskGroup>();
    for (const task of tasks) {
      const { key, label } = keyOf(task);
      const group = groups.get(key) ?? { key, label, tasks: [] };
      group.tasks.push(task);
      groups.set(key, group);
    }

    const list = [...groups.values()];
    list.forEach((group) => group.tasks.sort(byDisplayOrder));
    if (grouping === "Priority") {
      list.sort(
        (a, b) => (PRIORITY_ORDER[a.key as TaskPriority] ?? 9) - (PRIORITY_ORDER[b.key as TaskPriority] ?? 9)
      );
    } else {
      // Standalone section goes last; everything else alphabetically.
      list.sort((a, b) =>
        a.key === "standalone" ? 1 : b.key === "standalone" ? -1 : a.label.localeCompare(b.label)
      );
    }
    return list;
  }

  /**
   * Builds the persistence payload after a drop: every task in the affected
   * columns gets a fresh displayOrder; the moved task also changes status.
   */
  computeDropChanges(
    columns: TaskGroup[],
    movedTaskId: string,
    statusChanges: { status: string; percentComplete: number; completedDate: string }
  ): Map<string, Partial<Task>> {
    const changes = new Map<string, Partial<Task>>();
    for (const column of columns) {
      column.tasks.forEach((task, index) => {
        const displayOrder = index + 1;
        const change: Partial<Task> =
          task.id === movedTaskId ? { displayOrder, ...statusChanges } : { displayOrder };
        if (task.displayOrder !== displayOrder || task.id === movedTaskId) changes.set(task.id, change);
      });
    }
    return changes;
  }
}

export const taskBoardService = new TaskBoardService();
