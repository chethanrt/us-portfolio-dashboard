import type { Task } from "@/types";
import type { TaskLookups } from "./TaskFilterService";

/**
 * CSV export of the current (filtered) task list (docs/11 Export).
 * Excel and PDF are future enhancements.
 */
class TaskExportService {
  toCSV(tasks: Task[], lookups: TaskLookups): string {
    const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const header = [
      "Task Number",
      "Title",
      "Type",
      "Project",
      "Category",
      "Assignee",
      "Reporter",
      "Priority",
      "Status",
      "Estimate Hours",
      "Actual Hours",
      "% Complete",
      "Start Date",
      "Due Date",
      "Completed Date",
      "Labels",
      "AI Tool",
      "Archived",
    ];
    const rows = tasks.map((task) => [
      task.taskNumber,
      task.title,
      task.type,
      task.projectId ? lookups.projectsById.get(task.projectId)?.name ?? task.projectId : "—",
      task.category,
      lookups.employeesById.get(task.assigneeId)?.name ?? task.assigneeId,
      lookups.employeesById.get(task.reporterId)?.name ?? task.reporterId,
      task.priority,
      task.status,
      task.estimateHours,
      task.actualHours,
      task.percentComplete,
      task.startDate,
      task.dueDate,
      task.completedDate,
      task.labels.join("; "),
      task.aiTool,
      task.archived ? "Yes" : "No",
    ]);
    return [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  }

  download(tasks: Task[], lookups: TaskLookups, filename = "task-board-export.csv"): void {
    const blob = new Blob([this.toCSV(tasks, lookups)], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

export const taskExportService = new TaskExportService();
