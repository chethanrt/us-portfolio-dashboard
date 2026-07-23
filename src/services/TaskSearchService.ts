import type { Task } from "@/types";
import type { TaskLookups } from "./TaskFilterService";

/**
 * Case-insensitive task search (docs/11): matches task number, title,
 * description, labels, category, project name, assignee name, reporter
 * name and comment text.
 */
class TaskSearchService {
  search(tasks: Task[], query: string, lookups: TaskLookups): Task[] {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;

    return tasks.filter((task) => {
      const projectName = task.projectId ? lookups.projectsById.get(task.projectId)?.name ?? "" : "";
      const assigneeName = lookups.employeesById.get(task.assigneeId)?.name ?? "";
      const reporterName = lookups.employeesById.get(task.reporterId)?.name ?? "";
      const haystack = [
        task.taskNumber,
        task.title,
        task.description,
        task.category,
        projectName,
        assigneeName,
        reporterName,
        ...task.labels,
        ...task.comments.map((c) => c.message),
      ];
      return haystack.some((value) => value.toLowerCase().includes(q));
    });
  }
}

export const taskSearchService = new TaskSearchService();
